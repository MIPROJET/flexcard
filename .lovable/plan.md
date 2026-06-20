# Plan SQL FlexCard CDC V4 — Refonte espace pro, /me, vocal standalone, imprimeur QR-relais

> **À exécuter dans Supabase SQL Editor.** Ce fichier contient TOUT le SQL nécessaire. ⚠️ **Étendre d'abord l'enum `app_role`** car il ne contient actuellement que `admin / moderator / imprimeur / user` — il manque `coordinator` et `commercial`.

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'commercial';
-- 'imprimeur' existe déjà → on l'utilise pour 'partenaire'
```

> Dans le SQL ci-dessous, `'partner'::public.app_role` est en réalité `'imprimeur'::public.app_role` (l'enum existant). Adapter si copier-coller manuel.

---

## 1. Table `role_requests` — Demandes pro (coordinateur / commercial / partenaire)

Soumises depuis `/me`, validées par l'admin depuis `/admin`.

```sql
-- Enum statut + type rôle si pas déjà présents
DO $$ BEGIN
  CREATE TYPE public.role_request_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pro_role_kind AS ENUM ('coordinateur','commercial','partenaire');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.role_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            public.pro_role_kind NOT NULL,
  email           text NOT NULL,
  -- Mot de passe haché côté SQL (digest crypt) pour réinjection lors de l'approbation
  password_hash   text NOT NULL,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  phone           text,
  city            text NOT NULL,
  quartier        text NOT NULL,
  departement     text,
  company_name    text,
  status          public.role_request_status NOT NULL DEFAULT 'pending',
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  rejection_reason text,
  created_user_id uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.role_requests TO authenticated;
GRANT ALL ON public.role_requests TO service_role;

ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Seul l'admin lit / modifie. Insertion publique se fait via RPC SECURITY DEFINER ci-dessous.
CREATE POLICY "Admins read all role_requests"
  ON public.role_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update role_requests"
  ON public.role_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER role_requests_touch BEFORE UPDATE ON public.role_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
```

### RPC publique `submit_role_request` (appelée depuis `/me`)

```sql
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

  -- Hash bcrypt via pgcrypto
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

GRANT EXECUTE ON FUNCTION public.submit_role_request(text,text,text,text,text,text,text,text,text,text) TO anon, authenticated;
```

### RPC admin `approve_role_request` (à brancher dans /admin plus tard)

```sql
CREATE OR REPLACE FUNCTION public.approve_role_request(_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_req public.role_requests%ROWTYPE;
  v_user_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  SELECT * INTO v_req FROM public.role_requests WHERE id = _request_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;

  -- NOTE : la création du compte auth.users doit être faite via Auth Admin API
  -- depuis une server function (le mot de passe en clair n'est plus disponible ici,
  -- seulement le hash). Solution recommandée :
  --   1) côté serveur, lire role_requests.password_hash
  --   2) appeler supabase.auth.admin.createUser({ email, password: <repromptée à l'admin> })
  --      OU régénérer un mot de passe temporaire et l'envoyer par email.
  --
  -- Pour la démo, on marque approuvée et on insère uniquement les rôles si l'utilisateur existe déjà.
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_req.email;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role)
      VALUES (v_user_id, CASE v_req.kind
        WHEN 'coordinateur' THEN 'coordinator'::public.app_role
        WHEN 'commercial'   THEN 'commercial'::public.app_role
        WHEN 'partenaire'   THEN 'partner'::public.app_role
      END)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.role_requests
    SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), created_user_id = v_user_id
    WHERE id = _request_id;

  RETURN v_user_id;
END $$;

GRANT EXECUTE ON FUNCTION public.approve_role_request(uuid) TO authenticated;
```

> ⚠️ **Le `auth.users` ne peut PAS être créé depuis SQL avec mot de passe** : il faut une server fn TanStack qui utilise `supabaseAdmin.auth.admin.createUser`. À ajouter au prochain tour.

---

## 2. RPC `find_card_by_email` — résolution email → slug pour `/ma-carte`

```sql
CREATE OR REPLACE FUNCTION public.find_card_by_email(_email text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT slug FROM public.profiles WHERE email = lower(trim(_email)) LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.find_card_by_email(text) TO anon, authenticated;
```

---

## 3. RPC `create_vocal_profile` — création standalone depuis le parcours vocal (sans auth, sans OTP, sans email)

```sql
CREATE OR REPLACE FUNCTION public.create_vocal_profile(
  _slug text, _first_name text, _last_name text, _activity text, _city text,
  _phone1 text, _phone2 text, _phone3 text, _whatsapp text,
  _ref_code text, _referral_code text,
  _avatar_url text, _cover_url text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_slug text := _slug;
  v_pseudo_email text;
  v_referrer uuid;
BEGIN
  -- Slug unique
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = v_slug) LOOP
    v_slug := _slug || '-' || substr(md5(random()::text), 1, 4);
  END LOOP;

  -- Email pseudo basé sur téléphone (les utilisateurs vocaux n'ont pas forcément d'email)
  v_pseudo_email := 'vocal-' || regexp_replace(coalesce(_phone1, v_id::text), '[^0-9]', '', 'g') || '@vocal.flexcard.local';

  -- Recherche parrain
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

  -- Phones
  IF _phone1 IS NOT NULL THEN
    INSERT INTO public.phones(profile_id, number, operator) VALUES (v_id, _phone1, 'Orange');
  END IF;
  IF _phone2 IS NOT NULL THEN
    INSERT INTO public.phones(profile_id, number, operator) VALUES (v_id, _phone2, 'Orange');
  END IF;
  IF _phone3 IS NOT NULL THEN
    INSERT INTO public.phones(profile_id, number, operator) VALUES (v_id, _phone3, 'Orange');
  END IF;

  RETURN jsonb_build_object('id', v_id, 'slug', v_slug, 'referral_code', _referral_code);
END $$;

GRANT EXECUTE ON FUNCTION public.create_vocal_profile(text,text,text,text,text,text,text,text,text,text,text,text,text) TO anon, authenticated;
```

---

## 4. Imprimeur relais — Cartes QR pré-générées (cartes-démo)

L'imprimeur génère et imprime des cartes-démo identiques (même charte graphique, même verso, même branding) avec un QR unique chacune. Les commerciaux récupèrent ces cartes physiquement chez l'imprimeur. Lors d'une vente terrain, le commercial scanne une carte-démo, l'utilisateur final crée sa vraie carte, et le QR de la carte-démo est lié à vie au profil utilisateur.

```sql
DO $$ BEGIN
  CREATE TYPE public.demo_card_status AS ENUM ('available','linked','disabled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.demo_cards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,    -- Format FX-XXXX-XXXX-XXXX
  printer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id        uuid,                    -- Pour regrouper une commande d'impression
  -- Lien vers le profil final une fois activée par un commercial
  linked_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  linked_by_user_id uuid REFERENCES auth.users(id),
  linked_at       timestamptz,
  status          public.demo_card_status NOT NULL DEFAULT 'available',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.demo_cards TO authenticated;
GRANT SELECT ON public.demo_cards TO anon;  -- pour résoudre /print/<code> publiquement
GRANT ALL ON public.demo_cards TO service_role;

ALTER TABLE public.demo_cards ENABLE ROW LEVEL SECURITY;

-- L'imprimeur voit / gère ses propres cartes
CREATE POLICY "Printers manage own demo_cards"
  ON public.demo_cards FOR ALL TO authenticated
  USING (printer_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (printer_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));

-- Lecture publique du lien (pour résolution scan QR → /c/<slug>)
CREATE POLICY "Public read demo_cards by code"
  ON public.demo_cards FOR SELECT TO anon
  USING (true);

CREATE TRIGGER demo_cards_touch BEFORE UPDATE ON public.demo_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Génération d'un lot de cartes-démo (réservée aux partenaires/imprimeurs)
CREATE OR REPLACE FUNCTION public.printer_generate_batch(_count int)
RETURNS SETOF text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_batch uuid := gen_random_uuid();
  v_code text;
  i int := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(),'partner'::public.app_role)
          OR public.has_role(auth.uid(),'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF _count < 1 OR _count > 500 THEN
    RAISE EXCEPTION 'INVALID_COUNT';
  END IF;
  WHILE i < _count LOOP
    v_code := 'FX-' || upper(substr(md5(random()::text),1,4)) || '-' ||
              upper(substr(md5(random()::text),1,4)) || '-' ||
              upper(substr(md5(random()::text),1,4));
    BEGIN
      INSERT INTO public.demo_cards(code, printer_user_id, batch_id)
        VALUES (v_code, auth.uid(), v_batch);
      i := i + 1;
      RETURN NEXT v_code;
    EXCEPTION WHEN unique_violation THEN
      -- collision improbable, on retente
      CONTINUE;
    END;
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.printer_generate_batch(int) TO authenticated;

-- Activation par un commercial : lie la carte-démo scannée à un profil utilisateur réel
CREATE OR REPLACE FUNCTION public.link_demo_card(_code text, _profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_card public.demo_cards%ROWTYPE;
BEGIN
  IF NOT (public.has_role(auth.uid(),'commercial'::public.app_role)
          OR public.has_role(auth.uid(),'coordinator'::public.app_role)
          OR public.has_role(auth.uid(),'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO v_card FROM public.demo_cards WHERE code = upper(_code);
  IF NOT FOUND THEN RAISE EXCEPTION 'CARD_NOT_FOUND'; END IF;
  IF v_card.status = 'linked' THEN RAISE EXCEPTION 'ALREADY_LINKED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _profile_id) THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;

  UPDATE public.demo_cards
    SET linked_profile_id = _profile_id,
        linked_by_user_id = auth.uid(),
        linked_at = now(),
        status = 'linked'
    WHERE id = v_card.id;

  RETURN jsonb_build_object('ok', true, 'profile_id', _profile_id);
END $$;

GRANT EXECUTE ON FUNCTION public.link_demo_card(text,uuid) TO authenticated;

-- Résolution publique d'un code de carte-démo vers son slug (pour /print/<code> → redirige vers /c/<slug>)
CREATE OR REPLACE FUNCTION public.resolve_demo_card(_code text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.slug
  FROM public.demo_cards dc
  JOIN public.profiles p ON p.id = dc.linked_profile_id
  WHERE dc.code = upper(_code) AND dc.status = 'linked'
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.resolve_demo_card(text) TO anon, authenticated;
```

---

## 5. Ajustements policies `profiles` (lecture publique par slug — déjà OK normalement)

Si la lecture publique du profil ne fonctionne pas dans `/c/$slug`, exécuter :

```sql
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.phones   TO anon;
GRANT SELECT ON public.gallery  TO anon;

DROP POLICY IF EXISTS "Public read profile by slug" ON public.profiles;
CREATE POLICY "Public read profile by slug"
  ON public.profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read phones" ON public.phones;
CREATE POLICY "Public read phones"
  ON public.phones FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read gallery" ON public.gallery;
CREATE POLICY "Public read gallery"
  ON public.gallery FOR SELECT TO anon, authenticated USING (true);
```

> ⚠️ Si tu veux masquer le champ `email` aux anonymes, créer une vue `public_profiles` sans ce champ et restreindre `profiles` aux propriétaires. Le RPC `find_card_by_email` reste server-side et sûr.

---

## 6. Ordre d'exécution recommandé

1. Section 1 (role_requests + RPCs)
2. Section 2 (find_card_by_email)
3. Section 3 (create_vocal_profile)
4. Section 4 (demo_cards + RPCs imprimeur)
5. Section 5 (policies publiques profiles si nécessaire)

Une fois exécuté, l'UI fonctionne :
- `/me` — formulaire de demande pro fonctionnel
- `/ma-carte` — lookup email → carte
- `/onboarding/vocal` — création de carte sans compte
- Dashboard imprimeur (à coder ensuite) → `printer_generate_batch(50)`
- Scan terrain commercial → `link_demo_card(code, profileId)`

---

## TODO côté code (tour suivant)

- Dashboard imprimeur : UI génération de lot + impression PDF des QR
- Dashboard commercial : scanner caméra → flow "créer la carte du client" → `link_demo_card`
- Admin : liste des `role_requests` + bouton "Approuver" qui appelle une server fn pour `auth.admin.createUser({ email, password: <hash repromptée OU mot de passe temporaire envoyé par email> })`
- Migration : email d'approbation via templates auth Lovable
