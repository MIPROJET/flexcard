REVOKE SELECT (email, premium_code, referral_code, referred_by) ON public.profiles FROM anon, authenticated;
REVOKE SELECT (premium_code) ON public.organizations FROM anon, authenticated;

GRANT SELECT (
  id, slug, kind, org_id, first_name, last_name, title, company, sector, description,
  avatar_url, cover_url, cover_type, public_email, website, city, country_code,
  socials, template_id, palette, has_premium, boost_until, created_at, updated_at
) ON public.profiles TO anon, authenticated;

GRANT SELECT (
  id, name, sector, logo_url, plan, has_premium_pack, owner_id, created_at, updated_at
) ON public.organizations TO anon, authenticated;