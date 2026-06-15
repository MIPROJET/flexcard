import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicHeader, PublicFooter } from "@/components/flex/PublicHeader";
import { Printer, ShieldCheck, ArrowRight, FileCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/imprimeur")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Portail Imprimeur — FlexCard" },
      { name: "description", content: "Saisis le code Premium de ton client FlexCard pour générer sa carte recto-verso prête à imprimer." },
    ],
  }),
  component: ImprimeurPage,
});

function ImprimeurPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (!/^FX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleaned)) {
      setError("Format invalide. Exemple : FX-XXXX-XXXX-XXXX");
      return;
    }
    navigate({ to: "/print/$code", params: { code: cleaned } });
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <PublicHeader />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow">
            <Printer className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Portail Imprimeur</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Saisis le code Premium fourni par ton client. La carte recto-verso s'affiche immédiatement, prête à imprimer.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 surface-elevated p-6 sm:p-8">
          <label className="text-sm font-semibold">Code Premium FlexCard</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="FX-XXXX-XXXX-XXXX"
            className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-4 text-center text-xl font-bold tracking-widest outline-none focus:ring-brand uppercase"
            maxLength={16}
          />
          {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow">
            Générer la carte <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-4 text-xs text-muted-foreground">
            Démo — essaie <code className="bg-secondary px-1.5 py-0.5 rounded">FX-IKN0-V202-6FLX</code> (carte d'Inocent Koffi).
          </p>
        </form>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Tip icon={<ShieldCheck className="h-5 w-5" />} title="QR longue durée" desc="Niveau de correction d'erreur H — reste scannable même partiellement abîmé." />
          <Tip icon={<FileCheck className="h-5 w-5" />} title="Recommandations" desc="Papier 350g minimum, finition mate ou semi-mate, format carte de visite 85×54mm." />
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}

function Tip({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="surface-elevated p-5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
