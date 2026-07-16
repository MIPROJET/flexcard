import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicHeader } from "@/components/flex/PublicHeader";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Mail, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, User, Store, Building2, Gift, Mic, Sparkles, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import type { AccountKind } from "@/lib/mock/types";
import { SECTORS_BY_KIND } from "@/lib/mock/sectors";
import { getVocalResumeHref, navigateToVocalOnboarding } from "@/lib/vocalDiagnostics";

const searchSchema = z.object({
  ref: z.string().optional(),
  kind: z.enum(["particulier", "informel", "entreprise"]).optional(),
  voiceFallback: z.string().optional(),
  next: z.string().optional(),
});

function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  // Only same-origin relative paths.
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Connexion / Inscription — FlexCard" }] }),
  component: AuthPage,
});

type Step = "kind" | "form" | "sent";

const KIND_OPTIONS: { kind: AccountKind; label: string; desc: string; icon: React.ReactNode; tone: string }[] = [
  { kind: "particulier", label: "Particulier", tone: "from-primary/15 to-primary/5 border-primary/40",
    desc: "Salarié, freelance, étudiant, indépendant. Carte digitale + QR code.",
    icon: <User className="h-6 w-6" /> },
  { kind: "informel", label: "Activité informelle", tone: "from-warning/15 to-warning/5 border-warning/40",
    desc: "Boutique, atelier, vendeuse, artisan. WhatsApp prioritaire, géoloc, photos.",
    icon: <Store className="h-6 w-6" /> },
  { kind: "entreprise", label: "Entreprise / Organisation", tone: "from-accent-orange/15 to-accent-orange/5 border-accent-orange/40",
    desc: "Équipe avec charte graphique, jusqu'à 100+ employés, gestion centralisée.",
    icon: <Building2 className="h-6 w-6" /> },
];

function AuthPage() {
  const navigate = useNavigate();
  const { ref, kind: urlKind, voiceFallback, next } = Route.useSearch();
  const nextPath = safeNext(next);
  const postLogin = nextPath ?? "/dashboard";

  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<AccountKind>(urlKind ?? "particulier");

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sector, setSector] = useState(SECTORS_BY_KIND.particulier[0]);
  const [refCode, setRefCode] = useState(ref ?? "");
  const [city, setCity] = useState("Abidjan");
  const [activity, setActivity] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voiceError, setVoiceError] = useState<{ message: string; nextAction: string } | null>(
    voiceFallback ? {
      message: "La page de connexion s'est ouverte au lieu du parcours vocal.",
      nextAction: "Reprendre directement la création vocale avec le bouton ci-dessous.",
    } : null,
  );

  useEffect(() => { if (urlKind) { setKind(urlKind); setStep("form"); } }, [urlKind]);
  useEffect(() => { setSector(SECTORS_BY_KIND[kind][0]); }, [kind]);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) window.location.href = postLogin;
    });
  }, [postLogin]);

  const chooseKind = (k: AccountKind) => { setKind(k); setStep("form"); };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Email invalide"); return; }
    if (!firstName.trim() || !lastName.trim()) { setError("Nom et prénom requis"); return; }
    setError(""); setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}${postLogin}`,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          kind,
          sector,
          city,
          title: title || activity,
          company: company || activity,
          ref_code: refCode || null,
        },
      },
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    try { localStorage.setItem("flexcard:last_email", email.trim().toLowerCase()); } catch {}
    toast.success("Lien magique envoyé !", { description: "Ouvre ton email et clique sur le lien pour te connecter. Pas de code à saisir." });
    setStep("sent");
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <PublicHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="surface-elevated p-6 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <KeyRound className="h-3.5 w-3.5" /> Sans mot de passe · Lien magique par email
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
                  <Mic className="h-4 w-4 text-[color:var(--accent-orange)]" /> Vous ne savez pas lire ni écrire ?
                </div>
                <p className="mt-1 text-xs text-muted-foreground">L'interface vocale crée votre carte pour vous.</p>
                <button
                  onClick={() => {
                    setVoiceError(null);
                    navigateToVocalOnboarding({
                      navigate,
                      source: "auth-voice-shortcut",
                      onError: (message, nextAction) => setVoiceError({ message, nextAction }),
                    });
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent-orange)] px-4 py-2 text-sm font-semibold text-white shadow-glow"
                >
                  <Mic className="h-4 w-4" /> Créer ma carte à la voix
                </button>
                {voiceError && (
                  <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs">
                    <div className="font-semibold text-destructive">La création vocale ne s'est pas ouverte.</div>
                    <p className="mt-1 text-muted-foreground">{voiceError.message}</p>
                    <p className="mt-1 font-medium">Action suivante : {voiceError.nextAction}</p>
                    <a href={getVocalResumeHref()} className="mt-2 inline-flex rounded-lg bg-gradient-brand px-3 py-2 font-semibold text-white">
                      Reprendre la création vocale
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          {step === "form" && (
            <>
              <button onClick={() => setStep("kind")} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Changer de profil
              </button>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                {KIND_OPTIONS.find((o) => o.kind === kind)!.label}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu reçois un <strong>lien magique</strong> par email. Un clic et tu es connecté — aucun mot de passe, aucun code à saisir.
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
                    <Field label="Adresse / Repère" value={city} onChange={setCity} />
                  </>
                )}
                {kind === "entreprise" && (
                  <>
                    <Field label="Raison sociale *" value={company} onChange={setCompany} required />
                    <Field label="Fonction" value={title} onChange={setTitle} placeholder="ex. Directeur" />
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
                    <Gift className="h-3.5 w-3.5 text-[color:var(--accent-orange)]" /> Code parrain (optionnel)
                  </label>
                  <input
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6 chiffres"
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
                  />
                </div>

                {error && <div className="text-sm text-destructive sm:col-span-2">{error}</div>}
                <button disabled={busy} className="sm:col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50">
                  {busy ? "Envoi en cours…" : <>Recevoir mon lien magique <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            </>
          )}

          {step === "sent" && (
            <>
              <button onClick={() => setStep("form")} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Retour
              </button>
              <div className="mt-6 grid place-items-center text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-success/10 text-success">
                  <Mail className="h-8 w-8" />
                </div>
                <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Vérifie ton email</h1>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Nous avons envoyé un lien magique à <strong>{email}</strong>.<br />
                  Ouvre l'email et clique sur le lien — tu seras connecté automatiquement.
                  <br /><span className="text-xs">Aucun mot de passe, aucun code à saisir, ni maintenant ni plus tard.</span>
                </p>
                <div className="mt-6 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground max-w-md">
                  <CheckCircle2 className="inline h-3.5 w-3.5 mr-1 text-success" />
                  Une fois connecté, ta session reste active : tu n'auras plus à te reconnecter sur cet appareil.
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="surface-elevated p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-[color:var(--accent-orange)]" /> Comment ça marche
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Saisis ton email à gauche, reçois un lien magique, clique. Pas de mot de passe, pas de code OTP — ta session reste active sur cet appareil.
            </p>
          </div>

          <div className="surface-elevated p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Vous êtes pro du réseau ?
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Coordinateurs, agents commerciaux et imprimeurs relais ont un espace dédié.
            </p>
            <a href="/me" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-glow">
              Accéder à l'espace pro →
            </a>
          </div>
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
