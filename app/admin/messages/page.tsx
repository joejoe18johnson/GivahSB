"use client";

import { useState, useEffect } from "react";
import { Mail, ChevronDown, ChevronUp } from "lucide-react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const formatDate = (s: string) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const subjectLabel = (value: string) => {
    const map: Record<string, string> = {
      campaign: "Campaign Question",
      verification: "Verification Help",
      payout: "Payout Question",
      technical: "Technical Support",
      other: "Other",
    };
    return map[value] ?? value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Loading messages…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <Mail className="w-7 h-7 text-primary-600" />
        Messages
      </h1>
      <p className="text-gray-600 mb-6">
        Messages sent by users via the contact form.
      </p>

      {messages.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          No messages yet.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
            >
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="flex-shrink-0 text-gray-400">
                  {expandedId === m.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{m.name}</span>
                  <span className="text-gray-500 mx-2">·</span>
                  <span className="text-gray-600 truncate">{m.email}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-primary-600">{subjectLabel(m.subject)}</span>
                </div>
                <span className="text-sm text-gray-500 flex-shrink-0">
                  {formatDate(m.created_at)}
                </span>
                {!m.read && (
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                    New
                  </span>
                )}
              </button>
              {expandedId === m.id && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                  <div className="mt-3 pl-8 text-gray-700 whitespace-pre-wrap">
                    {m.message}
                  </div>
                  <div className="mt-3 pl-8 text-sm">
                    <a
                      href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Reply to {m.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
