import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp, useCurrentProfile } from "@/lib/mock/store";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, Check, Camera, ArrowRight, Gift, Globe } from "lucide-react";
import { Logo } from "@/components/flex/Logo";
import { detectOperator, normalizePhone, slugify } from "@/lib/mock/utils";
import { BusinessCard } from "@/components/flex/BusinessCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ ref: z.string().optional() });

export const Route = createFileRoute("/onboarding/vocal")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Création vocale — FlexCard" }] }),
  component: VocalOnboardingPage,
});

type Lang = "fr" | "dioula" | "nouchi" | "baoule";

const LANGS: { code: Lang; label: string; nativeLabel: string; flag: string; ttsLang: string }[] = [
  { code: "fr",      label: "Français",     nativeLabel: "Français",          flag: "🇫🇷", ttsLang: "fr-FR" },
  { code: "dioula",  label: "Dioula",       nativeLabel: "Dioula (Jula)",     flag: "🇨🇮", ttsLang: "fr-FR" },
  { code: "nouchi",  label: "Nouchi",       nativeLabel: "Nouchi (Abidjan)",  flag: "🇨🇮", ttsLang: "fr-FR" },
  { code: "baoule",  label: "Baoulé",       nativeLabel: "Baoulé",            flag: "🇨🇮", ttsLang: "fr-FR" },
];

// Prompts par langue (FR de référence ; les dialectes affichent un mix dialect + FR).
const PROMPTS: Record<Lang, Record<string, string>> = {
  fr: {
    welcome: "Bonjour ! Bienvenue sur FlexCard, votre carte de visite digitale gratuite. Avant de commencer, avez-vous été invité par quelqu'un ?",
    ref: "Quel est le code à 6 chiffres de votre parrain ? Si vous n'en avez pas, dites « non ».",
    name: "Quel est votre nom et votre prénom ?",
    phone1: "Quel est votre numéro de téléphone principal ?",
    phone2: "Avez-vous un second numéro ? Si oui, dictez-le. Sinon, dites « non ».",
    phone3: "Avez-vous un troisième numéro ? Sinon, dites « non ».",
    activity: "Qu'est-ce que vous faites comme activité ou comme métier ?",
    city: "Où est-ce que vous travaillez exactement ? Dans quel quartier ou quelle ville ?",
    whatsapp: "Avez-vous WhatsApp ? Si oui, quel est votre numéro WhatsApp ?",
    review: "Je vais vous relire toutes vos informations. Si tout est juste, cliquez sur valider.",
    avatar: "Cliquez sur la zone bleue qui clignote pour ajouter votre photo de profil.",
    cover: "Cliquez sur la zone bleue pour ajouter une photo de votre boutique ou de votre atelier.",
    done: "Tout est parfait ! Votre carte FlexCard est prête. Voici votre code de parrainage.",
  },
  dioula: {
    welcome: "I ni ce ! Bienvenue sur FlexCard. C'est votre carte de visite, gratuite. Mɔgɔ dɔ ye i welela wa ?",
    ref: "Code parrain ye chiffres wɔɔrɔ : i ka di. Ni i ma sɔrɔ, fɔ « ayi ».",
    name: "I tɔgɔ ye di ? I jamu fana ?",
    phone1: "I ka telefɔni nimɔrɔ folɔ ye di ?",
    phone2: "Telefɔni nimɔrɔ filanan b'i bolo wa ? Ni a tɛ, fɔ « ayi ».",
    phone3: "Telefɔni nimɔrɔ sabanan b'i bolo wa ? Ni a tɛ, fɔ « ayi ».",
    activity: "I bɛ baara jumɛn kɛ ? I baara, a fɔ.",
    city: "I bɛ baara kɛ yɔrɔ jumɛn ? Quartier wala dugu ?",
    whatsapp: "WhatsApp b'i bolo wa ? Nimɔrɔ ye di ?",
    review: "An b'a fɔ tugun, ka segin a kan. Ni bɛɛ ka ɲi, jate.",
    avatar: "Digɛ photo yɔrɔ kan walisa ka i ja don.",
    cover: "Digɛ yɔrɔ kan walisa ka i ka magasin / atelier ja don.",
    done: "A bɛɛ ka ɲi ! I ka FlexCard labɛnna. Filɛ i ka code parrain.",
  },
  nouchi: {
    welcome: "Yo ! On est sur FlexCard, ta carte de visite gratos. Quelqu'un t'a chargé ou bien ?",
    ref: "Donne le code à 6 chiffres de ton parrain, mougou. Si t'as pas, dis « non ».",
    name: "C'est qui ton nom + prénom ?",
    phone1: "Donne ton premier zougou (numéro).",
    phone2: "T'as un deuxième zougou ? Si non, dis « non ».",
    phone3: "Et un troisième ? Si non, dis « non ».",
    activity: "Tu fais koi comme woro (boulot) ?",
    city: "Tu opères où exactement ? Quartier ou ville ?",
    whatsapp: "T'as le wozap (WhatsApp) ? Donne le numéro.",
    review: "On recap tout. Si c'est bon, tu valides.",
    avatar: "Tape la zone qui clignote pour mettre ta photo.",
    cover: "Tape la zone pour mettre la photo de ton magasin / atelier.",
    done: "C'est bon ! Ta FlexCard est dakpa (prête). Voilà ton code parrain.",
  },
  baoule: {
    welcome: "Akwaaba ! Wo a FlexCard nun. I carte gratuit. Sran kun klɛli wo ?",
    ref: "Code parrain (chiffres 6). Sɛ a nin nyɛn, ka « ayi ».",
    name: "I dunman? I jamu nin?",
    phone1: "I telefɔn nimɔrɔ klikli ye nyɛn?",
    phone2: "I le telefɔn nimɔrɔ nnyɔn? Sɛ ayi, ka « ayi ».",
    phone3: "Telefɔn nimɔrɔ nsan nyɛn? Sɛ ayi, ka « ayi ».",
    activity: "Ngue n'a wo yo? I junman ye nyɛn?",
    city: "Wo yo i junman lɛ? Quartier wala dugu nyɛn?",
    whatsapp: "WhatsApp wo le? Nimɔrɔ ye nyɛn?",
    review: "An kɛnan i ndɛ kpa. Sɛ ɔ ti kpa, valide.",
    avatar: "Klɛ zone bleue su naan i foto ka wlu.",
    cover: "Klɛ zone bleue naan i magasin foto ka wlu.",
    done: "Ɔ ti kpa! I FlexCard yɛ tin. I code parrain yɛ ɔ.",
  },
};

type StepDef = {
  key: keyof typeof PROMPTS.fr;
  field?: "name" | "phone1" | "phone2" | "phone3" | "activity" | "city" | "whatsapp" | "ref";
  optional?: boolean;
  isPhoto?: "avatar" | "cover";
  isInfo?: boolean;
};

const STEPS: StepDef[] = [
  { key: "welcome", isInfo: true },
  { key: "ref", field: "ref", optional: true },
  { key: "name", field: "name" },
  { key: "phone1", field: "phone1" },
  { key: "phone2", field: "phone2", optional: true },
  { key: "phone3", field: "phone3", optional: true },
  { key: "activity", field: "activity" },
  { key: "city", field: "city" },
  { key: "whatsapp", field: "whatsapp", optional: true },
  { key: "review", isInfo: true },
  { key: "avatar", isPhoto: "avatar" },
  { key: "cover", isPhoto: "cover", optional: true },
  { key: "done", isInfo: true },
];

function speak(text: string, lang: string = "fr-FR") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.93; u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {}
}

// Génère un code parrainage 6 chiffres
function genReferralCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function VocalOnboardingPage() {
  const me = useCurrentProfile(); // peut être null en mode standalone
  const navigate = useNavigate();
  const update = useApp((s) => s.updateCurrent);
  const { ref } = Route.useSearch();

  const [lang, setLang] = useState<Lang | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [data, setData] = useState({
    refCode: ref ?? "",
    firstName: me?.firstName ?? "", lastName: me?.lastName ?? "",
    phone1: "", phone2: "", phone3: "",
    activity: me?.title ?? "",
    city: me?.city ?? "",
    whatsapp: "",
    avatarUrl: me?.avatarUrl ?? "",
    coverUrl: me?.coverUrl ?? "",
  });
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [myReferral] = useState<string>(genReferralCode());
  const recRef = useRef<any>(null);

  const step = STEPS[stepIdx];
  const langDef = lang ? LANGS.find((l) => l.code === lang)! : null;
  const prompt = lang ? PROMPTS[lang][step.key] : "";

  // Speak prompt on step change — only after user has clicked "Commencer"
  useEffect(() => {
    if (!started || !langDef) return;
    speak(prompt, langDef.ttsLang);
    // À l'étape done, annoncer le code parrain chiffre par chiffre
    if (step.key === "done") {
      const spaced = myReferral.split("").join(", ");
      setTimeout(() => speak(`Votre code de parrainage est : ${spaced}. Répétez-le : ${spaced}.`, langDef.ttsLang), 2500);
    }
  }, [stepIdx, prompt, started, step.key, langDef, myReferral]);

  // ============ ÉCRAN 1 : Sélection de langue ============
  if (!lang) {
    return (
      <div className="min-h-screen bg-gradient-mesh grid place-items-center px-4">
        <div className="surface-elevated max-w-lg w-full p-8">
          <div className="text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow">
              <Globe className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Choisissez votre langue</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              I ka kan jumɛn fɔ ? · Ngue n'a wo kanga ? · Tu causes koi ?
            </p>
          </div>
          <div className="mt-6 grid gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onMouseEnter={() => speak(l.nativeLabel, l.ttsLang)}
                onClick={() => { setLang(l.code); speak(l.nativeLabel, l.ttsLang); }}
                className="flex items-center gap-4 rounded-xl border-2 border-border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-card"
              >
                <span className="text-3xl">{l.flag}</span>
                <div className="flex-1">
                  <div className="font-bold">{l.label}</div>
                  <div className="text-xs text-muted-foreground">{l.nativeLabel}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            Note : la voix synthétisée utilise actuellement la prononciation française pour tous les dialectes.
          </p>
        </div>
      </div>
    );
  }

  // ============ ÉCRAN 2 : Déblocage micro / audio ============
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-mesh grid place-items-center px-4">
        <div className="surface-elevated max-w-md w-full p-8 text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow animate-pulse-ring">
            <Mic className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Création vocale · {langDef!.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Je vais vous poser des questions à voix haute. Vous répondez à voix haute.
            Cliquez sur « Commencer » pour activer le son et le microphone.
          </p>
          <button
            onClick={async () => {
              try {
                if (navigator.mediaDevices?.getUserMedia) {
                  await navigator.mediaDevices.getUserMedia({ audio: true });
                }
              } catch {
                toast.error("Microphone refusé", { description: "Vous pouvez quand même taper vos réponses." });
              }
              try {
                const u = new SpeechSynthesisUtterance(" ");
                u.volume = 0; window.speechSynthesis.speak(u);
              } catch {}
              setStarted(true);
            }}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-4 text-base font-bold text-white shadow-glow"
          >
            <Mic className="h-5 w-5" /> Commencer
          </button>
          <button onClick={() => setLang(null)} className="mt-3 text-xs text-muted-foreground hover:text-foreground">
            ← Changer de langue
          </button>
        </div>
      </div>
    );
  }

  const next = () => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  const prev = () => setStepIdx((i) => Math.max(0, i - 1));

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Reconnaissance vocale non disponible", { description: "Utilise un navigateur compatible (Chrome, Edge)." });
      return;
    }
    const r = new SR();
    r.lang = langDef!.ttsLang; r.interimResults = true; r.continuous = false;
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
      next();
    } else if (step.field === "phone1" || step.field === "phone2" || step.field === "phone3" || step.field === "whatsapp") {
      const digits = said.replace(/\D/g, "");
      if (step.optional && (said.toLowerCase().includes("non") || !digits)) { next(); return; }
      if (digits.length < 8) { toast.error("Numéro non reconnu, réessayez chiffre par chiffre."); return; }
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

  const finish = async () => {
    const phones = [data.phone1, data.phone2, data.phone3]
      .filter(Boolean)
      .map((raw) => {
        const op = detectOperator(raw);
        return { number: normalizePhone(raw), operator: op === "Inconnu" ? "Orange" as const : op };
      });
    const slug = slugify(`${data.firstName}-${data.lastName}-${data.phone1.slice(-4)}`) || `user-${Date.now()}`;

    // 1) Si déjà connecté → MAJ profil local (mock store)
    if (me) {
      update({
        firstName: data.firstName, lastName: data.lastName,
        kind: "informel",
        title: data.activity, sector: data.activity || "Autre",
        city: data.city,
        phones,
        socials: data.whatsapp ? { whatsapp: data.whatsapp } : {},
        avatarUrl: data.avatarUrl || undefined,
        coverUrl: data.coverUrl || undefined,
        slug,
        hasPremium: true,
      });
      toast.success("Carte FlexCard activée !");
      navigate({ to: "/dashboard" });
      return;
    }

    // 2) Mode standalone : crée le profil via RPC publique (voir plan.md create_vocal_profile)
    try {
      const { data: result, error } = await (supabase as any).rpc("create_vocal_profile", {
        _slug: slug,
        _first_name: data.firstName,
        _last_name: data.lastName,
        _activity: data.activity,
        _city: data.city,
        _phone1: data.phone1,
        _phone2: data.phone2 || null,
        _phone3: data.phone3 || null,
        _whatsapp: data.whatsapp || null,
        _ref_code: data.refCode || null,
        _referral_code: myReferral,
        _avatar_url: data.avatarUrl || null,
        _cover_url: data.coverUrl || null,
      });
      if (error) throw error;
      const finalSlug = (result as any)?.slug ?? slug;
      toast.success("Carte FlexCard créée !");
      // WhatsApp confirmation link (l'utilisateur peut envoyer la carte à lui-même)
      if (data.whatsapp) {
        const phone = data.whatsapp.replace(/\D/g, "");
        const cardUrl = `${window.location.origin}/c/${finalSlug}`;
        const msg = encodeURIComponent(`Voici ma carte FlexCard : ${cardUrl}\nCode parrainage : ${myReferral}`);
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
      }
      navigate({ to: "/c/$slug", params: { slug: finalSlug } });
    } catch (err: any) {
      toast.error("Création impossible", { description: err?.message || "Réessayez dans un instant." });
    }
  };

  const preview = {
    ...(me ?? {
      id: "draft", email: "", kind: "informel" as const, slug: "draft",
      sector: "Autre", phones: [], socials: {}, gallery: [], templateId: "neon",
      palette: { primary: "#0066FF", accent: "#FF6B00", ink: "#0B1220" },
      hasPremium: false, prospects: [], createdAt: Date.now(),
    }),
    firstName: data.firstName || "Votre prénom",
    lastName: data.lastName || "Votre nom",
    title: data.activity || "Votre activité",
    city: data.city,
    avatarUrl: data.avatarUrl || me?.avatarUrl,
    coverUrl: data.coverUrl || me?.coverUrl,
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="border-b border-border/60 glass">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo className="h-7" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button onClick={() => setLang(null)} className="inline-flex items-center gap-1 hover:text-foreground">
              <Globe className="h-3 w-3" /> {langDef!.label}
            </button>
            <span>Étape {stepIdx + 1} / {STEPS.length}</span>
          </div>
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
              onClick={() => speak(prompt, langDef!.ttsLang)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white shadow-glow"
              aria-label="Réécouter"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <p className="text-base leading-relaxed text-foreground">{prompt}</p>
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

          {step.key === "done" && (
            <div className="mt-6 rounded-2xl border-2 border-success/40 bg-success/5 p-5 text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-success">Votre code de parrainage</div>
              <div className="mt-2 text-5xl font-black tracking-[0.3em] text-success">{myReferral}</div>
              <button
                onClick={() => speak(`Votre code de parrainage est ${myReferral.split("").join(", ")}`, langDef!.ttsLang)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-success/80 hover:text-success"
              >
                <Volume2 className="h-3 w-3" /> Réécouter le code
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                Partagez ce code à vos contacts. Chaque inscription rapporte une commission.
              </p>
            </div>
          )}

          {step.key === "done" ? (
            <button
              onClick={finish}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success px-5 py-4 text-base font-bold text-white shadow-glow"
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
          <BusinessCard profile={preview as any} variant="full" />
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
  return ({
    welcome: "Bienvenue", ref: "Code parrain", name: "Identité",
    phone1: "Téléphone principal", phone2: "Second numéro", phone3: "Troisième numéro",
    activity: "Votre activité", city: "Localisation", whatsapp: "WhatsApp",
    review: "Vérification", avatar: "Photo de profil", cover: "Photo du lieu",
    done: "C'est terminé !",
  } as Record<string, string>)[k] || k;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
