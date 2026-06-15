import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader, PublicFooter } from "@/components/flex/PublicHeader";
import { Check, Crown, TrendingUp, Building2, User, Store, Sparkles } from "lucide-react";

export const Route = createFileRoute("/tarifs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tarifs FlexCard — Particuliers, Informels, Entreprises" },
      { name: "description", content: "Grilles tarifaires complètes FlexCard : Gratuit, Starter, Pro, Business, Premium. Particuliers, informels et entreprises. Sans engagement." },
    ],
  }),
  component: TarifsPage,
});

const PART_PLANS = [
  { name: "Découverte", mensuel: "Gratuit", trimestre: "0", semestre: "0", annuel: "0", highlight: false },
  { name: "Starter", mensuel: "500 F", trimestre: "1 300 F (-13%)", semestre: "2 400 F (-20%)", annuel: "4 500 F (-25%)", highlight: false },
  { name: "Pro Particulier", mensuel: "1 000 F", trimestre: "2 700 F (-10%)", semestre: "5 000 F (-17%)", annuel: "9 500 F (-21%)", highlight: true },
  { name: "Business", mensuel: "2 000 F", trimestre: "5 400 F (-10%)", semestre: "10 000 F (-17%)", annuel: "19 000 F (-21%)", highlight: false },
  { name: "Vocal (unique à vie)", mensuel: "500 F", trimestre: "—", semestre: "—", annuel: "—", highlight: false },
];

const ENT_PLANS = [
  { name: "Jusqu'à 3", mensuel: "Gratuit", trimestre: "Gratuit", semestre: "Gratuit", annuel: "Gratuit", premium: "—" },
  { name: "Jusqu'à 10", mensuel: "1 000 F", trimestre: "2 700 F", semestre: "5 000 F", annuel: "9 500 F", premium: "5 000 F" },
  { name: "Jusqu'à 20", mensuel: "1 500 F", trimestre: "4 000 F", semestre: "7 500 F", annuel: "14 000 F", premium: "9 000 F" },
  { name: "Jusqu'à 50", mensuel: "2 500 F", trimestre: "6 700 F", semestre: "12 500 F", annuel: "23 000 F", premium: "20 000 F" },
  { name: "Jusqu'à 100", mensuel: "3 500 F", trimestre: "9 400 F", semestre: "17 500 F", annuel: "33 000 F", premium: "35 000 F" },
  { name: "Illimité", mensuel: "5 000 F", trimestre: "13 500 F", semestre: "25 000 F", annuel: "47 000 F", premium: "50 000 F" },
];

function TarifsPage() {
  return (
    <div className="min-h-screen bg-gradient-mesh">
      <PublicHeader />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Sans engagement · Annulation à tout moment
          </div>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">Des tarifs <span className="text-gradient-brand">africains</span></h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Conçus pour la réalité du marché : du gratuit à vie pour démarrer, jusqu'au pack entreprise illimité.
          </p>
        </div>

        {/* Particuliers & Informels */}
        <div className="mt-12">
          <SectionHeader icon={<User className="h-5 w-5" />} title="Particuliers & Activités Informelles" sub="Indépendants, freelances, vendeuses, artisans." />
          <div className="mt-6 overflow-x-auto surface-elevated">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Offre</th>
                  <th className="px-4 py-3">Mensuel</th>
                  <th className="px-4 py-3">Trimestriel</th>
                  <th className="px-4 py-3">Semestriel</th>
                  <th className="px-4 py-3">Annuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {PART_PLANS.map((p) => (
                  <tr key={p.name} className={p.highlight ? "bg-primary/5" : ""}>
                    <td className="px-4 py-3 font-semibold">{p.name}{p.highlight && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">POPULAIRE</span>}</td>
                    <td className="px-4 py-3">{p.mensuel}</td>
                    <td className="px-4 py-3">{p.trimestre}</td>
                    <td className="px-4 py-3">{p.semestre}</td>
                    <td className="px-4 py-3">{p.annuel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            ★ Carte Premium imprimable : <strong>1 000 F</strong> achat unique à vie · Boost annuaire : 500 F/mois ou via commissions.
          </p>
        </div>

        {/* Entreprises */}
        <div className="mt-16">
          <SectionHeader icon={<Building2 className="h-5 w-5" />} title="Entreprises" sub="Gestion centralisée d'équipe, charte graphique imposée." />
          <div className="mt-6 overflow-x-auto surface-elevated">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Personnel</th>
                  <th className="px-4 py-3">Mensuel</th>
                  <th className="px-4 py-3">Trimestriel</th>
                  <th className="px-4 py-3">Semestriel</th>
                  <th className="px-4 py-3">Annuel</th>
                  <th className="px-4 py-3">Pack Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {ENT_PLANS.map((p) => (
                  <tr key={p.name}>
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3">{p.mensuel}</td>
                    <td className="px-4 py-3">{p.trimestre}</td>
                    <td className="px-4 py-3">{p.semestre}</td>
                    <td className="px-4 py-3">{p.annuel}</td>
                    <td className="px-4 py-3">{p.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Upgrade : seule la différence est facturée lors d'un changement de pack.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <Perk icon={<Crown className="h-5 w-5" />} title="Premium à vie" desc="1 000 F. Un seul achat. Carte imprimable valable pour toujours." />
          <Perk icon={<TrendingUp className="h-5 w-5" />} title="20% par filleul" desc="Tu invites, tu gagnes. Renouvellements : 10% à vie." />
          <Perk icon={<Store className="h-5 w-5" />} title="Vocal 500 F" desc="Un seul paiement pour les non-lettrés. Partage illimité à vie." />
        </div>

        <div className="mt-12 text-center">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3.5 text-base font-semibold text-white shadow-glow">
            Créer mon compte gratuit
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">{icon}</span>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function Perk({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="surface-elevated p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-3 text-base font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
