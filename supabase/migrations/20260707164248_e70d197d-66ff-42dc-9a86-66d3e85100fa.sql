-- 1) Track submit_role_request in migrations (idempotent CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.submit_role_request(
  _kind text, _email text, _password text,
  _first_name text, _last_name text, _phone text,
  _city text, _quartier text, _departement text, _company_name text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_id uuid;
  v_hash text;
BEGIN
  IF length(coalesce(_email,'')) < 5 OR position('@' in _email) = 0 THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;
  IF length(coalesce(_password,'')) < 8 THEN
    RAISE EXCEPTION 'PASSWORD_TOO_SHORT';
  END IF;

  v_hash := extensions.crypt(_password, extensions.gen_salt('bf', 10));

  INSERT INTO public.role_requests(
    kind, email, password_hash, first_name, last_name, phone,
    city, quartier, departement, company_name
  ) VALUES (
    _kind::public.pro_role_kind, lower(trim(_email)), v_hash,
    trim(_first_name), trim(_last_name), nullif(trim(_phone),''),
    trim(_city), trim(_quartier), nullif(trim(_departement),''),
    nullif(trim(_company_name),'')
  ) RETURNING id INTO v_id;

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.submit_role_request(text,text,text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_role_request(text,text,text,text,text,text,text,text,text,text) TO anon, authenticated;

-- 2) Lock down demo_cards: no bulk anon reads. Public lookup goes through resolve_demo_card (SECURITY DEFINER).
DROP POLICY IF EXISTS "Public read demo_cards by code" ON public.demo_cards;
REVOKE SELECT ON public.demo_cards FROM anon;