import { createFileRoute } from "@tanstack/react-router";
import { useCurrentProfile } from "@/lib/mock/store";
import { Copy, CheckCircle2, Wallet, Crown, TrendingUp, Users, Gift, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FIDELITY_LEVELS, fidelityFor, mockBalanceFor, mockReferralsCount, referralCodeFor } from "@/lib/mock/referral";
import { fmt } from "@/lib/mock/utils";

export const Route = createFileRoute("/_authenticated/revenus")({
  ssr: false,
  component: RevenusPage,
});

function RevenusPage() {
  const me = useCurrentProfile()!;
  const code = referralCodeFor(me);
  const balance = mockBalanceFor(me);
  const referrals = mockReferralsCount(me);
  const level = fidelityFor(balance, referrals);
  const nextLevelIdx = FIDELITY_LEVELS.findIndex((l) => l.key === level.key) + 1;
  const nextLevel = FIDELITY_LEVELS[nextLevelIdx];

  const link = typeof window !== "undefined" ? `${window.location.origin}/auth?ref=${code}` : "";
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const copy = (what: "code" | "link") => {
    navigator.clipboard.writeText(what === "code" ? code : link);
    setCopied(what); setTimeout(() => setCopied(null), 1500);
    toast.success("Copié dans le presse-papier");
  };

  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Mes Revenus</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tes commissions de parrainage. Ta carte virtuelle évolue avec ton solde.
        </p>
      </header>

      {/* Virtual card */}
      <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div
          className="relative overflow-hidden rounded-3xl p-7 shadow-elev"
          style={{ background: level.background, color: level.ink, aspectRatio: "1.586/1", maxWidth: 520 }}
        >
          <div className="grid-noise absolute inset-0 opacity-20" />
          <div className="relative flex flex-col h-full justify-between">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] opacity-70">FlexCard · Fidélité</div>
                <div className="mt-1 text-lg font-black">{level.label}</div>
              </div>
              <Crown className="h-7 w-7" style={{ color: level.accent }} />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest opacity-70">Solde disponible</div>
              <div className="text-3xl font-black sm:text-4xl">{fmt(balance)} <span className="text-base font-bold">FCFA</span></div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">Titulaire</div>
                <div className="text-sm font-bold uppercase tracking-wider">{me.firstName} {me.lastName}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest opacity-70">Filleuls actifs</div>
                <div className="text-lg font-black">{referrals}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-elevated p-5 space-y-4">
          <Stat icon={<Users className="h-5 w-5" />} label="Filleuls" value={fmt(referrals)} />
          <Stat icon={<TrendingUp className="h-5 w-5" />} label="Commissions cumulées" value={`${fmt(balance)} F`} />
          <Stat icon={<Crown className="h-5 w-5" />} label="Niveau actuel" value={level.label} />
          {nextLevel && (
            <div className="rounded-xl bg-secondary/50 p-3 text-xs">
              <div className="font-semibold">Prochain niveau : {nextLevel.label}</div>
              <div className="text-muted-foreground mt-1">
                {Math.max(0, nextLevel.minBalance - balance) > 0 && (
                  <>+ {fmt(nextLevel.minBalance - balance)} F </>
                )}
                ou {Math.max(0, nextLevel.minReferrals - referrals)} filleul(s) restant(s)
              </div>
              <div className="mt-2 h-2 rounded-full bg-background overflow-hidden">
                <div className="h-full bg-gradient-brand" style={{ width: `${Math.min(100, (balance / nextLevel.minBalance) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite */}
      <div className="surface-elevated p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-orange text-white shadow-glow">
            <Gift className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold">Invite tes contacts</h2>
            <p className="text-xs text-muted-foreground">20% de commission à vie sur leurs renouvellements.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ton code parrain</label>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded-xl bg-secondary px-4 py-3 text-2xl font-black tracking-widest text-center">{code}</code>
              <button onClick={() => copy("code")} className="rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold hover:bg-secondary">
                {copied === "code" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lien d'invitation</label>
            <div className="mt-2 flex items-center gap-2">
              <input value={link} readOnly className="flex-1 rounded-xl bg-secondary px-3 py-3 text-xs font-mono truncate" />
              <button onClick={() => copy("link")} className="rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold hover:bg-secondary">
                {copied === "link" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={async () => {
                  if ((navigator as any).share) {
                    try { await (navigator as any).share({ title: "FlexCard", text: "Rejoins-moi sur FlexCard", url: link }); } catch {}
                  } else { copy("link"); }
                }}
                className="rounded-xl bg-gradient-brand px-3 py-3 text-white shadow-glow"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Use my commissions */}
      <div>
        <h2 className="text-xl font-bold">Utiliser mes commissions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <ActionCard
            icon={<Crown className="h-5 w-5" />}
            title="Créditer un plan"
            desc="Déduis ces commissions de ton prochain abonnement."
            cta="Appliquer un crédit"
            onClick={() => toast.success("Crédit appliqué", { description: `${fmt(balance)} F déduits du prochain abonnement (démo).` })}
          />
          <ActionCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Booster ma visibilité"
            desc="1re position dans ton secteur dans l'annuaire pendant 30 jours."
            cta="Activer le boost (500 F)"
            onClick={() => toast.success("Boost activé !", { description: "Tu apparais en 1ère position dans ton secteur (démo)." })}
          />
          <ActionCard
            icon={<Wallet className="h-5 w-5" />}
            title="Retrait Wave"
            desc="Demande un retrait en espèces. Traitement manuel (V1.0)."
            cta="Demander un retrait"
            onClick={() => toast.success("Demande envoyée", { description: "Notre équipe te recontactera sous 48h via Wave (démo)." })}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-lg font-bold truncate">{value}</div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, cta, onClick }: { icon: React.ReactNode; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <div className="surface-elevated p-5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <h3 className="mt-3 text-base font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <button onClick={onClick} className="mt-4 w-full rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow">
        {cta}
      </button>
    </div>
  );
}
