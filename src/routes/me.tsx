import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/flex/Logo";
import { CI_DEPARTMENTS } from "@/lib/ci-departments";
import { toast } from "sonner";
import {
  Sparkles, Gift, ShieldCheck, ArrowRight, ArrowLeft, KeyRound, Mail,
  MapPin, Building2, X, CheckCircle2,
} from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  request: z.enum(["coordinateur", "commercial", "partenaire"]).optional(),
});

export const Route = createFileRoute("/me")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Espace pro — Coordinateurs · Commerciaux · Partenaires" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MePage,
});

type RoleKind = "coordinateur" | "commercial" | "partenaire";

const ROLES: { kind: RoleKind; title: string; tagline: string; desc: string; icon: any; tone: string; cta: string }[] = [
  {
    kind: "coordinateur",
    title: "Coordinateur réseau",
    tagline: "Encadre une équipe d'agents commerciaux",
    desc: "Vous animez une équipe terrain dans votre département. Vous fixez les objectifs, suivez les commissions, validez les paiements de vos agents. Vous touchez une commission d'encadrement sur les ventes de votre réseau.",
    icon: Sparkles,
    tone: "from-success/15 to-success/5 border-success/40",
    cta: "Je veux être coordinateur",
  },
  {
    kind: "commercial",
    title: "Agent commercial",
    tagline: "Vendez FlexCard sur le terrain",
    desc: "Vous récupérez des cartes-démo chez votre imprimeur relais local. Vous prospectez (marchés, boutiques, événements). Quand un client veut sa carte, vous scannez une carte-démo, vous l'aidez à créer sa carte, et le QR de la carte-démo est lié à vie à son compte. Vous touchez une commission par carte vendue.",
    icon: Gift,
    tone: "from-primary/10 to-accent/5 border-primary/30",
    cta: "Je veux être commercial",
  },
  {
    kind: "partenaire",
    title: "Partenaire / Imprimeur relais",
    tagline: "Point de relais local pour les équipes terrain",
    desc: "Vous êtes imprimeur, distributeur ou apporteur d'affaires. Vous générez et imprimez les cartes-démo (QR uniques pré-générés, même charte graphique). Les commerciaux et coordinateurs viennent récupérer leurs stocks chez vous. Vous touchez une commission sur chaque carte activée par votre réseau.",
    icon: ShieldCheck,
    tone: "from-accent-orange/10 to-warning/5 border-accent-orange/30",
    cta: "Je veux être imprimeur",
  },
];

function MePage() {
  const navigate = useNavigate();
  const { request: requestParam } = Route.useSearch();
  const [openRequest, setOpenRequest] = useState<RoleKind | null>(requestParam ?? null);

  // Login form
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pwd,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    toast.success("Connecté");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/"><Logo className="h-8" /></Link>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Espace pro · /me
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Gauche : présentation 3 rôles */}
          <div className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Réseau commercial FlexCard
              </div>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Coordinateurs, commerciaux & imprimeurs
              </h1>
              <p className="mt-2 text-muted-foreground">
                L'espace privé des équipes terrain et des partenaires de FlexCard.
                Demandez votre accès, l'administration vous valide, et vous vous connectez.
              </p>
            </div>

            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.kind}
                  className={`rounded-2xl border-2 bg-gradient-to-r p-5 ${r.tone}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-background text-foreground shadow-glow">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold">{r.title}</div>
                      <div className="text-xs font-semibold text-muted-foreground mt-0.5">{r.tagline}</div>
                      <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{r.desc}</p>
                      <button
                        onClick={() => setOpenRequest(r.kind)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/90 px-4 py-2 text-xs font-semibold text-background hover:opacity-90"
                      >
                        {r.cta} <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Droite : connexion */}
          <div className="space-y-4 lg:sticky lg:top-24 self-start">
            <div className="surface-elevated p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <KeyRound className="h-3.5 w-3.5" /> Connexion membre
              </div>
              <h2 className="mt-3 text-xl font-bold">Déjà validé ? Connectez-vous</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Saisissez l'email et le mot de passe que vous avez choisis lors de votre demande.
              </p>
              <form onSubmit={signin} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com" required
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Mot de passe</label>
                  <input
                    type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                    placeholder="••••••••" required minLength={8}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
                  />
                </div>
                {error && <div className="text-xs text-destructive">{error}</div>}
                <button
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
                >
                  {busy ? "Connexion…" : <>Se connecter <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Pas encore membre ? Cliquez sur l'un des boutons à gauche pour faire votre demande.
              </p>
            </div>

            <div className="surface-elevated p-5 text-xs text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground">Comment ça marche</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Vous remplissez le formulaire de demande.</li>
                <li>L'admin valide votre profil sous 24 à 48 h.</li>
                <li>Vous recevez un email de confirmation.</li>
                <li>Vous vous connectez ici avec email + mot de passe.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {openRequest && (
        <RequestModal kind={openRequest} onClose={() => setOpenRequest(null)} />
      )}
    </div>
  );
}

function RequestModal({ kind, onClose }: { kind: RoleKind; onClose: () => void }) {
  const role = ROLES.find((r) => r.kind === kind)!;
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [quartier, setQuartier] = useState("");
  const [departement, setDepartement] = useState(kind === "coordinateur" ? "Abidjan" : "");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return setError("Email invalide");
    if (!firstName.trim() || !lastName.trim()) return setError("Nom et prénom requis");
    if (!city.trim() || !quartier.trim()) return setError("Ville et quartier requis");
    if (kind === "coordinateur" && !departement) return setError("Département requis");
    if (kind === "partenaire" && !companyName.trim()) return setError("Nom de l'imprimerie/structure requis");
    setError(""); setBusy(true);

    // Aucun mot de passe côté client : l'admin provisionne le compte et envoie
    // un mot de passe temporaire par email lors de l'approbation.
    const { error: err } = await (supabase as any).rpc("submit_role_request", {
      _kind: kind,
      _email: email.trim().toLowerCase(),
      _first_name: firstName.trim(),
      _last_name: lastName.trim(),
      _phone: phone.trim(),
      _city: city.trim(),
      _quartier: quartier.trim(),
      _departement: departement || null,
      _company_name: companyName.trim() || null,
    });
    setBusy(false);
    if (err) {
      setError(err.message || "Erreur d'envoi");
      return;
    }
    setSent(true);
    toast.success("Demande envoyée à l'admin");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg my-8 surface-elevated p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="float-right rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
          <X className="h-4 w-4" />
        </button>

        {sent ? (
          <div className="text-center py-6">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Demande envoyée !</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              L'administration FlexCard va examiner votre demande sous 24 à 48 h.
              Vous recevrez un email à <strong>{email}</strong> dès qu'elle sera validée.
            </p>
            <button onClick={onClose} className="mt-6 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow">
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Demande · {role.title}
            </div>
            <h2 className="mt-3 text-xl font-bold">Formulaire de demande</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              L'admin vous enverra un mot de passe temporaire par email après validation.
            </p>

            <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Prénom *" value={firstName} onChange={setFirstName} required />
              <Field label="Nom *" value={lastName} onChange={setLastName} required />
              <Field label="Email *" type="email" value={email} onChange={setEmail} required className="sm:col-span-2" icon={<Mail className="h-3.5 w-3.5" />} />
              {/* Le mot de passe est généré par l'admin lors de l'approbation et envoyé par email. */}
              <Field label="Téléphone (WhatsApp)" value={phone} onChange={setPhone} placeholder="07 12 34 56 78" className="sm:col-span-2" />

              {kind === "coordinateur" && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> Département *</label>
                  <select
                    value={departement} onChange={(e) => setDepartement(e.target.value)} required
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
                  >
                    {CI_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}

              <Field label="Ville *" value={city} onChange={setCity} required placeholder="Ex. Abidjan" />
              <Field label="Quartier *" value={quartier} onChange={setQuartier} required placeholder="Ex. Cocody" />

              {kind === "partenaire" && (
                <Field
                  label="Nom de l'imprimerie / structure *"
                  value={companyName} onChange={setCompanyName} required
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  className="sm:col-span-2"
                />
              )}

              {error && <div className="sm:col-span-2 text-xs text-destructive">{error}</div>}
              <button disabled={busy} className="sm:col-span-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50">
                {busy ? "Envoi en cours…" : <>Envoyer ma demande <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, className = "", icon, ...rest
}: {
  label: string; value: string; onChange: (v: string) => void; className?: string; icon?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) {
  return (
    <div className={className}>
      <label className="text-xs font-medium flex items-center gap-1">{icon}{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} {...rest}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
      />
    </div>
  );
}
