import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/mock/store";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/flex/Logo";
import {
  Shield, Search, Users, Wallet, LifeBuoy, Flag, BarChart3, Printer, LogOut,
  Crown, Ban, CheckCircle2, AlertTriangle, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { fmt } from "@/lib/mock/utils";
import { mockBalanceFor } from "@/lib/mock/referral";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin FlexCard" }] }),
  component: AdminPage,
});

type Tab = "users" | "finance" | "support" | "modération" | "analytics" | "imprimeurs";
type AccessState = "checking" | "granted" | "denied";

function AdminPage() {
  const navigate = useNavigate();
  const [access, setAccess] = useState<AccessState>("checking");
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) { if (!cancelled) setAccess("denied"); return; }
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (cancelled) return;
      if (error || !data) setAccess("denied");
      else setAccess("granted");
    })();
    return () => { cancelled = true; };
  }, []);

  if (access === "checking") {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-mesh px-4">
        <div className="surface-elevated p-8 text-sm text-muted-foreground">Vérification des droits…</div>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-mesh px-4">
        <div className="surface-elevated p-8 max-w-md w-full text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette section est réservée aux administrateurs. Connecte-toi avec un compte disposant du rôle admin.
          </p>
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Aller à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo className="h-7" />
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">ADMIN</span>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" /> Se déconnecter
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] flex">
        <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1 border-r border-border/60 bg-sidebar/80 px-3 py-6 min-h-[calc(100vh-3.5rem)] sticky top-14">
          {([
            ["users", Users, "Utilisateurs"],
            ["finance", Wallet, "Finance"],
            ["support", LifeBuoy, "Support"],
            ["modération", Flag, "Modération"],
            ["analytics", BarChart3, "Analytics"],
            ["imprimeurs", Printer, "Imprimeurs"],
          ] as const).map(([k, I, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${tab === k ? "bg-gradient-brand text-white shadow-glow" : "hover:bg-secondary"}`}
            >
              <I className="h-4 w-4" /> {label}
            </button>
          ))}
        </aside>

        <main className="flex-1 min-w-0 px-4 py-8 sm:px-8">
          {tab === "users" && <UsersPanel />}
          {tab === "finance" && <FinancePanel />}
          {tab === "support" && <SupportPanel />}
          {tab === "modération" && <ModPanel />}
          {tab === "analytics" && <AnalyticsPanel />}
          {tab === "imprimeurs" && <PrintersPanel />}
        </main>
      </div>
    </div>
  );
}

function UsersPanel() {
  const profiles = useApp((s) => s.profiles);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const all = Object.values(profiles);
    const term = q.trim().toLowerCase();
    return term
      ? all.filter((p) => (`${p.firstName} ${p.lastName} ${p.email} ${p.sector} ${p.city}`).toLowerCase().includes(term))
      : all;
  }, [profiles, q]);

  return (
    <section>
      <PanelHeader icon={<Users className="h-5 w-5" />} title="Gestion utilisateurs" sub={`${Object.keys(profiles).length} comptes`} />
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche nom, email, secteur, ville…" className="flex-1 bg-transparent py-3 text-sm outline-none" />
      </div>
      <div className="mt-6 overflow-x-auto surface-elevated">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Premium</th>
              <th className="px-4 py-3">Prospects</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{p.firstName} {p.lastName}</div>
                  <div className="text-xs text-muted-foreground">{p.email}</div>
                </td>
                <td className="px-4 py-3 text-xs uppercase">{p.kind}</td>
                <td className="px-4 py-3">{p.city || "—"}</td>
                <td className="px-4 py-3">{p.hasPremium ? <CheckCircle2 className="h-4 w-4 text-success" /> : "—"}</td>
                <td className="px-4 py-3">{p.prospects.length}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <Link to="/c/$slug" params={{ slug: p.slug }} className="rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-secondary"><Eye className="h-3 w-3" /></Link>
                    <button onClick={() => toast.success("Plan attribué", { description: `Pro Particulier (démo) → ${p.firstName}` })} className="rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-secondary"><Crown className="h-3 w-3" /></button>
                    <button onClick={() => toast.warning("Compte suspendu (démo)")} className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"><Ban className="h-3 w-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FinancePanel() {
  const profiles = useApp((s) => s.profiles);
  const all = Object.values(profiles);
  const totalCommissions = all.reduce((s, p) => s + mockBalanceFor(p), 0);
  const totalPremium = all.filter((p) => p.hasPremium).length * 1000;
  const txns = all.slice(0, 8).map((p, i) => ({
    id: `TX-${1000 + i}`,
    user: `${p.firstName} ${p.lastName}`,
    type: p.hasPremium ? "Premium" : "Starter",
    amount: p.hasPremium ? 1000 : 500,
    status: i % 4 === 0 ? "pending" : "ok",
  }));

  return (
    <section>
      <PanelHeader icon={<Wallet className="h-5 w-5" />} title="Finance" sub="Revenus, retraits, commissions" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KPI label="Revenus du mois" value={`${fmt(totalPremium + 12500)} F`} sub="+8% vs M-1" />
        <KPI label="Commissions à payer" value={`${fmt(totalCommissions)} F`} sub={`${all.length} bénéficiaires`} />
        <KPI label="Demandes Wave" value="3" sub="en attente de validation" />
      </div>

      <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-muted-foreground">Transactions récentes</h3>
      <div className="mt-3 overflow-x-auto surface-elevated">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Utilisateur</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {txns.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                <td className="px-4 py-3">{t.user}</td>
                <td className="px-4 py-3">{t.type}</td>
                <td className="px-4 py-3 font-semibold">{fmt(t.amount)} F</td>
                <td className="px-4 py-3">
                  {t.status === "ok"
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success"><CheckCircle2 className="h-3 w-3" /> Payé</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning"><AlertTriangle className="h-3 w-3" /> En attente</span>}
                </td>
                <td className="px-4 py-3">
                  {t.status === "pending" && (
                    <button onClick={() => toast.success("Retrait validé (démo)")} className="rounded-lg bg-success px-3 py-1 text-xs font-semibold text-white">Valider</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SupportPanel() {
  const tickets = [
    { id: "T-001", user: "Aïcha Bamba", subject: "Mon QR code ne marche pas en impression", priority: "haute" },
    { id: "T-002", user: "Kofi Asante", subject: "Comment annuler mon Starter ?", priority: "normale" },
    { id: "T-003", user: "Esther G.", subject: "Demande de remboursement carte premium", priority: "haute" },
  ];
  return (
    <section>
      <PanelHeader icon={<LifeBuoy className="h-5 w-5" />} title="Support & SAV" sub="Tickets de support" />
      <div className="mt-6 surface-elevated divide-y divide-border/60">
        {tickets.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4">
            <div>
              <div className="text-xs text-muted-foreground font-mono">{t.id} · {t.user}</div>
              <div className="font-semibold text-sm">{t.subject}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.priority === "haute" ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>{t.priority}</span>
              <button onClick={() => toast.success("Ticket marqué résolu (démo)")} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Traiter</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModPanel() {
  return (
    <section>
      <PanelHeader icon={<Flag className="h-5 w-5" />} title="Modération" sub="Contenus signalés" />
      <div className="mt-6 surface-elevated p-6 text-sm text-muted-foreground">
        Aucun signalement en attente. La modération automatique est active sur les images et descriptions.
      </div>
    </section>
  );
}

function AnalyticsPanel() {
  const profiles = useApp((s) => s.profiles);
  const all = Object.values(profiles);
  return (
    <section>
      <PanelHeader icon={<BarChart3 className="h-5 w-5" />} title="Analytics" sub="Vue d'ensemble" />
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <KPI label="Total utilisateurs" value={fmt(all.length)} sub="comptes actifs" />
        <KPI label="Premium" value={fmt(all.filter((p) => p.hasPremium).length)} sub="cartes imprimées" />
        <KPI label="Pros" value={fmt(all.filter((p) => p.kind === "entreprise").length)} sub="entreprises" />
        <KPI label="Informels" value={fmt(all.filter((p) => p.kind === "informel").length)} sub="boutiques & ateliers" />
      </div>
      <div className="mt-6 surface-elevated p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Top secteurs</h3>
        <ul className="mt-4 space-y-2">
          {Object.entries(all.reduce<Record<string, number>>((acc, p) => { acc[p.sector] = (acc[p.sector] || 0) + 1; return acc; }, {}))
            .sort((a, b) => b[1] - a[1]).slice(0, 6).map(([sector, n]) => (
              <li key={sector} className="flex items-center justify-between">
                <span className="text-sm">{sector}</span>
                <span className="text-sm font-bold">{n}</span>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}

function PrintersPanel() {
  const printers = [
    { name: "Imprimerie Cocody Center", city: "Abidjan", cards: 142 },
    { name: "Print Express Plateau", city: "Abidjan", cards: 89 },
    { name: "Yopougon Print", city: "Abidjan", cards: 54 },
    { name: "Bouaké Color", city: "Bouaké", cards: 23 },
  ];
  return (
    <section>
      <PanelHeader icon={<Printer className="h-5 w-5" />} title="Imprimeurs partenaires" sub={`${printers.length} partenaires actifs`} />
      <div className="mt-6 surface-elevated divide-y divide-border/60">
        {printers.map((p) => (
          <div key={p.name} className="flex items-center justify-between p-4">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.city}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{p.cards}</div>
              <div className="text-xs text-muted-foreground">cartes imprimées</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PanelHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">{icon}</span>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="surface-elevated p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
