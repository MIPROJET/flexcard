CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_id uuid := '11111111-1111-1111-1111-111111111111';
  v_inocent_id uuid := 'a1111111-1111-1111-1111-111111111111';
BEGIN
  -- Update existing Inocent auth user with the real email + confirm
  UPDATE auth.users
  SET email = 'inocent.koffi@agricapital.ci',
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('first_name','Inocent','last_name','KOFFI','slug','inocent-koffi'),
      updated_at = now()
  WHERE id = v_inocent_id;

  UPDATE auth.identities
  SET identity_data = jsonb_build_object('sub', v_inocent_id::text, 'email', 'inocent.koffi@agricapital.ci', 'email_verified', true),
      provider_id = v_inocent_id::text,
      updated_at = now()
  WHERE user_id = v_inocent_id AND provider = 'email';

  -- Ensure email identity exists
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_inocent_id AND provider = 'email') THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_inocent_id,
      jsonb_build_object('sub', v_inocent_id::text, 'email', 'inocent.koffi@agricapital.ci', 'email_verified', true),
      'email', v_inocent_id::text, now(), now(), now());
  END IF;

  -- Update the existing Inocent profile with real-world data
  UPDATE public.profiles SET
    email = 'inocent.koffi@agricapital.ci',
    first_name = 'Inocent',
    last_name = 'KOFFI',
    title = 'Fondateur',
    company = 'AgriCapital',
    sector = 'Finance & Agriculture',
    city = 'Abidjan',
    kind = 'entreprise',
    description = 'Fondateur d''AgriCapital — financement intelligent pour l''agriculture africaine en Côte d''Ivoire.'
  WHERE id = v_inocent_id;

  -- Admin user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@flexcard.pro') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
      'admin@flexcard.pro',
      crypt('@Flexcard26', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name','Admin','last_name','FlexCard','slug','admin-flexcard'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@flexcard.pro', 'email_verified', true),
      'email', v_admin_id::text, now(), now(), now());
  END IF;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  SELECT v_admin_id, 'admin'::public.app_role
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_admin_id AND role = 'admin');
END $$;