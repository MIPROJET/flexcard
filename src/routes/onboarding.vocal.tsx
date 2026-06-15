import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useApp, useCurrentProfile } from "@/lib/mock/store";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, Check, X, Camera, ArrowRight, Gift } from "lucide-react";
import { Logo } from "@/components/flex/Logo";
import { detectOperator, normalizePhone, slugify } from "@/lib/mock/utils";
import { BusinessCard } from "@/components/flex/BusinessCard";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ ref: z.string().optional() });

export const Route = createFileRoute("/onboarding/vocal")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Création vocale — FlexCard" }] }),
  component: VocalOnboardingPage,
});

type StepDef = {
  key: string;
  prompt: string;
  field?: "name" | "phone1" | "phone2" | "phone3" | "activity" | "city" | "whatsapp" | "ref";
  optional?: boolean;
  validate?: (raw: string) => string | null;
  isPhoto?: "avatar" | "cover";
  isInfo?: boolean;
};

const STEPS: StepDef[] = [
  { key: "welcome", prompt: "Bonjour ! Bienvenue sur FlexCard, votre carte de visite digitale gratuite. Avant de commencer, avez-vous été invité par quelqu'un ?", isInfo: true },
  { key: "ref", prompt: "Quel est le code à 6 chiffres de votre parrain ? Si vous n'en avez pas, dites « non ».", field: "ref", optional: true },
  { key: "name", prompt: "Quel est votre nom et votre prénom ?", field: "name" },
  { key: "phone1", prompt: "Quel est votre numéro de téléphone principal ?", field: "phone1" },
  { key: "phone2", prompt: "Avez-vous un second numéro ? Si oui, dictez-le. Sinon, dites « non ».", field: "phone2", optional: true },
  { key: "phone3", prompt: "Avez-vous un troisième numéro ? Sinon, dites « non ».", field: "phone3", optional: true },
  { key: "activity", prompt: "Qu'est-ce que vous faites comme activité ou comme métier ?", field: "activity" },
  { key: "city", prompt: "Où est-ce que vous travaillez exactement ? Dans quel quartier ou quelle ville ?", field: "city" },
  { key: "whatsapp", prompt: "Avez-vous WhatsApp ? Si oui, quel est votre numéro WhatsApp ?", field: "whatsapp", optional: true },
  { key: "review", prompt: "Je vais vous relire toutes vos informations. Si tout est juste, cliquez sur valider.", isInfo: true },
  { key: "avatar", prompt: "Cliquez sur la zone bleue qui clignote pour ajouter votre photo de profil.", isPhoto: "avatar" },
  { key: "cover", prompt: "Cliquez sur la zone bleue pour ajouter une photo de votre boutique ou de votre atelier.", isPhoto: "cover", optional: true },
  { key: "done", prompt: "Tout est parfait ! Votre carte FlexCard est prête. Vous pouvez maintenant la partager.", isInfo: true },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR"; u.rate = 0.93; u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {}
}

function VocalOnboardingPage() {
  const me = useCurrentProfile();
  const navigate = useNavigate();
  const update = useApp((s) => s.updateCurrent);
  const { ref } = Route.useSearch();

  if (!me) return <Navigate to="/auth" search={{ kind: undefined, ref }} />;

  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState({
    refCode: ref ?? "",
    firstName: me.firstName, lastName: me.lastName,
    phone1: "", phone2: "", phone3: "",
    activity: me.title || "",
    city: me.city || "",
    whatsapp: "",
    avatarUrl: me.avatarUrl ?? "",
    coverUrl: me.coverUrl ?? "",
  });
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<any>(null);

  const step = STEPS[stepIdx];

  // Speak prompt on step change
  useEffect(() => {
    speak(step.prompt);
  }, [stepIdx, step.prompt]);

  const next = () => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  const prev = () => setStepIdx((i) => Math.max(0, i - 1));

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Reconnaissance vocale non disponible", { description: "Utilise un navigateur compatible (Chrome, Edge)." });
      return;
    }
    const r = new SR();
    r.lang = "fr-FR"; r.interimResults = true; r.continuous = false;
    r.onresult = (e: any) => {
      const text = Array.from(e.results).map((res: any) => res[0].transcript).join("");
      setTranscript(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    recRef.current = r;
    setListening(true);
    setTranscript("");
  };

  const stopListening = () => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  };

  const validateAndNext = () => {
    if (step.isInfo) { next(); return; }
    const said = transcript.trim();
    if (step.field === "ref") {
      const code = said.replace(/\D/g, "");
      if (code.length === 6) setData((d) => ({ ...d, refCode: code }));
      next();
    } else if (step.field === "name") {
      const parts = said.split(/\s+/);
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";
      if (!first) { toast.error("Je n'ai pas entendu votre nom. Réessayez."); return; }
      setData((d) => ({ ...d, firstName: cap(first), lastName: cap(last) }));
      speak(`Votre nom est bien ${first} ${last} ?`);
      next();
    } else if (step.field === "phone1" || step.field === "phone2" || step.field === "phone3" || step.field === "whatsapp") {
      const digits = said.replace(/\D/g, "");
      if (step.optional && (said.toLowerCase().includes("non") || !digits)) { next(); return; }
      if (digits.length < 8) { toast.error("Numéro non reconnu, réessayez en dictant chiffre par chiffre."); return; }
      setData((d) => ({ ...d, [step.field!]: digits }));
      next();
    } else if (step.field === "activity" || step.field === "city") {
      if (!said) { toast.error("Je n'ai rien entendu, réessayez."); return; }
      setData((d) => ({ ...d, [step.field!]: said }));
      next();
    }
    setTranscript("");
  };

  const handlePhotoPick = (field: "avatar" | "cover") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setData((d) => ({ ...d, [field === "avatar" ? "avatarUrl" : "coverUrl"]: url }));
    setTimeout(() => next(), 600);
  };

  const finish = () => {
    const phones = [data.phone1, data.phone2, data.phone3]
      .filter(Boolean)
      .map((raw) => {
        const op = detectOperator(raw);
        return { number: normalizePhone(raw), operator: op === "Inconnu" ? "Orange" as const : op };
      });
    update({
      firstName: data.firstName, lastName: data.lastName,
      kind: "informel",
      title: data.activity, sector: data.activity || "Autre",
      city: data.city,
      phones,
      socials: data.whatsapp ? { whatsapp: data.whatsapp } : {},
      avatarUrl: data.avatarUrl || undefined,
      coverUrl: data.coverUrl || undefined,
      slug: slugify(`${data.firstName}-${data.lastName}`) || me.id,
      hasPremium: true, // vocal users get premium imprimable à vie
    });
    toast.success("Votre carte FlexCard est prête !");
    navigate({ to: "/dashboard" });
  };

  const preview = {
    ...me,
    firstName: data.firstName, lastName: data.lastName,
    title: data.activity, city: data.city,
    avatarUrl: data.avatarUrl || me.avatarUrl,
    coverUrl: data.coverUrl || me.coverUrl,
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="border-b border-border/60 glass">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo className="h-7" />
          <div className="text-xs text-muted-foreground">Étape {stepIdx + 1} / {STEPS.length}</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="surface-elevated p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-orange/15 px-3 py-1 text-xs font-semibold text-accent-orange">
            <Mic className="h-3.5 w-3.5" /> Interface vocale · FlexCard
          </div>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{stepTitle(step.key)}</h1>

          <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/20 p-4 flex gap-3 items-start">
            <button
              onClick={() => speak(step.prompt)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white shadow-glow"
              aria-label="Réécouter"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <p className="text-base leading-relaxed text-foreground">{step.prompt}</p>
          </div>

          {/* Step content */}
          {step.isPhoto && (
            <div className="mt-6">
              <label className="block cursor-pointer">
                <div className="grid place-items-center rounded-2xl border-4 border-dashed border-primary/60 bg-primary/5 p-10 text-center transition animate-pulse hover:bg-primary/10">
                  {(step.isPhoto === "avatar" ? data.avatarUrl : data.coverUrl) ? (
                    <img
                      src={step.isPhoto === "avatar" ? data.avatarUrl : data.coverUrl}
                      alt="Photo"
                      className="h-32 w-32 rounded-2xl object-cover"
                    />
                  ) : (
                    <>
                      <Camera className="h-10 w-10 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-primary">Cliquez ici pour ajouter votre photo</p>
                      <p className="mt-1 text-xs text-muted-foreground">Formats : JPG, PNG. 5 Mo max.</p>
                    </>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoPick(step.isPhoto)} />
                </div>
              </label>
              {step.optional && (
                <button onClick={next} className="mt-3 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  Passer cette étape
                </button>
              )}
            </div>
          )}

          {step.field && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-glow transition ${listening ? "bg-destructive animate-pulse" : "bg-gradient-brand"}`}
                >
                  {listening ? <><MicOff className="h-4 w-4" /> Arrêter</> : <><Mic className="h-4 w-4" /> Parler maintenant</>}
                </button>
                <div className="text-xs text-muted-foreground">ou tape ta réponse ci-dessous</div>
              </div>
              <input
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Votre réponse…"
                className="mt-4 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-brand"
              />
            </div>
          )}

          {/* Review step */}
          {step.key === "review" && (
            <div className="mt-6 space-y-2 rounded-2xl bg-secondary/50 p-4 text-sm">
              <ReviewRow label="Nom" value={`${data.firstName} ${data.lastName}`} />
              <ReviewRow label="Activité" value={data.activity} />
              <ReviewRow label="Ville / Lieu" value={data.city} />
              <ReviewRow label="Téléphones" value={[data.phone1, data.phone2, data.phone3].filter(Boolean).join(" · ")} />
              {data.whatsapp && <ReviewRow label="WhatsApp" value={data.whatsapp} />}
              {data.refCode && <ReviewRow label="Code parrain" value={data.refCode} />}
            </div>
          )}

          {step.key === "done" ? (
            <button
              onClick={finish}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success px-5 py-4 text-base font-bold text-white shadow-glow"
            >
              <Check className="h-5 w-5" /> Activer ma carte FlexCard
            </button>
          ) : (
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={prev}
                disabled={stepIdx === 0}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                Retour
              </button>
              <button
                onClick={step.isInfo ? next : validateAndNext}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step.key === "ref" && data.refCode && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <Gift className="h-3.5 w-3.5" /> Parrain enregistré : {data.refCode}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-6 self-start">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Aperçu de votre carte</div>
          <BusinessCard profile={preview} variant="full" />
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="font-semibold">{value || "—"}</span>
    </div>
  );
}

function stepTitle(k: string): string {
  return {
    welcome: "Bienvenue", ref: "Code parrain", name: "Identité",
    phone1: "Téléphone principal", phone2: "Second numéro", phone3: "Troisième numéro",
    activity: "Votre activité", city: "Localisation", whatsapp: "WhatsApp",
    review: "Vérification", avatar: "Photo de profil", cover: "Photo du lieu",
    done: "C'est terminé !",
  }[k] || k;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
