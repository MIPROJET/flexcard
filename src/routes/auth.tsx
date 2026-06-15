import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicHeader } from "@/components/flex/PublicHeader";
import { useApp } from "@/lib/mock/store";
import { DEMO_ACCOUNTS } from "@/lib/mock/seed";
import { useEffect, useState } from "react";
import { Mail, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, User2, User, Store, Building2, Gift, Mic } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import type { AccountKind } from "@/lib/mock/types";

const searchSchema = z.object({
  ref: z.string().optional(),
  kind: z.enum(["particulier", "informel", "entreprise"]).optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Connexion / Inscription — FlexCard" }] }),
  component: AuthPage,
});

type Step = "kind" | "form" | "otp";

const KIND_OPTIONS: { kind: AccountKind; label: string; desc: string; icon: React.ReactNode; tone: string }[] = [
  {
    kind: "particulier", label: "Particulier", tone: "from-primary/15 to-primary/5 border-primary/40",
    desc: "Salarié, freelance, étudiant, indépendant. Carte digitale + QR code.",
    icon: <User className="h-6 w-6" />,
  },
  {
    kind: "informel", label: "Activité informelle", tone: "from-warning/15 to-warning/5 border-warning/40",
    desc: "Boutique, atelier, vendeuse, artisan. WhatsApp prioritaire, géoloc, photos.",
    icon: <Store className="h-6 w-6" />,
  },
  {
    kind: "entreprise", label: "Entreprise / Organisation", tone: "from-accent-orange/15 to-accent-orange/5 border-accent-orange/40",
    desc: "Équipe avec charte graphique, jusqu'à 100+ employés, gestion centralisée.",
    icon: <Building2 className="h-6 w-6" />,
  },
];

const SECTORS_BY_KIND: Record<AccountKind, string[]> = {
  particulier: [
    "Tech & Innovation", "Architecture & BTP", "Photo & Vidéo", "Conseil & Formation",
    "Droit & Juridique", "Musique & Événementiel", "Santé & Bien-être", "Finance & Banque",
    "Éducation", "Marketing & Communication", "Mode & Beauté", "Autre",
  ],
  informel: [
    "Restauration & Food", "Coiffure & Esthétique", "Couture & Mode", "Mécanique & Auto",
    "Menuiserie & Bois", "Maçonnerie", "Plomberie / Électricité", "Commerce de détail",
    "Élevage / Agriculture", "Transport / Taxi", "Pâtisserie / Vente plats", "Autre",
  ],
  entreprise: [
    "Tech & Innovation", "Finance & Banque", "Industrie / Manufacturing", "Commerce & Distribution",
    "BTP & Immobilier", "Conseil & Services", "Santé & Pharmacie", "Éducation & Formation",
    "Médias & Communication", "Transport & Logistique", "Énergie & Mines", "Autre",
  ],
};

function AuthPage() {
  const navigate = useNavigate();
  const { ref, kind: urlKind } = Route.useSearch();
  const requestOtp = useApp((s) => s.requestOtp);
  const verifyOtp = useApp((s) => s.verifyOtp);
  const updateCurrent = useApp((s) => s.updateCurrent);

  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<AccountKind>(urlKind ?? "particulier");

  // Common
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sector, setSector] = useState(SECTORS_BY_KIND.particulier[0]);
  const [refCode, setRefCode] = useState(ref ?? "");

  // Per-kind specific
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [activity, setActivity] = useState("");
  const [city, setCity] = useState("Abidjan");
  const [address, setAddress] = useState("");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (urlKind) { setKind(urlKind); setStep("form"); } }, [urlKind]);
  useEffect(() => { setSector(SECTORS_BY_KIND[kind][0]); }, [kind]);

  const chooseKind = (k: AccountKind) => { setKind(k); setStep("form"); };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Email invalide"); return; }
    if (!firstName.trim() || !lastName.trim()) { setError("Nom et prénom requis"); return; }
    setError("");
    requestOtp(email);
    toast.success("Code envoyé !", { description: `Pour la démo : 123456`, duration: 6000 });
    setStep("otp");
  };

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = verifyOtp(email, otp);
    if (!profile) { setError("Code invalide. Pour la démo : 123456"); return; }
    // Apply selected kind + pre-filled fields if it's a fresh account
    updateCurrent({
      kind, firstName, lastName, sector,
      title: title || (kind === "informel" ? activity : ""),
      company: kind === "entreprise" ? company : (kind === "informel" ? activity : company),
      city, description: kind === "informel" && address ? address : undefined,
    });
    toast.success(`Bienvenue ${firstName} !`, { description: refCode ? `Parrain enregistré: ${refCode}` : "Profil créé." });
    if (!profile.firstName && !firstName) navigate({ to: "/onboarding" });
    else navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <PublicHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="surface-elevated p-6 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <KeyRound className="h-3.5 w-3.5" /> Sans mot de passe · OTP par email
          </div>

          {step === "kind" && (
            <>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Bienvenue sur FlexCard</h1>
              <p className="mt-2 text-muted-foreground">Choisis ton profil pour commencer.</p>
              <div className="mt-8 grid gap-3">
                {KIND_OPTIONS.map((opt) => (
                  <button
                    key={opt.kind}
                    onClick={() => chooseKind(opt.kind)}
                    className={`group flex items-center gap-4 rounded-2xl border-2 bg-gradient-to-r p-5 text-left transition hover:shadow-card ${opt.tone}`}
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-background text-foreground shadow-glow">
                      {opt.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold">{opt.label}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{opt.desc}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Mic className="h-4 w-4 text-accent-orange" /> Vous ne savez pas lire ni écrire ?
                </div>
                <p className="mt-1 text-xs text-muted-foreground">L'interface vocale crée votre carte pour vous.</p>
                <button
                  onClick={() => navigate({ to: "/onboarding/vocal" })}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent-orange px-4 py-2 text-sm font-semibold text-white shadow-glow"
                >
                  <Mic className="h-4 w-4" /> Créer ma carte à la voix
                </button>
              </div>
            </>
          )}

          {step === "form" && (
            <>
              <button onClick={() => setStep("kind")} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Changer de profil
              </button>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                Inscription · {KIND_OPTIONS.find((o) => o.kind === kind)!.label}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                On t'envoie un code à 6 chiffres par email pour valider ton inscription.
              </p>

              <form onSubmit={submitForm} className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Prénom *" value={firstName} onChange={setFirstName} required />
                <Field label="Nom *" value={lastName} onChange={setLastName} required />
                <Field label="Email *" value={email} onChange={setEmail} type="email" placeholder="prenom@exemple.com" className="sm:col-span-2" required />

                {kind === "particulier" && (
                  <>
                    <Field label="Titre / Poste" value={title} onChange={setTitle} placeholder="ex. Photographe" />
                    <Field label="Entreprise (optionnel)" value={company} onChange={setCompany} />
                  </>
                )}
                {kind === "informel" && (
                  <>
                    <Field label="Activité / Métier *" value={activity} onChange={setActivity} placeholder="ex. Couturière, Coiffeur" required />
                    <Field label="Adresse précise *" value={address} onChange={setAddress} placeholder="Quartier, repère" required />
                  </>
                )}
                {kind === "entreprise" && (
                  <>
                    <Field label="Raison sociale *" value={company} onChange={setCompany} required />
                    <Field label="Fonction du dirigeant" value={title} onChange={setTitle} placeholder="ex. Directeur Général" />
                  </>
                )}

                <SelectField
                  label="Secteur d'activité *"
                  value={sector}
                  onChange={setSector}
                  options={SECTORS_BY_KIND[kind]}
                  className="sm:col-span-2"
                />
                <Field label="Ville" value={city} onChange={setCity} />
                <div>
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-accent-orange" /> Code parrain (optionnel)
                  </label>
                  <input
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6 chiffres"
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
                  />
                </div>

                {error && <div className="text-sm text-destructive sm:col-span-2">{error}</div>}
                <button className="sm:col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow">
                  Recevoir mon code OTP <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <button onClick={() => setStep("form")} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Retour
              </button>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Vérifie ton email</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Code envoyé à <strong>{email}</strong>. Pour la démo : <strong>123456</strong>.
              </p>
              <form onSubmit={submitOtp} className="mt-6 space-y-4">
                <input
                  inputMode="numeric" pattern="[0-9]*" maxLength={6} autoFocus
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-input bg-background px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:ring-brand"
                  placeholder="••••••"
                />
                {error && <div className="text-sm text-destructive">{error}</div>}
                <button className="w-full rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow">
                  Valider mon inscription
                </button>
                <div className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="inline h-3.5 w-3.5 mr-1 text-success" />
                  Mode démo — code universel : <strong>123456</strong>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="surface-elevated p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User2 className="h-4 w-4 text-primary" /> Comptes de démonstration
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Clique sur un compte pour ouvrir directement l'OTP.</p>
          <ul className="mt-4 max-h-[520px] overflow-y-auto divide-y divide-border/60">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  onClick={() => { setEmail(a.email); setFirstName(a.name.split(" ")[0] || ""); setLastName(a.name.split(" ").slice(1).join(" ") || ""); setKind(a.kind); setStep("otp"); requestOtp(a.email); toast.success("Code envoyé", { description: "Démo : 123456" }); }}
                  className="flex w-full items-start gap-3 px-2 py-3 text-left hover:bg-secondary/60 rounded-lg"
                >
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-xs font-bold text-white">
                    {a.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{a.name}</span>
                      {a.kind === "entreprise" && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">ENTREPRISE</span>
                      )}
                      {a.kind === "informel" && (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">INFORMEL</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{a.title} · {a.email}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, className = "", ...rest }: { label: string; value: string; onChange: (v: string) => void; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) {
  return (
    <div className={className}>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        {...rest}
        className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, className = "" }: { label: string; value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
  return (
    <div className={className}>
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
