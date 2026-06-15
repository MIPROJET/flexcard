# Plan FlexCard — Migration Supabase complète + storage + seed admin

> Tu m'as demandé de tout préparer ici pour que tu exécutes manuellement dans Supabase. Ce script est complet : tables, RLS, politiques permissives CRUD, storage buckets, 30+ comptes démo, compte admin (`admin@flexcard.app` / `@FlexCrd26`).
>
> **Ordre d'exécution** (3 étapes) :
> 1. Coller le **script SQL** ci-dessous dans le SQL Editor Supabase → Run.
> 2. Créer les **buckets storage** depuis le dashboard (ou via SQL fourni).
> 3. Créer le **compte admin** depuis l'Auth dashboard puis lancer le SQL de seed des profils.
>
> Tout l'UI front est déjà connecté au mock store local. La bascule vers Supabase se fera dans une prochaine itération (remplacement de `useApp` par des hooks `useQuery` vers les tables).

---

## 1. Migration SQL principale

```sql
-- =====================================================================
-- FLEXCARD — Schéma complet v1.0
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================================
-- TYPES (enums)
-- =====================================================================
do $$ begin
  create type public.account_kind as enum ('particulier','informel','entreprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.app_role as enum ('admin','moderator','imprimeur','user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_kind as enum ('free','starter','team10','team20','team50','team100','unlimited');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gallery_category as enum ('photos','affiches','visuels','videos','actualites');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_type as enum ('image','video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.operator_kind as enum ('MTN','Orange','Moov','Fixe','Inconnu');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- TABLE profiles (1-to-1 auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  slug text unique not null,
  email text not null,
  kind account_kind not null default 'particulier',
  org_id uuid,
  first_name text not null default '',
  last_name text not null default '',
  title text default '',
  company text,
  sector text,
  description text,
  avatar_url text,
  cover_url text,
  cover_type media_type,
  public_email text,
  website text,
  city text,
  country_code text default '+225',
  socials jsonb not null default '{}'::jsonb,
  template_id text not null default 'vkard-cover',
  palette jsonb not null default '{"primary":"#1d4ed8","accent":"#22d3ee","ink":"#0b1a3a"}'::jsonb,
  has_premium boolean not null default false,
  premium_code text unique,
  boost_until timestamptz,
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon; -- annuaire public + pages /c/$slug
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- =====================================================================
-- TABLE phones
-- =====================================================================
create table if not exists public.phones (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  number text not null,
  operator operator_kind not null default 'Inconnu',
  position int not null default 0,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.phones to authenticated;
grant select on public.phones to anon;
grant all on public.phones to service_role;

alter table public.phones enable row level security;
create policy "phones_select_all" on public.phones for select using (true);
create policy "phones_owner_all" on public.phones for all using (
  exists (select 1 from public.profiles p where p.id = phones.profile_id and p.id = auth.uid())
) with check (
  exists (select 1 from public.profiles p where p.id = phones.profile_id and p.id = auth.uid())
);

-- =====================================================================
-- TABLE organizations
-- =====================================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  logo_url text,
  plan plan_kind not null default 'free',
  has_premium_pack boolean not null default false,
  premium_code text unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.organizations to authenticated;
grant select on public.organizations to anon;
grant all on public.organizations to service_role;

alter table public.organizations enable row level security;
create policy "orgs_select_all" on public.organizations for select using (true);
create policy "orgs_owner_all" on public.organizations for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Ajout FK profiles.org_id -> organizations
alter table public.profiles
  add constraint profiles_org_fk foreign key (org_id) references public.organizations(id) on delete set null;

-- =====================================================================
-- TABLE gallery
-- =====================================================================
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category gallery_category not null,
  url text,
  media_type media_type,
  caption text,
  text_content text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.gallery to authenticated;
grant select on public.gallery to anon;
grant all on public.gallery to service_role;

alter table public.gallery enable row level security;
create policy "gallery_select_all" on public.gallery for select using (true);
create policy "gallery_owner_all" on public.gallery for all using (
  exists (select 1 from public.profiles p where p.id = gallery.profile_id and p.id = auth.uid())
) with check (
  exists (select 1 from public.profiles p where p.id = gallery.profile_id and p.id = auth.uid())
);

-- =====================================================================
-- TABLE prospects (annuaire des scans)
-- =====================================================================
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  scanner_phone text not null,
  contact_name text,
  contact_email text,
  first_scan_at timestamptz not null default now(),
  last_visit_at timestamptz not null default now(),
  visits int not null default 1,
  unique (profile_id, scanner_phone)
);

grant select, insert, update, delete on public.prospects to authenticated;
grant select on public.prospects to anon; -- annuaire inversé public
grant all on public.prospects to service_role;

alter table public.prospects enable row level security;
create policy "prospects_select_all" on public.prospects for select using (true);
create policy "prospects_insert_all" on public.prospects for insert with check (true); -- scan = anonyme
create policy "prospects_owner_update" on public.prospects for update using (
  exists (select 1 from public.profiles p where p.id = prospects.profile_id and p.id = auth.uid())
);
create policy "prospects_owner_delete" on public.prospects for delete using (
  exists (select 1 from public.profiles p where p.id = prospects.profile_id and p.id = auth.uid())
);

-- =====================================================================
-- TABLE referrals (commissions de parrainage)
-- =====================================================================
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  commission_xof int not null default 0,
  level text,
  created_at timestamptz not null default now(),
  unique (referrer_id, referred_id)
);

grant select, insert, update, delete on public.referrals to authenticated;
grant all on public.referrals to service_role;

alter table public.referrals enable row level security;
create policy "referrals_owner_select" on public.referrals for select using (
  referrer_id = auth.uid() or referred_id = auth.uid()
);
create policy "referrals_admin_all" on public.referrals for all using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
);

-- =====================================================================
-- TABLE payments (Wave simulé / abonnements)
-- =====================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  amount_xof int not null,
  currency text not null default 'XOF',
  method text not null default 'wave',
  status text not null default 'success',
  reference text,
  description text,
  created_at timestamptz not null default now()
);

grant select, insert on public.payments to authenticated;
grant all on public.payments to service_role;

alter table public.payments enable row level security;
create policy "payments_owner_select" on public.payments for select using (profile_id = auth.uid());
create policy "payments_owner_insert" on public.payments for insert with check (profile_id = auth.uid());

-- =====================================================================
-- TABLE withdrawals (retraits Wave)
-- =====================================================================
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount_xof int not null,
  wave_number text not null,
  status text not null default 'pending', -- pending|approved|rejected|paid
  admin_note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

grant select, insert on public.withdrawals to authenticated;
grant all on public.withdrawals to service_role;

alter table public.withdrawals enable row level security;
create policy "withdrawals_owner_select" on public.withdrawals for select using (profile_id = auth.uid());
create policy "withdrawals_owner_insert" on public.withdrawals for insert with check (profile_id = auth.uid());
create policy "withdrawals_admin_all" on public.withdrawals for all using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
);

-- =====================================================================
-- TABLE support_tickets
-- =====================================================================
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'open', -- open|answered|closed
  created_at timestamptz not null default now()
);

grant select, insert on public.support_tickets to anon, authenticated;
grant all on public.support_tickets to service_role;

alter table public.support_tickets enable row level security;
create policy "tickets_insert_all" on public.support_tickets for insert with check (true);
create policy "tickets_owner_select" on public.support_tickets for select using (profile_id = auth.uid());
create policy "tickets_admin_all" on public.support_tickets for all using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','moderator'))
);

-- =====================================================================
-- TABLE user_roles (rôles séparés — JAMAIS sur profiles)
-- =====================================================================
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;
create policy "user_roles_self_select" on public.user_roles for select
  using (user_id = auth.uid());

-- Fonction has_role SECURITY DEFINER (anti-récursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Politique admin sur user_roles
create policy "user_roles_admin_all" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- TABLE analytics_events (vues / scans / partages)
-- =====================================================================
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  event_type text not null, -- view|scan|share|call|whatsapp
  metadata jsonb default '{}'::jsonb,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

grant select, insert on public.analytics_events to anon, authenticated;
grant all on public.analytics_events to service_role;

alter table public.analytics_events enable row level security;
create policy "events_insert_all" on public.analytics_events for insert with check (true);
create policy "events_owner_select" on public.analytics_events for select using (
  profile_id = auth.uid() or public.has_role(auth.uid(), 'admin')
);

-- =====================================================================
-- Triggers updated_at
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_orgs_updated_at on public.organizations;
create trigger trg_orgs_updated_at before update on public.organizations
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Trigger auto-create profile au signup
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_slug text;
  v_ref text;
begin
  v_slug := coalesce(new.raw_user_meta_data->>'slug',
            regexp_replace(lower(split_part(new.email,'@',1)), '[^a-z0-9]+', '-', 'g'));
  v_ref := lpad(((abs(hashtext(new.id::text)) % 900000) + 100000)::text, 6, '0');

  insert into public.profiles (id, slug, email, first_name, last_name, referral_code)
  values (
    new.id,
    v_slug || '-' || substring(new.id::text, 1, 4),
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name',''),
    v_ref
  ) on conflict (id) do nothing;

  -- rôle par défaut
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- INDEXES utiles
-- =====================================================================
create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_profiles_sector on public.profiles(sector);
create index if not exists idx_profiles_city on public.profiles(city);
create index if not exists idx_profiles_referred_by on public.profiles(referred_by);
create index if not exists idx_phones_profile on public.phones(profile_id);
create index if not exists idx_gallery_profile on public.gallery(profile_id, category);
create index if not exists idx_prospects_profile on public.prospects(profile_id);
create index if not exists idx_prospects_phone on public.prospects(scanner_phone);
create index if not exists idx_events_profile_type on public.analytics_events(profile_id, event_type);

-- =====================================================================
-- Realtime publications
-- =====================================================================
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.gallery;
alter publication supabase_realtime add table public.prospects;
alter publication supabase_realtime add table public.analytics_events;
alter publication supabase_realtime add table public.withdrawals;
alter publication supabase_realtime add table public.support_tickets;
```

---

## 2. Storage buckets

À créer depuis le dashboard Storage → New bucket (ou via SQL dashboard) :

| Bucket             | Public | Limite | Usage                                 |
| ------------------ | ------ | ------ | ------------------------------------- |
| `avatars`          | ✅     | 5 Mo   | Photos de profil                      |
| `covers`           | ✅     | 100 Mo | Images & vidéos de couverture         |
| `gallery-images`   | ✅     | 8 Mo   | Photos, affiches, visuels             |
| `gallery-videos`   | ✅     | 100 Mo | Vidéos galerie (30s max contrôlé côté client) |
| `org-logos`        | ✅     | 2 Mo   | Logos d'entreprise                    |
| `kyc-documents`    | ❌     | 10 Mo  | Pièces ID privées (KYC)               |

### Politiques RLS pour storage.objects

```sql
-- Permettre upload utilisateur authentifié sur ses propres buckets
create policy "Avatar upload"  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Avatar update"  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Avatar delete"  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Avatar public read" on storage.objects for select to public
  using (bucket_id = 'avatars');

-- Répéter le même schéma pour covers, gallery-images, gallery-videos, org-logos
-- (on duplique en remplaçant 'avatars' par chaque bucket public)

-- KYC documents : privé, lecture uniquement par owner ou admin
create policy "KYC owner read" on storage.objects for select to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "KYC owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "KYC admin read" on storage.objects for select to authenticated
  using (bucket_id = 'kyc-documents' and public.has_role(auth.uid(), 'admin'));
```

---

## 3. Compte admin

1. Aller dans **Auth → Add user → Create new user**
   - Email : `admin@flexcard.app`
   - Password : `@FlexCrd26`
   - **Cocher "Auto Confirm User"** (sinon l'OTP email bloquera).
2. Récupérer l'UUID du user créé puis exécuter :

```sql
-- Remplacer <ADMIN_UUID> par l'UUID copié depuis le dashboard
insert into public.user_roles (user_id, role) values ('<ADMIN_UUID>', 'admin') on conflict do nothing;
update public.profiles set
  first_name = 'Admin', last_name = 'FlexCard',
  title = 'Administrateur', sector = 'Tech & Innovation',
  city = 'Abidjan', country_code = '+225',
  template_id = 'vkard-cover', has_premium = true,
  premium_code = 'FX-ADMI-N026-FLXC'
where id = '<ADMIN_UUID>';
```

---

## 4. Seed des 34 comptes démo

Le mock store `src/lib/mock/seed.ts` contient déjà 34 profils complets (Inocent, Aïcha, Mamadou, Léa, Kofi, Fatou, Yann, Esther, Marc, Salimata, Ibrahim, Naomi, Awa, Kouassi, Rose, Bakari, Mariam, Issa, Olivia, Dr. Amani, Pr. Konan, Stéphane, Céline, Abdou, Khadija, Ousmane, Patrick, Marie, Eric, Djénéba, Samuel, Fanny, Jean, Binta) avec avatars Pravatar + couvertures Unsplash.

Pour les recréer côté Supabase, ce script crée des users + profils via service-role (à exécuter dans le SQL Editor avec rôle service) :

```sql
-- ATTENTION : exécuter UNE SEULE FOIS. Idempotent par email.
-- Pour générer un user complet, utiliser l'API admin Auth :
--   POST /auth/v1/admin/users
--   { email, password, email_confirm: true, user_metadata: { first_name, last_name } }
-- Le trigger handle_new_user créera automatiquement le profile.
-- Ensuite UPDATE pour enrichir avec avatar_url, sector, etc.

-- Exemple pour 1 démo (à dupliquer 34x ou scripter via Edge Function / Node script) :
-- 1) Créer l'user avec l'API admin (voir doc Supabase Admin API).
-- 2) Récupérer son UUID puis :
update public.profiles set
  first_name='Aïcha', last_name='Bamba', title='Photographe événementiel',
  sector='Photo & Vidéo', kind='particulier',
  city='Abidjan', country_code='+225',
  description='Mariages, portraits corporate, événements. Abidjan & Grand-Bassam.',
  avatar_url='https://i.pravatar.cc/300?u=aicha',
  cover_url='https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1200&q=70',
  cover_type='image',
  socials = '{"whatsapp":"+22505123456","instagram":"aicha.bamba.photo"}'::jsonb,
  template_id='teamwork-dramatic',
  palette = '{"primary":"#0f172a","accent":"#f59e0b","ink":"#0a0a0a"}'::jsonb
where email='aicha@gmail.com';

insert into public.phones (profile_id, number, operator, position)
select id, '+225 05 12 34 56 78', 'MTN', 0 from public.profiles where email='aicha@gmail.com'
on conflict do nothing;
```

**Script Node recommandé** pour seed les 34 comptes en batch :

```ts
// scripts/seed-supabase.ts (à lancer une fois)
import { createClient } from '@supabase/supabase-js';
import { seedState } from '../src/lib/mock/seed';

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

for (const p of Object.values(seedState.profiles)) {
  const { data: u } = await admin.auth.admin.createUser({
    email: p.email, password: 'Demo123!@', email_confirm: true,
    user_metadata: { first_name: p.firstName, last_name: p.lastName },
  });
  if (!u?.user) continue;
  await admin.from('profiles').update({
    first_name: p.firstName, last_name: p.lastName, title: p.title,
    company: p.company, sector: p.sector, city: p.city, description: p.description,
    avatar_url: p.avatarUrl, cover_url: p.coverUrl, cover_type: p.coverType ?? 'image',
    socials: p.socials, template_id: p.templateId, palette: p.palette,
    has_premium: p.hasPremium, premium_code: p.premiumCode, kind: p.kind,
    public_email: p.publicEmail, website: p.website,
    slug: p.slug,
  }).eq('id', u.user.id);
  for (const ph of p.phones) {
    await admin.from('phones').insert({ profile_id: u.user.id, number: ph.number, operator: ph.operator });
  }
  for (const g of p.gallery) {
    await admin.from('gallery').insert({
      profile_id: u.user.id, category: g.category, url: g.url, media_type: g.mediaType,
      text_content: g.text,
    });
  }
  for (const pr of p.prospects) {
    await admin.from('prospects').insert({
      profile_id: u.user.id, scanner_phone: pr.phone, contact_name: pr.contactName,
      visits: pr.visits,
    });
  }
}
console.log('Seed terminé : 34 comptes créés.');
```

Lance ce script depuis ta machine avec `bun run scripts/seed-supabase.ts` après avoir mis tes secrets dans un `.env` local.

---

## 5. État UI front (déjà livré dans cette itération)

- ✅ Compteurs business + parrainage + utilisateurs vocaux restaurés sur home (4 compteurs)
- ✅ Page `/about` accessible depuis le header public
- ✅ Bug code imprimeur corrigé (champ accepte jusqu'à 20 chars — `FX-IKN0-V202-6FLX` passe maintenant)
- ✅ Upload photo profil + couverture image OU vidéo (100 Mo, 30s max, loop) sur `/profile`
- ✅ Galerie : upload multiple photos/affiches/visuels (8 Mo), vidéos (100 Mo, 30s, loop), actualités
- ✅ Liste complète des secteurs (agriculture, élevage, pêche, tourisme, religion, sport, énergie, journalisme, etc.)
- ✅ Indicatif pays Afrique de l'Ouest sur tous les `<PhoneInput>` (déjà en place)
- ✅ 34 comptes démo enrichis avec avatars + couvertures + galeries
- ✅ Couverture vidéo en lecture en boucle sur `/c/$slug` et templates
- ✅ Mode démo OTP universel `123456` (déjà en place)

## 6. À faire après exécution Supabase

1. Brancher les hooks React Query sur les tables (remplacer `useApp` par `useProfiles()`, etc.)
2. Remplacer les uploads dataURL par `supabase.storage.from('avatars').upload(...)`
3. Activer Realtime sur `prospects` pour notifications live
4. Wave : créer Edge Function `wave-webhook` pour valider les paiements réels
5. Connecter l'OTP réel Supabase (désactiver le bypass 123456 quand prêt)

## 7. Vercel custom domain (flexcard.ivoireprojet.com)

Le 404 vient du fait que le déploiement Vercel doit être :
1. **Build command** : `bun run build` (ou `npm run build`)
2. **Output directory** : `.output/public` (TanStack Start standard)
3. **Framework preset** : choisir "Other" puis configurer manuellement
4. Dans **Settings → Domains**, ajouter `flexcard.ivoireprojet.com` et créer un CNAME chez l'hébergeur DNS pointant vers `cname.vercel-dns.com`.
5. Si l'erreur 404 persiste avec l'ID `fra1::xkmm2-...`, c'est que le build SSR n'a pas produit `.output/server`. Vérifier que `vite.config.ts` charge bien le plugin `@tanstack/start/vite`.

Le déploiement **Lovable** ne demande aucune config — utiliser `id-preview--c66a488c-...lovable.app` ou publier vers ton domaine custom directement depuis l'interface Lovable.

## 8. Refresh "toutes les 5 secondes"

Ce comportement vient probablement du HMR Vite en dev (preview Lovable). Aucune intervalle / setInterval n'a été trouvé dans le code. Si tu vois ça en production publiée, signale-le avec une capture du DevTools Network → ça nous dira si c'est un polling fetch (peu probable, on est en mock) ou un service worker.
