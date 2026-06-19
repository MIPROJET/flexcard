import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/mock/store";
import type { Profile } from "@/lib/mock/types";
import { AppShell } from "@/components/flex/AppShell";
import { generatePremiumCode } from "@/lib/mock/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const user = data.user;
      if (!user) {
        setAuthed(false);
        setReady(true);
        navigate({ to: "/auth" });
        return;
      }
      setAuthed(true);
      // Bridge: match a mock profile by email, else create a draft.
      const email = (user.email ?? "").toLowerCase();
      const state = useApp.getState();
      const existing = Object.values(state.profiles).find(
        (p) => p.email.toLowerCase() === email,
      );
      if (existing) {
        useApp.setState({ currentProfileId: existing.id });
      } else {
        const meta = (user.user_metadata ?? {}) as Record<string, string>;
        const id = `sb_${user.id}`;
        const slug =
          (meta.slug as string) ||
          email.split("@")[0].replace(/[^a-z0-9]+/g, "-");
        const draft: Profile = {
          id,
          slug,
          email,
          kind: (meta.kind as Profile["kind"]) ?? "particulier",
          firstName: meta.first_name ?? "",
          lastName: meta.last_name ?? "",
          title: meta.title ?? "",
          company: meta.company ?? "",
          sector: meta.sector ?? "",
          city: meta.city ?? "Abidjan",
          phones: [],
          socials: {},
          gallery: [],
          templateId: "vkard-cover",
          palette: { primary: "#2563eb", accent: "#0ea5e9", ink: "#0b1a3a" },
          hasPremium: false,
          premiumCode: generatePremiumCode(),
          prospects: [],
          createdAt: Date.now(),
        };
        useApp.setState((s) => ({
          profiles: { ...s.profiles, [id]: draft },
          currentProfileId: id,
        }));
      }
      setReady(true);
    }

    hydrate();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        useApp.setState({ currentProfileId: null });
        setAuthed(false);
        navigate({ to: "/auth" });
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        hydrate();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }
  if (!authed) return null;
  return <AppShell />;
}
