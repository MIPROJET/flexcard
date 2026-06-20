import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/flex/Logo";
import { Mail, ArrowRight, CreditCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ma-carte")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Accéder à ma carte — FlexCard" },
      { name: "description", content: "Retrouvez votre carte FlexCard. Aucun mot de passe, aucun code. Saisissez votre email." },
    ],
  }),
  component: MaCartePage,
});

function MaCartePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [autoChecking, setAutoChecking] = useState(true);

  // Auto-détection : si l'utilisateur est déjà connecté, on le redirige direct vers sa carte.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const userEmail = data.session?.user?.email;
      if (userEmail) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("slug")
          .eq("id", data.session!.user.id)
          .maybeSingle();
        if (prof?.slug) {
          navigate({ to: "/c/$slug", params: { slug: prof.slug } });
          return;
        }
      }
      // Sinon, pré-remplir email si stocké localement
      const remembered = typeof window !== "undefined" ? localStorage.getItem("flexcard:last_email") : null;
      if (remembered) setEmail(remembered);
      setAutoChecking(false);
    })();
  }, [navigate]);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Email invalide"); return; }
    setError(""); setBusy(true);

    // RPC publique : find_card_by_email (SECURITY DEFINER) — voir plan.md
    const { data, error: err } = await supabase.rpc("find_card_by_email", {
      _email: email.trim().toLowerCase(),
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    const slug = (data as any) as string | null;
    if (!slug) {
      setError("Aucune carte trouvée avec cet email. Vérifiez ou créez votre carte.");
      return;
    }
    try { localStorage.setItem("flexcard:last_email", email.trim().toLowerCase()); } catch {}
    toast.success("Carte trouvée !");
    navigate({ to: "/c/$slug", params: { slug } });
  };

  if (autoChecking) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-mesh">
        <div className="text-sm text-muted-foreground">Recherche de votre carte…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/"><Logo className="h-8" /></Link>
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-12">
        <div className="surface-elevated p-6 sm:p-8 text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow">
            <CreditCard className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Accéder à ma carte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Saisissez l'email que vous avez utilisé à la création. Aucun mot de passe, aucun code.
            Sur cet appareil, vous serez ensuite reconnu automatiquement.
          </p>

          <form onSubmit={lookup} className="mt-6 space-y-3 text-left">
            <div>
              <label className="text-xs font-medium flex items-center gap-1"><Mail className="h-3 w-3" /> Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com" required autoFocus
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
              />
            </div>
            {error && <div className="text-xs text-destructive">{error}</div>}
            <button
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
            >
              {busy ? "Recherche…" : <>Voir ma carte <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-5 text-xs text-muted-foreground">
            Vous n'avez pas encore de carte ?{" "}
            <Link to="/auth" className="font-semibold text-primary">Créez-la en 2 minutes</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
