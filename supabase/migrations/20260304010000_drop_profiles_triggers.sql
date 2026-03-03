-- Fix: "stack depth limit exceeded" when hearting (e.g. upserting profiles).
-- A trigger on public.profiles that updates/inserts profiles (or auth) can cause infinite recursion.
-- This drops any user-created triggers on profiles. The app does not rely on triggers on this table.

DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'profiles' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.profiles', trig.tgname);
  END LOOP;
END $$;
