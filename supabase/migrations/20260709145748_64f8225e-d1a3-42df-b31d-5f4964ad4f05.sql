-- Add 'partner' to app_role enum and auto-create super admin admin@flexcard.pro
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='partner' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'partner';
  END IF;
END $$;

-- Ensure pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create super admin auth user if missing
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'admin@flexcard.pro';
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'admin@flexcard.pro', crypt(encode(gen_random_bytes(24),'base64'), gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Super","last_name":"Admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid, v_uid::text, jsonb_build_object('sub', v_uid::text, 'email','admin@flexcard.pro'), 'email', now(), now(), now());
  END IF;

  -- Grant admin role
  INSERT INTO public.user_roles(user_id, role) VALUES (v_uid, 'admin'::public.app_role) ON CONFLICT DO NOTHING;
END $$;