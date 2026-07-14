-- Public read for vocal-uploaded assets, anon insert restricted to vocal/ folder
DROP POLICY IF EXISTS "flexcard-public vocal read" ON storage.objects;
CREATE POLICY "flexcard-public vocal read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'flexcard-public'
  AND (storage.foldername(name))[1] = 'vocal'
);

DROP POLICY IF EXISTS "flexcard-public vocal insert" ON storage.objects;
CREATE POLICY "flexcard-public vocal insert"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'flexcard-public'
  AND (storage.foldername(name))[1] = 'vocal'
);

-- Extend create_vocal_profile to persist gallery
CREATE OR REPLACE FUNCTION public.create_vocal_profile(
  _slug text,
  _first_name text,
  _last_name text,
  _activity text,
  _city text,
  _phone1 text,
  _phone2 text,
  _phone3 text,
  _whatsapp text,
  _ref_code text,
  _referral_code text,
  _avatar_url text,
  _cover_url text,
  _gallery text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid := gen_random_uuid();
  v_slug text := _slug;
  v_pseudo_email text;
  v_referrer uuid;
  v_url text;
  v_pos int := 0;
BEGIN
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = v_slug) LOOP
    v_slug := _slug || '-' || substr(md5(random()::text), 1, 4);
  END LOOP;

  v_pseudo_email := 'vocal-' || regexp_replace(coalesce(_phone1, v_id::text), '[^0-9]', '', 'g') || '@vocal.flexcard.local';

  IF _ref_code IS NOT NULL AND length(_ref_code) = 6 THEN
    SELECT id INTO v_referrer FROM public.profiles WHERE referral_code = _ref_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles(
    id, slug, email, kind, first_name, last_name, title, sector, city,
    socials, palette, has_premium, template_id, referral_code, referred_by,
    avatar_url, cover_url
  ) VALUES (
    v_id, v_slug, v_pseudo_email, 'informel'::public.account_kind,
    trim(_first_name), trim(_last_name), _activity, coalesce(_activity,'Autre'), _city,
    CASE WHEN _whatsapp IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('whatsapp', _whatsapp) END,
    '{"primary":"#0066FF","accent":"#FF6B00","ink":"#0B1220"}'::jsonb,
    true, 'neon', _referral_code, v_referrer,
    _avatar_url, _cover_url
  );

  IF _phone1 IS NOT NULL THEN INSERT INTO public.phones(profile_id, number, operator) VALUES (v_id, _phone1, 'Orange'); END IF;
  IF _phone2 IS NOT NULL THEN INSERT INTO public.phones(profile_id, number, operator) VALUES (v_id, _phone2, 'Orange'); END IF;
  IF _phone3 IS NOT NULL THEN INSERT INTO public.phones(profile_id, number, operator) VALUES (v_id, _phone3, 'Orange'); END IF;

  IF _gallery IS NOT NULL THEN
    FOREACH v_url IN ARRAY _gallery LOOP
      IF v_url IS NOT NULL AND length(v_url) > 0 THEN
        INSERT INTO public.gallery(profile_id, category, url, media_type, position)
        VALUES (v_id, 'photos'::public.gallery_category, v_url, 'image'::public.gallery_media_type, v_pos);
        v_pos := v_pos + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('id', v_id, 'slug', v_slug, 'referral_code', _referral_code);
END $function$;

GRANT EXECUTE ON FUNCTION public.create_vocal_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,text[]) TO anon, authenticated;