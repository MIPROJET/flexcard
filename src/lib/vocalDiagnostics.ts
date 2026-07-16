const STORAGE_KEY = "flexcard:vocal:execution-log";

export const VOCAL_ONBOARDING_PATH = "/onboarding/vocal";

export type VocalLogLevel = "info" | "success" | "warning" | "error";

export type VocalLogEntry = {
  id: string;
  at: string;
  level: VocalLogLevel;
  step: string;
  message: string;
  nextAction?: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && !!window.sessionStorage;
}

export function readVocalLog(): VocalLogEntry[] {
  if (!canUseStorage()) return [];
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "[]") as VocalLogEntry[];
  } catch {
    return [];
  }
}

export function appendVocalLog(entry: Omit<VocalLogEntry, "id" | "at">) {
  const full: VocalLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    ...entry,
  };

  const line = `[FlexCard Vocal] ${full.step} — ${full.message}${full.nextAction ? ` | Action: ${full.nextAction}` : ""}`;
  if (full.level === "error") console.error(line);
  else if (full.level === "warning") console.warn(line);
  else console.info(line);

  if (canUseStorage()) {
    const next = [...readVocalLog(), full].slice(-80);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("flexcard:vocal-log", { detail: next }));
  }
  return full;
}

export function clearVocalLog() {
  if (!canUseStorage()) return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("flexcard:vocal-log", { detail: [] }));
}

export function getVocalResumeHref(source?: string) {
  const params = new URLSearchParams({ resume: "1" });
  if (source) params.set("source", source);
  return `${VOCAL_ONBOARDING_PATH}?${params.toString()}`;
}

export function navigateToVocalOnboarding({
  navigate,
  source,
  onError,
}: {
  navigate: (opts: any) => unknown;
  source: string;
  onError?: (message: string, nextAction: string) => void;
}) {
  appendVocalLog({
    level: "info",
    step: "navigation",
    message: `Clic reçu depuis ${source}`,
    nextAction: "Ouverture de la création vocale",
  });

  if (canUseStorage()) {
    window.sessionStorage.setItem("flexcard:vocal:last-source", source);
  }

  const fail = (message: string) => {
    const nextAction = "Cliquez sur “Reprendre la création vocale” ou ouvrez /onboarding/vocal directement.";
    appendVocalLog({ level: "error", step: "navigation", message, nextAction });
    onError?.(message, nextAction);
  };

  try {
    // Force une vraie navigation navigateur : le parcours vocal ne dépend plus
    // d'un état auth/TanStack éventuellement bloqué sur /auth.
    window.location.assign(getVocalResumeHref(source));
  } catch (err: any) {
    fail(err?.message || "La navigation directe vers le parcours vocal a échoué.");
    try {
      const result = navigate({ to: VOCAL_ONBOARDING_PATH, search: { resume: "1", source } });
      void Promise.resolve(result).catch((navErr) => fail(navErr?.message || "La navigation interne vers le parcours vocal a échoué."));
    } catch (navErr: any) {
      fail(navErr?.message || "La navigation interne vers le parcours vocal a échoué.");
      return false;
    }
  }

  return true;
}