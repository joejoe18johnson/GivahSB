-- Fix: "record \"new\" has no field \"email\"" when updating campaign totals.
-- A trigger on public.campaigns may reference NEW.email, but campaigns has no email column.
-- This drops any user-created triggers on campaigns (e.g. one added in Dashboard by mistake).
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'campaigns'
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.campaigns', trig.tgname);
  END LOOP;
END $$;
