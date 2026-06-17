-- 1) profiles: hide sensitive columns at column-grant level
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, slug, first_name, last_name, title, company, sector, description,
  avatar_url, cover_url, cover_type, palette, socials, template_id,
  has_premium, boost_until, public_email, website, city, country_code,
  kind, org_id, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- 2) organizations: hide premium_code from public
REVOKE SELECT ON public.organizations FROM anon, authenticated;
GRANT SELECT (
  id, owner_id, name, sector, logo_url, plan, has_premium_pack, created_at, updated_at
) ON public.organizations TO anon, authenticated;

-- 3) Remove sensitive tables from realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='prospects') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.prospects';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='contact_links') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_links';
  END IF;
END $$;

-- 4) contact_links: tighten UPDATE policy + lock updatable columns
DROP POLICY IF EXISTS contact_links_public_update_download ON public.contact_links;
CREATE POLICY contact_links_owner_update
ON public.contact_links FOR UPDATE TO authenticated
USING (profile_id = auth.uid() OR scanner_profile_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (profile_id = auth.uid() OR scanner_profile_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE UPDATE ON public.contact_links FROM anon;
REVOKE UPDATE ON public.contact_links FROM authenticated;
GRANT UPDATE (vcard_downloaded_at, last_synced_at, contact_name, contact_email) ON public.contact_links TO authenticated;

-- 5) Realtime channel authorization: only allow subscribers to channels they own
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users subscribe to own topic" ON realtime.messages;
CREATE POLICY "Authenticated users subscribe to own topic"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = ('profile:' || auth.uid()::text)
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
);

-- 6) Revoke EXECUTE from anon on SECURITY DEFINER functions that should not be public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_profile_sensitive() FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_my_profile_sensitive() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_org_premium_code(uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_my_org_premium_code(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_referral_wallet(uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_referral_wallet(uuid) TO authenticated;

-- register_contact_exchange must stay anon-callable (public card visitors), keep as-is
REVOKE EXECUTE ON FUNCTION public.register_contact_exchange(uuid, text, text, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.register_contact_exchange(uuid, text, text, text, uuid) TO anon, authenticated;