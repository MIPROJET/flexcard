# Plan d'exécution — Refonte FlexCard CDC V4

Le périmètre demandé touche **l'auth, le modèle de données, le store, 4+ routes, la carte démo et la création de comptes Supabase**. Je le découpe en phases livrables. Tout faire "en parallèle" dans un seul tour casserait l'app (les types, le store, les routes et la DB sont couplés). Je propose ce séquencement et je l'exécute d'un bloc dès validation.

---

## Phase 1 — Auth Supabase email/mot de passe (priorité user)

**DB (migration Supabase) :**
- Activer email/password (déjà actif côté Supabase Auth — pas de migration nécessaire).
- Créer les 2 comptes via Auth Admin API dans un server fn one-shot lancé manuellement :
  - `admin@flexcard.pro` / `@Flexcard26` → rôle `admin` dans `user_roles`
  - `inocent.koffi@agricapital.ci` / mot de passe à définir (je demande) → rôle `user`, profil lié à la carte réelle existante (avatar + cover déjà uploadés).

**Code :**
- `src/routes/auth.tsx` : remplacer le flow OTP par **email + mot de passe**. OTP **uniquement à l'inscription** (vérification email Supabase standard via `signUp` + lien magique de confirmation). Connexion ultérieure = `signInWithPassword`, **aucun OTP**.
- Remplacer `useApp` (zustand mock) par `supabase.auth` dans `auth.tsx`, `_authenticated/route.tsx`, header (sign out), dashboard, profile.
- Garder le mock zustand temporairement pour les écrans non-auth (templates, billing) pour ne pas tout casser. Migration progressive.

## Phase 2 — Carte réelle Inocent Koffi depuis la DB

- Créer migration : seed du profil `inocent.koffi@agricapital.ci` dans `public.profiles` (via le trigger `handle_new_user` après création Auth, puis UPDATE avec les vrais champs : titre, secteur AgriCapital, téléphones, socials, avatar/cover URLs des assets existants).
- `_authenticated.profile.tsx` et `_authenticated.dashboard.tsx` : lire le profil depuis Supabase (`profiles` table) au lieu de `useCurrentProfile()` mock.
- Route publique `c/$slug` : charger depuis Supabase.

## Phase 3 — Logo verso NFC + déplacement blocs landing

- ✅ Logo verso déjà remplacé au tour précédent (`flexcard-logo-back.png`).
- `src/routes/index.tsx` : déplacer les 2 blocs de la capture ("Une carte physique. Mille connexions." + "Votre carte vous rapporte de l'argent.") **au-dessus** de la section "Qui peut utiliser FlexCard ?".

## Phase 4 — Extension modèle CDC V4 (types + store)

- `src/lib/mock/types.ts` :
  - `AccountKind` += `"coordinateur" | "commercial" | "partenaire"`
  - `Plan` += `"vocal" | "pro_particulier"`
  - `Profile` += `role?`, `managedAgentIds?`, `commissionRate?`, `payoutMethod?`
  - `Organization` += `coordinatorId?`, `commercialAgentId?`
- `src/lib/mock/store.ts` : ajout `requestOtpByPhone`, `verifyOtpByPhone` (mock — vrai SMS hors scope sans provider), `assignRole`, `requestWithdrawal`.
- `auth.tsx` : ajouter 3 cartes KIND (coordinateur/commercial/partenaire), fork email/téléphone, routing post-auth par rôle.

## Phase 5 — Vocal standalone + langues

- `onboarding.vocal.tsx` : retirer la garde `!me → /auth`, ajouter étapes téléphone → OTP WhatsApp (mock) → création profil inline.
- Picker langue (FR / Dioula / Nouchi / Baoulé) avant STEPS.
- TTS du code parrainage + lien WhatsApp final.

---

## Questions bloquantes avant exécution

1. **Mot de passe Inocent Koffi** : tu n'as donné que celui de l'admin. Quel mot de passe pour `inocent.koffi@agricapital.ci` ?
2. **OTP "à la création" — quel canal ?** Email de confirmation Supabase standard (lien cliquable) ou code 6 chiffres custom par email ? Pour SMS/WhatsApp réels il faut un provider (Twilio/MessageBird) — je laisse en mock pour Phase 4-5 ou tu fournis les credentials ?
3. **Phases 4 & 5** : je les fais dans la **foulée** après Phase 1-3, ou en **livraison séparée** (Phase 1-3 d'abord, validation, puis Phase 4-5) ? La foulée = ~beaucoup de code d'un coup, risque de régression accru.

Réponds à ces 3 points et je lance toutes les phases approuvées d'un bloc (migration DB + tous les fichiers en parallèle).
