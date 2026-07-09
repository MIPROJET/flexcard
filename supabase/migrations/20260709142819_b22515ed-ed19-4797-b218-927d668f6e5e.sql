
-- 1. payments: revoke INSERT, drop owner_insert policy
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;
DROP POLICY IF EXISTS payments_owner_insert ON public.payments;

-- 2. withdrawals: revoke INSERT, drop owner_insert policy, add validated RPC
REVOKE INSERT, UPDATE, DELETE ON public.withdrawals FROM anon, authenticated;
DROP POLICY IF EXISTS withdrawals_owner_insert ON public.withdrawals;

CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount_xof integer, _wave_number text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_balance integer;
  v_number text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF _amount_xof IS NULL OR _amount_xof < 1000 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;

  v_number := regexp_replace(coalesce(_wave_number,''), '[^0-9+]', '', 'g');
  IF length(regexp_replace(v_number, '[^0-9]', '', 'g')) < 8 THEN
    RAISE EXCEPTION 'INVALID_WAVE_NUMBER';
  END IF;

  SELECT balance_xof INTO v_balance FROM public.get_referral_wallet(v_uid);
  IF v_balance IS NULL OR _amount_xof > v_balance THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  INSERT INTO public.withdrawals (profile_id, amount_xof, wave_number, status)
  VALUES (v_uid, _amount_xof, v_number, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(integer, text) TO authenticated;

-- 3. demo_cards: revoke any anon SELECT explicitly (public scan still uses SECURITY DEFINER resolve_demo_card RPC)
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.demo_cards FROM anon;

-- 4. role_requests: drop stored password_hash column and rewrite submit_role_request to not accept a password.
--    Approved requests are provisioned server-side by an admin with a fresh temporary password (out-of-band flow).
ALTER TABLE public.role_requests DROP COLUMN IF EXISTS password_hash;

DROP FUNCTION IF EXISTS public.submit_role_request(text,text,text,text,text,text,text,text,text,text);

CREATE OR REPLACE FUNCTION public.submit_role_request(
  _kind text, _email text,
  _first_name text, _last_name text, _phone text,
  _city text, _quartier text, _departement text, _company_name text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF length(coalesce(_email,'')) < 5 OR position('@' in _email) = 0 THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;

  INSERT INTO public.role_requests(
    kind, email, first_name, last_name, phone,
    city, quartier, departement, company_name
  ) VALUES (
    _kind::public.pro_role_kind, lower(trim(_email)),
    trim(_first_name), trim(_last_name), nullif(trim(_phone),''),
    trim(_city), trim(_quartier), nullif(trim(_departement),''),
    nullif(trim(_company_name),'')
  ) RETURNING id INTO v_id;

  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.submit_role_request(text,text,text,text,text,text,text,text,text) TO anon, authenticated;
