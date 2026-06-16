
-- 1. Fix function search_path on all SECURITY DEFINER / public functions
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin new.updated_at = now(); return new; end
$function$;

-- 2. Revoke EXECUTE from public/anon/authenticated on SECURITY DEFINER functions,
--    then grant only what is needed.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- 3. Tighten overly-permissive INSERT/UPDATE/DELETE RLS policies (WITH CHECK true)
-- prospects: require a real profile target
DROP POLICY IF EXISTS prospects_insert_all ON public.prospects;
CREATE POLICY prospects_insert_public ON public.prospects
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = prospects.profile_id));

-- support_tickets: require valid profile_id when present, otherwise authenticated/anon contact
DROP POLICY IF EXISTS tickets_insert_all ON public.support_tickets;
CREATE POLICY tickets_insert_public ON public.support_tickets
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    profile_id IS NULL
    OR profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = support_tickets.profile_id)
  );

-- analytics_events: must target a real profile
DROP POLICY IF EXISTS events_insert_all ON public.analytics_events;
CREATE POLICY events_insert_public ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    profile_id IS NULL
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = analytics_events.profile_id)
  );
