import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader, PublicFooter } from "@/components/flex/PublicHeader";
import { Gift, TrendingUp, Wallet, Crown, Users, ArrowRight, Copy, CheckCircle2 } from "lucide-react";
import { FIDELITY_LEVELS } from "@/lib/mock/referral";

export const Route = createFileRoute("/parrainage")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Parrainage FlexCard — 20% de commission à vie" },
      { name: "description", content: "Invite tes contacts, gagne 20% sur leur premier plan et 10% à chaque renouvellement. Carte de fidélité virtuelle : 7 niveaux." },
    ],
  }),
  component: ParrainagePage,
});

function ParrainagePage() {
  return (
    <div className="min-h-screen bg-gradient-mesh">
      <PublicHeader />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-orange/15 px-3 py-1 text-xs font-semibold text-accent-orange">
            <Gift className="h-3.5 w-3.5" /> Programme de parrainage à vie
          </div>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Invitez. <span className="text-gradient-brand">Gagnez.</span> Encaissez.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Chaque inscrit via ton lien te rapporte une commission automatique. Ton réseau grandit. Tes revenus aussi.
          </p>
        </div>

        {/* Commission structure */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <CommissionCard
            badge="Première souscription"
            value="20%"
            desc="Quand ton filleul souscrit à son premier plan payant."
            color="bg-gradient-brand"
          />
          <CommissionCard
            badge="Renouvellement"
            value="10%"
            desc="À chaque renouvellement de plan, à vie. Sans plafond."
            color="bg-accent-orange"
          />
          <CommissionCard
            badge="Upgrade"
            value="20%"
            desc="Sur la différence facturée quand ton filleul passe à un plan supérieur."
            color="bg-success"
          />
          <CommissionCard
            badge="Carte Premium"
            value="20%"
            desc="Sur les 1 000 F de la carte imprimable de ton filleul."
            color="bg-primary"
          />
        </div>

        {/* Fidelity levels */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold sm:text-3xl">7 niveaux de fidélité</h2>
          <p className="mt-2 text-muted-foreground">Plus tu parraines, plus ta carte virtuelle s'embellit. Le statut est mis à jour automatiquement.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FIDELITY_LEVELS.map((lvl) => (
              <div key={lvl.key} className="rounded-2xl p-5 shadow-elev" style={{ background: lvl.background, color: lvl.ink }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">{lvl.label}</span>
                  <Crown className="h-4 w-4 opacity-70" />
                </div>
                <div className="mt-6">
                  <div className="text-xs opacity-70">Solde requis</div>
                  <div className="text-xl font-black">{lvl.minBalance.toLocaleString("fr-FR")} F</div>
                </div>
                <div className="mt-2 text-xs opacity-80">
                  ou <strong>{lvl.minReferrals}</strong> filleul{lvl.minReferrals > 1 ? "s" : ""} actif{lvl.minReferrals > 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage of commissions */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <UsageCard icon={<Crown className="h-5 w-5" />} title="Créditer un plan" desc="Déduis automatiquement de ton prochain abonnement." />
          <UsageCard icon={<TrendingUp className="h-5 w-5" />} title="Booster ta visibilité" desc="1re position dans ton secteur dans l'annuaire." />
          <UsageCard icon={<Wallet className="h-5 w-5" />} title="Retrait Wave" desc="Demande un retrait en espèces — traité par notre équipe." />
        </div>

        {/* CTA */}
        <div className="mt-16 surface-elevated p-8 sm:p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 text-2xl font-bold">Crée ton compte, récupère ton code parrain.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu recevras un code à 6 chiffres unique et un lien d'invitation personnalisé.
          </p>
          <Link to="/auth" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3.5 text-base font-semibold text-white shadow-glow">
            Commencer maintenant <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}

function CommissionCard({ badge, value, desc, color }: { badge: string; value: string; desc: string; color: string }) {
  return (
    <div className="surface-elevated p-6">
      <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ${color}`}>
        <CheckCircle2 className="h-3 w-3" /> {badge}
      </div>
      <div className="mt-4 text-5xl font-black text-gradient-brand">{value}</div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function UsageCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="surface-elevated p-5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <h3 className="mt-3 text-base font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
