import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader, PublicFooter } from "@/components/flex/PublicHeader";
import { ShieldCheck, Lock, KeyRound, Database, FileCheck2, UserCheck } from "lucide-react";

export const Route = createFileRoute("/securite")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sécurité & Confiance — FlexCard" },
      {
        name: "description",
        content:
          "Comment FlexCard protège vos données : chiffrement, authentification OTP, RLS Supabase, conformité et gouvernance.",
      },
      { property: "og:title", content: "Sécurité & Confiance — FlexCard" },
      {
        property: "og:description",
        content:
          "Chiffrement AES-256, TLS 1.3, OTP sans mot de passe, RLS sur chaque table, audit continu.",
      },
    ],
  }),
  component: Page,
});

const pillars = [
  {
    icon: Lock,
    title: "Chiffrement de bout en bout",
    body: "AES-256 au repos, TLS 1.3 en transit. Les sauvegardes Supabase sont chiffrées et répliquées multi-zones.",
  },
  {
    icon: KeyRound,
    title: "Authentification sans mot de passe",
    body: "Connexion par OTP (e-mail / WhatsApp). Aucun mot de passe stocké, aucune fuite possible par dictionnaire.",
  },
  {
    icon: Database,
    title: "Isolation par utilisateur (RLS)",
    body: "Chaque table Postgres applique des politiques Row-Level Security. Vos lignes ne sont jamais visibles d'un autre compte.",
  },
  {
    icon: UserCheck,
    title: "Données sensibles cloisonnées",
    body: "E-mail, code premium, code de parrainage : accessibles uniquement via fonctions security-definer scopées à votre auth.uid().",
  },
  {
    icon: FileCheck2,
    title: "Journalisation & audit",
    body: "Événements analytics rate-limités, validation server-side, journaux d'accès consultables sur demande.",
  },
  {
    icon: ShieldCheck,
    title: "Gouvernance",
    body: "Scans de sécurité automatiques (Lovable + Wiz), revue manuelle des migrations, principe du moindre privilège.",
  },
];

function Page() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Trust center
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">Sécurité &amp; Confiance</h1>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          FlexCard héberge l'identité professionnelle de milliers d'utilisateurs en Côte
          d'Ivoire et au-delà. Voici, en clair, comment nous protégeons vos données et
          votre réputation. Cette page est maintenue par l'équipe FlexCard ; elle n'est pas
          une certification indépendante.
        </p>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold">{title}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 space-y-6 text-sm leading-relaxed text-foreground/90">
          <div>
            <h2 className="text-xl font-semibold">Conformité &amp; vie privée</h2>
            <p className="mt-2 text-muted-foreground">
              Nous appliquons les principes du RGPD : minimisation, finalité, droit
              d'accès, de rectification et d'effacement. Consultez notre{" "}
              <Link to="/confidentialite" className="text-primary underline">
                politique de confidentialité
              </Link>{" "}
              et nos{" "}
              <Link to="/mentions-legales" className="text-primary underline">
                mentions légales
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Signaler une vulnérabilité</h2>
            <p className="mt-2 text-muted-foreground">
              Vous pensez avoir trouvé une faille ? Écrivez-nous à{" "}
              <a className="text-primary underline" href="mailto:security@flexcard.app">
                security@flexcard.app
              </a>{" "}
              avec les étapes de reproduction. Nous accusons réception sous 48h et ne
              poursuivons aucun rapport fait de bonne foi.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Sous-traitants principaux</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Supabase — base Postgres managée (UE).</li>
              <li>Lovable Cloud — hébergement edge et CDN.</li>
              <li>Wave, Orange Money, MTN — encaissements XOF.</li>
            </ul>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
