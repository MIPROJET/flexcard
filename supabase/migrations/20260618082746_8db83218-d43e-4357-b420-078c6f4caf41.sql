
-- 1) Lock down sensitive columns on profiles via column-level REVOKE.
REVOKE SELECT (email, premium_code, referral_code, referred_by) ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, slug, kind, org_id, first_name, last_name, title, company, sector, description,
  avatar_url, cover_url, cover_type, public_email, website, city, country_code, socials,
  template_id, palette, has_premium, boost_until, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- 2) Lock down organizations.premium_code via column-level REVOKE.
REVOKE SELECT (premium_code) ON public.organizations FROM anon, authenticated;
GRANT SELECT (id, name, sector, logo_url, plan, has_premium_pack, owner_id, created_at, updated_at)
  ON public.organizations TO anon, authenticated;

-- 3) Remove direct public INSERT on prospects; require register_contact_exchange RPC.
DROP POLICY IF EXISTS prospects_insert_public ON public.prospects;
REVOKE INSERT ON public.prospects FROM anon, authenticated;

-- 4) Remove direct public INSERT on analytics_events; route through SECURITY DEFINER RPC.
DROP POLICY IF EXISTS events_insert_public ON public.analytics_events;
REVOKE INSERT ON public.analytics_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_analytics_event(
  _profile_id uuid,
  _event_type text,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_meta jsonb;
BEGIN
  IF _profile_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _profile_id) THEN
    RETURN;
  END IF;

  v_type := lower(regexp_replace(coalesce(_event_type, ''), '[^a-z0-9_\-:.]', '', 'g'));
  IF length(v_type) = 0 OR length(v_type) > 64 THEN
    RAISE EXCEPTION 'INVALID_EVENT_TYPE';
  END IF;

  -- Cap metadata size to prevent abuse
  v_meta := coalesce(_metadata, '{}'::jsonb);
  IF length(v_meta::text) > 2048 THEN
    v_meta := '{}'::jsonb;
  END IF;

  INSERT INTO public.analytics_events (profile_id, event_type, metadata)
  VALUES (_profile_id, v_type, v_meta);
END;
$$;

REVOKE ALL ON FUNCTION public.register_analytics_event(uuid, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.register_analytics_event(uuid, text, jsonb) TO anon, authenticated;
