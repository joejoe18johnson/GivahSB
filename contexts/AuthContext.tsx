"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  signInWithEmailSupabase,
  signInWithGoogleSupabase,
  signUpWithEmailSupabase,
  signOutSupabase,
  updateUserProfileSupabase,
  supabaseUserToProfile,
  UserProfile,
} from "@/lib/supabase/auth";

interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  role?: "user" | "admin";
  status?: "active" | "on_hold" | "deleted";
  birthday?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  phonePending?: boolean;
  idDocument?: string;
  idDocumentType?: "social_security" | "passport";
  idPending?: boolean;
  addressDocument?: string;
  addressPending?: boolean;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  adminCheckDone: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string, phoneNumber?: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileToUser(profile: UserProfile): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    verified: profile.verified,
    idVerified: profile.idVerified,
    addressVerified: profile.addressVerified,
    role: profile.role,
    status: profile.status,
    birthday: profile.birthday,
    phoneNumber: profile.phoneNumber,
    phoneVerified: profile.phoneVerified,
    phonePending: profile.phonePending,
    idDocument: profile.idDocument,
    idDocumentType: profile.idDocumentType,
    idPending: profile.idPending,
    addressDocument: profile.addressDocument,
    addressPending: profile.addressPending,
    profilePhoto: profile.profilePhoto,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverAdminCheck, setServerAdminCheck] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const profile = await supabaseUserToProfile(supabase, session.user);
          if (profile) setUser(profileToUser(profile));
          else setUser(null);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const profile = await supabaseUserToProfile(supabase, session.user);
          if (profile) setUser(profileToUser(profile));
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    })();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setServerAdminCheck(null);
      return;
    }
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setServerAdminCheck(false);
    }, 5000);
    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/check-admin", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = res.ok ? await res.json() : { isAdmin: false };
        if (!cancelled && typeof data.isAdmin === "boolean") setServerAdminCheck(data.isAdmin);
      } catch {
        if (!cancelled) setServerAdminCheck(false);
      } finally {
        clearTimeout(timeoutId);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [user?.id]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      const profile = await signInWithEmailSupabase(supabase, email, password);
      setUser(profileToUser(profile));
      return true;
    } catch (e) {
      console.error("Login error:", e);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    const supabase = createClient();
    await signInWithGoogleSupabase(supabase);
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    phoneNumber?: string
  ): Promise<boolean> => {
    try {
      const supabase = createClient();
      const profile = await signUpWithEmailSupabase(supabase, email, password, name, phoneNumber);
      setUser(profileToUser(profile));
      return true;
    } catch (e) {
      console.error("Signup error:", e);
      return false;
    }
  };

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const supabase = createClient();
      await updateUserProfileSupabase(supabase, user.id, updates as Partial<UserProfile>);
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (e) {
      console.error("Error updating user:", e);
      throw e;
    }
  }, [user]);

  const logout = async () => {
    try {
      const supabase = createClient();
      await signOutSupabase(supabase);
      setUser(null);
      router.push("/");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const isAdmin = (user?.role === "admin") || serverAdminCheck === true;
  const adminCheckDone = user === null || serverAdminCheck !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        adminCheckDone,
        login,
        loginWithGoogle,
        signup,
        updateUser,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
