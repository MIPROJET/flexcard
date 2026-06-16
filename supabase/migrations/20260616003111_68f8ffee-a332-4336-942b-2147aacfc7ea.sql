
-- 1) profiles: hide sensitive columns from anon (publicly readable table)
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, slug, kind, first_name, last_name, title, company, sector, city,
  description, website, public_email, country_code, avatar_url, cover_url,
  cover_type, palette, socials, template_id, has_premium, boost_until,
  org_id, created_at, updated_at
) ON public.profiles TO anon, authenticated;
-- Owner needs full access (RLS still scopes to auth.uid() = id on update/delete)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
-- Re-restrict anon to safe columns only (the above grants full SELECT to authenticated,
-- but RLS profiles_select_all is permissive; restrict sensitive columns via a stricter policy)
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_public ON public.profiles
  FOR SELECT TO anon
  USING (true);
CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT TO authenticated
  USING (true);
-- Note: column-level GRANT to anon already excludes email/premium_code/referral_code/referred_by.
-- Authenticated users can read all columns of any profile through the wide GRANT, but that's
-- acceptable since email of a logged-in app user reading another profile is less sensitive than
-- public scraping. To also hide from authenticated non-owners, use a stricter column grant:
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, slug, kind, first_name, last_name, title, company, sector, city,
  description, website, public_email, country_code, avatar_url, cover_url,
  cover_type, palette, socials, template_id, has_premium, boost_until,
  org_id, created_at, updated_at
) ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
-- Owner can still read sensitive columns via a dedicated full-row policy + a view-less SELECT
-- on those columns: grant per-owner via a SECURITY DEFINER function if needed. The app reads
-- the current user's profile through `id = auth.uid()` which still works because anon doesn't
-- have those columns and authenticated also doesn't. To let owners see their own email/codes,
-- grant SELECT on those columns too — they're protected by RLS to the row, and authenticated
-- users could read other rows' sensitive columns. So instead we keep them ungranted to
-- authenticated and expose owner-only access through a SECURITY DEFINER RPC.
CREATE OR REPLACE FUNCTION public.get_my_profile_sensitive()
RETURNS TABLE(email text, premium_code text, referral_code text, referred_by uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email, premium_code, referral_code, referred_by
  FROM public.profiles
  WHERE id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile_sensitive() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile_sensitive() TO authenticated;

-- 2) prospects: owner-only SELECT
DROP POLICY IF EXISTS prospects_select_all ON public.prospects;
CREATE POLICY prospects_owner_select ON public.prospects
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.id = prospects.profile_id AND p.id = auth.uid()));

-- 3) organizations: hide premium_code from public via column grants
REVOKE SELECT ON public.organizations FROM anon, authenticated;
GRANT SELECT (
  id, owner_id, name, sector, logo_url, plan, has_premium_pack, created_at, updated_at
) ON public.organizations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
-- Owner can see premium_code via dedicated RPC
CREATE OR REPLACE FUNCTION public.get_my_org_premium_code(_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT premium_code FROM public.organizations
  WHERE id = _org_id AND owner_id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_org_premium_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_org_premium_code(uuid) TO authenticated;

-- 4) support_tickets: forbid filing under another user's profile_id
DROP POLICY IF EXISTS tickets_insert_public ON public.support_tickets;
CREATE POLICY tickets_insert_public ON public.support_tickets
  FOR INSERT TO anon, authenticated
  WITH CHECK (profile_id IS NULL OR profile_id = auth.uid());

-- 5) KYC bucket: owner UPDATE/DELETE
CREATE POLICY "KYC owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "KYC owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- 6) Realtime: remove sensitive tables from publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime DROP TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime DROP TABLE public.analytics_events;
