# FlexCard — Plan d'exécution V3

## 1. Domaine `flexcard.ivoireprojet.com` (404)

La capture montre **NOT_FOUND Vercel** : le DNS pointe encore vers un projet Vercel. FlexCard est hébergé sur **Lovable** (`flexcard-ci.lovable.app`).

**Action requise (DNS — côté utilisateur, pas modifiable par code) :**
1. Lovable → **Project Settings → Domains → Connect Domain** → `flexcard.ivoireprojet.com`
2. Lovable affichera les enregistrements DNS à créer (A record vers `185.158.133.1` + TXT `_lovable`)
3. Supprimer chez le registrar `ivoireprojet.com` l'ancien enregistrement qui pointe vers Vercel
4. Ajouter aussi `www.flexcard.ivoireprojet.com` si besoin
5. Attendre propagation (1-24h). SSL auto-provisionné par Lovable.

Cf. docs : https://docs.lovable.dev/features/custom-domain

---

## 2. SQL à exécuter manuellement dans Supabase SQL Editor

> Ouvre : https://supabase.com/dashboard/project/oboljtsnpmxwvirfzdft/sql/new
> Colle **tout le bloc ci-dessous** et clique « Run ».
> Le script est **idempotent** : tu peux le relancer sans erreur.

```sql
-- =========================================================
-- FlexCard — Seed compte Inocent KOFFI + 50 prospects démo
-- =========================================================

-- Pré-requis : pgcrypto pour crypt() (déjà installé sur Supabase)
create extension if not exists pgcrypto;

-- UUID fixe pour Inocent (réutilisable)
do $$
declare
  v_user_id uuid := 'a1111111-1111-1111-1111-111111111111';
  v_email   text := 'inocent.koffi@ivoireprojet.com';
  v_password text := 'FlexCard2026!'; -- À CHANGER après 1ère connexion
begin
  -- 1) Création du compte auth.users (ou mise à jour si existe)
  if not exists (select 1 from auth.users where id = v_user_id) then
    insert into auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object(
        'first_name','Inocent',
        'last_name','KOFFI',
        'slug','inocent-koffi'
      ),
      now(), now(), '', '', '', ''
    );

    -- identité email obligatoire pour login password
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email', v_email,
      now(), now(), now()
    );
  else
    -- déjà créé : on confirme l'email et on reset le mot de passe
    update auth.users
       set encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = v_user_id;
  end if;
end $$;

-- 2) Le trigger handle_new_user a créé le profile + user_role. On enrichit.
update public.profiles set
  slug           = 'inocent-koffi',
  first_name     = 'Inocent',
  last_name      = 'KOFFI',
  kind           = 'entreprise',
  title          = 'Gérant AgriCapital · Initiateur FlexCard · Développeur Web',
  company        = 'AgriCapital SARL',
  sector         = 'Agriculture & Tech',
  description    = 'Initiateur de FlexCard — la carte de visite digitale d''Afrique. Gérant d''AgriCapital, projet d''investissement dans le palmier à huile et les cultures industrielles en Côte d''Ivoire. Développeur web passionné, je conçois des solutions numériques utiles, accessibles et fidèles à la réalité du terrain africain.',
  avatar_url     = '/__l5e/assets-v1/66d07b87-a595-44db-ac50-f728238c13d5/inocent-koffi-avatar.jpg',
  cover_url      = '/__l5e/assets-v1/d90e5b93-7b64-4d49-91f3-8d3e09745848/inocent-koffi-cover.png',
  cover_type     = 'image',
  public_email   = 'inocent.koffi@ivoireprojet.com',
  website        = 'https://ikoffi.agricapital.ci',
  city           = 'Daloa, Côte d''Ivoire',
  country_code   = '+225',
  socials        = jsonb_build_object(
    'whatsapp',  '+2250759566087',
    'linkedin',  'inocent-k-4a08b7159',
    'facebook',  'inocent.koffi.2025'
  ),
  template_id    = 'vkard-premium-nfc',
  palette        = jsonb_build_object('primary','#1d4ed8','accent','#f59e0b','ink','#0a1a3a'),
  has_premium    = true,
  premium_code   = 'FX-IKNV-2026-PREM',
  updated_at     = now()
where id = 'a1111111-1111-1111-1111-111111111111';

-- 3) Rôle admin
insert into public.user_roles (user_id, role)
values ('a1111111-1111-1111-1111-111111111111', 'admin')
on conflict do nothing;

-- 4) Téléphones (3 numéros)
delete from public.phones where profile_id = 'a1111111-1111-1111-1111-111111111111';
insert into public.phones (profile_id, number, operator, position) values
  ('a1111111-1111-1111-1111-111111111111', '+2250759566087', 'Orange',   0),
  ('a1111111-1111-1111-1111-111111111111', '+2250171296572', 'MTN',      1),
  ('a1111111-1111-1111-1111-111111111111', '+2250556494467', 'Moov',     2);

-- 5) 50 prospects démo
delete from public.prospects where profile_id = 'a1111111-1111-1111-1111-111111111111';

insert into public.prospects (profile_id, scanner_phone, contact_name, contact_email, visits, first_scan_at, last_visit_at)
select
  'a1111111-1111-1111-1111-111111111111',
  '+225' || lpad((7000000000 + (random()*2999999999)::bigint)::text, 10, '0'),
  (array['Kouadio','Yao','Aya','Adjoua','Konan','Brou','N''Guessan','Diabaté','Touré','Coulibaly','Bamba','Ouattara','Koné','Traoré','Soro','Cissé','Diallo','Bakayoko','Fofana','Sangaré'])[1+floor(random()*20)::int]
  || ' ' ||
  (array['Marc','Jean','Awa','Mariam','Fatou','Ibrahim','Aminata','Salif','Moussa','Kadidja','Sékou','Aïcha','Boubacar','Rokia','Drissa','Mamadou','Bintou','Adama','Issouf','Habiba'])[1+floor(random()*20)::int],
  case when random() < 0.6
       then lower((array['kouadio','yao','aya','konan','brou','toure'])[1+floor(random()*6)::int]) || floor(random()*999)::int || '@gmail.com'
       else null end,
  1 + floor(random()*8)::int,
  now() - (random() * interval '90 days'),
  now() - (random() * interval '15 days')
from generate_series(1, 50);

-- 6) Compteurs UI cohérents : assure-toi qu'il y a au moins 34 profils, 8 premium, 9 pros
-- (les autres profils existent déjà via le seed initial; pas d'insertion ici)

-- =========================================================
-- VERIFICATIONS
-- =========================================================
select 'profile' as t, slug, first_name||' '||last_name as name, has_premium, premium_code
  from public.profiles where id = 'a1111111-1111-1111-1111-111111111111';
select 'phones' as t, count(*) from public.phones where profile_id = 'a1111111-1111-1111-1111-111111111111';
select 'prospects' as t, count(*) from public.prospects where profile_id = 'a1111111-1111-1111-1111-111111111111';
select 'roles' as t, role from public.user_roles where user_id = 'a1111111-1111-1111-1111-111111111111';
```

### Connexion

- Email : `inocent.koffi@ivoireprojet.com`
- Mot de passe : `FlexCard2026!` *(à changer après la 1ère connexion)*
- Profil public : `/c/inocent-koffi`
- Code premium : `FX-IKNV-2026-PREM`
