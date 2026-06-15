

## Périmètre

UI complète, frontend uniquement, données mockées (Zustand + localStorage déjà en place). Pas de backend ni d'API réelle. Inspiration visuelle directe des templates fournis (VKard, Swapkaart, Teamwork.Co, CARTLY).

## Approche : 5 lots livrables

Vu l'ampleur (≈18 sections du CDC), je découpe en 5 lots. Chaque lot est testable indépendamment. Je peux tout enchaîner dans cette session, ou m'arrêter après chaque lot pour validation — dis-moi ta préférence.

### Lot 1 — Page d'accueil publique + fondations design
- Refonte complète `/` selon CDC §15.1 : header logo + slogan, 3 compteurs animés (Total / Premium / Pro), barre Scan QR + saisie manuelle (téléphone OU code imprimeur), section "Créer ma carte" (Saisie ✏ vs Vocal 🎤 avec annonce vocale au survol via SpeechSynthesis), section "Qui peut utiliser FlexCard ?" (3 profils), bloc Parrainage avec 7 niveaux fidélité, section "Pourquoi FlexCard ?", témoignages, footer complet.
- Logo bien visible partout (header public + AppShell connecté).
- Pages légales : `/confidentialite`, `/mentions-legales`.

### Lot 2 — Inscription 3 chemins + Auth OTP
- `/auth` refonte : choix profil → 3 formulaires distincts (Particulier / Informel / Entreprise) selon CDC §5.1 avec tous les champs listés (détection opérateur CI sur téléphones 05/07/01, secteurs adaptés, etc.).
- Email + OTP (mock 6 chiffres affiché en toast).
- Champ "Code parrain" pré-rempli si `?ref=XXXXXX` dans l'URL.
- Page `/parrainage` dédiée + page `/tarifs` (grilles §12 Particuliers/Informels/Entreprises).

### Lot 3 — Interface vocale complète + Onboarding template
- `/onboarding/vocal` : flow 18 étapes du CDC §7.2 avec Web Speech API (reconnaissance + synthèse), validation vocale, zone photo clignotante bleue, code parrain vocal.
- `/onboarding` saisie manuelle : refonte sélecteur de templates (réels, inspirés VKard/Swapkaart/Teamwork — pas le grid actuel), aperçu live mobile-frame.
- Auto-extraction palette depuis logo/photo (mock simple via couleur moyenne).

### Lot 4 — Espace connecté complet
- Dashboard refondu §15.2 : carte live, MAJ profil, galerie 5 catégories (Photos / Affiches / Visuels / Vidéos / Actualités), code premium, compteur prospects, stats (vues/clics/partages).
- Section **Mes Revenus** : carte fidélité virtuelle (design carte bancaire, 7 couleurs selon niveau Découverte→Platine), solde commissions, filleuls, bouton Inviter (code 6 chiffres + lien), options usage commissions (créditer plan / boost / retrait Wave).
- Carte numérique publique `/c/$slug` : actions (Appel, WhatsApp, Email, Web, RS, vCard, Partager), QR avec logo au centre, galerie.
- Module Entreprise §11 : interface Admin (employés, invitations, charte, stats équipe) et vue Employé (profil limité, charte imposée).
- Forfaits & paiement simulé (bouton "Payer avec Wave" → succès factice + toast).

### Lot 5 — Pages publiques restantes + Admin
- `/annuaire` refonte : recherche par téléphone, profils liés, filtres ville/secteur (≥10 comptes test bien remplis multi-villes CI/SN/BF).
- `/imprimeur` : saisie code → carte recto-verso + télécharger/imprimer.
- `/contact` : formulaire public.
- `/admin` (route `_admin` protégée par flag local "isAdmin") : gestion users (search/edit/suspend), tableau de bord financier mocké, validation retraits, tickets support, modération, analytics, gestion imprimeurs.

## Notes techniques
- Tout reste sur `ssr: false` (déjà appliqué pour éviter mismatch Zustand+localStorage).
- Bump persistence key à `flexcard-mock-v3` pour reset propre des données seed.
- Couleurs tech-bleu premium déjà dans `src/styles.css` — j'ajoute tokens manquants (niveaux fidélité, success Wave).
- Aucune dépendance backend introduite. Supabase sera branché ensuite.

## Question avant de démarrer

**Tu veux que j'enchaîne les 5 lots d'affilée dans cette session, ou je m'arrête après le Lot 1 pour que tu valides le rendu avant de continuer ?**

Je recommande l'arrêt après Lot 1 (la home est la pièce maîtresse — si la direction visuelle te plaît, le reste suit la même grammaire).
