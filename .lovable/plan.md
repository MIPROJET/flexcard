## Plan d'exécution — FlexCard v3

### 1. Domaine `flexcard.ivoireprojet.com` (404 Vercel)

**Diagnostic** : le projet est hébergé sur **Lovable** (`flexcard-ci.lovable.app`), pas sur Vercel. La capture montre une erreur Vercel `NOT_FOUND` → le DNS du sous-domaine `flexcard.ivoireprojet.com` pointe encore vers un projet Vercel (ancien) au lieu de Lovable.

**Action requise côté utilisateur** (je ne peux pas le faire, c'est DNS) :
1. Aller dans Lovable → **Project Settings → Domains → Connect domain** → `flexcard.ivoireprojet.com`
2. Lovable affiche un enregistrement CNAME/A à créer chez le registrar de `ivoireprojet.com`
3. Supprimer l'ancien enregistrement DNS qui pointe vers Vercel
4. Attendre la propagation (1-24h)

→ Aucun code à modifier ici. Le routage TanStack fonctionne déjà correctement sur Lovable.

### 2. SQL manuel (à exécuter dans Supabase SQL Editor)

Le SQL complet sera écrit dans `.lovable/plan.md`. Il contient :
- **Inocent Koffi** : insertion `auth.users` + `profiles` + `phones` + `user_roles(admin)` + premium activé + premium NFC flag
- **50 prospects démo** liés à son profil (numéros CI, noms variés, dates étalées)
- **Activation manuelle** : `email_confirmed_at = now()` pour pouvoir se connecter
- **Compteurs stats** : valeurs cohérentes (34 users / 8 premium / 9 pro / 14 vocaux)

Mot de passe initial : `FlexCard2026!` (à changer après connexion).

### 3. Refonte UI Home selon CDC v3

**`src/routes/index.tsx`** :
- Nouveau hero : ajout d'une **3ème carte** "Carte physique NFC" à côté de "Carte digitale" et "Une carte. Mille connexions" :
  > « Une carte physique. Mille connexions. Une seule carte imprimée à vie. QR code gravé, scannable par n'importe quel téléphone. Connectez autant de prospects que vous voulez. Économisez jusqu'à 99% sur vos frais d'impression. »
- Compteurs temps réel (déjà branchés Supabase) : Users / Premium / Pros / Vocaux
- **Nouvelle carte démo "Voir une carte FlexCard"** sous les compteurs → lien vers `/c/inocent-koffi` avec avatar + nom "Inocent Koffi · IKNov" (style exactement comme la capture image-7.png)
- Section NFC dédiée (visuel recto/verso NFC)

### 4. Composant `PremiumCardDesign` (recto + verso identique au prototype)

**Nouveau fichier `src/components/flex/PremiumCardNFC.tsx`** :
- Recto : fond `#0a1a3a` (navy profond), icône NFC blanche centrée (logo SVG style "N)))"), coins arrondis `rounded-3xl`, ratio carte bancaire
- Verso : même fond navy, logo FlexCard officiel (image fournie) centré, sous-titre "Une carte. Mille connexions."
- Utilisé dans `/premium`, `/print/$code`, et la page profil Inocent

**Asset logo officiel** : upload `FlexCard_Logo-2.png` via `lovable-assets create` → `src/assets/flexcard-logo-official.png.asset.json`

### 5. Fix synthèse vocale `/onboarding/vocal`

Lire `src/routes/onboarding.vocal.tsx` et corriger :
- Permission micro (`getUserMedia` avant `startSession`)
- Token ElevenLabs : vérifier que la server function `getScribeToken` existe et lit `ELEVENLABS_API_KEY` server-side
- Si manquant : créer `src/lib/elevenlabs.functions.ts` avec `createServerFn` + handler `scribe_v2_realtime`
- UI : feedback clair (état micro, transcript live, bouton stop)
- Mapping transcript → champs profil (nom, prénom, titre, secteur, téléphone, email) via parsing simple

### 6. Photo de profil + couverture Inocent

Upload des 2 images fournies via `lovable-assets` :
- `INOCENT_KOFFI.jpeg` → avatar
- `IMAGE_IM_INVESTOR_PP.png` → couverture
URLs hardcodées dans le SQL d'insertion du profil.

### 7. Ordre d'exécution

1. Écrire `.lovable/plan.md` avec le SQL complet
2. Upload assets (logo officiel, photo, couverture) en parallèle
3. Créer `PremiumCardNFC.tsx`
4. Réécrire `src/routes/index.tsx` (hero + carte NFC + démo Inocent)
5. Corriger `src/routes/onboarding.vocal.tsx`
6. Intégrer `PremiumCardNFC` dans `/premium` et `/print/$code`
7. Demander à l'utilisateur d'exécuter le SQL et de corriger le DNS

### Notes techniques

- Le compte Inocent doit être créé via **SQL direct** dans `auth.users` (utilisateur le demande explicitement pour exécution manuelle). Trigger `handle_new_user` créera automatiquement le profil + role.
- Ensuite UPDATE pour overrider les champs (nom, photo, premium, etc.) et INSERT phones/prospects.
- Les 50 prospects utilisent `register_contact_exchange` ou INSERT direct dans `prospects` (plus rapide en batch).
