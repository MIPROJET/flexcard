import type { Profile } from "./types";

/** Deterministic 6-digit referral code from a profile id. */
export function referralCodeFor(p: Pick<Profile, "id">): string {
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return String(100000 + (h % 900000));
}

export type FidelityLevel = {
  key: "decouverte" | "bronze" | "argent" | "or" | "saphir" | "diamant" | "platine";
  label: string;
  minBalance: number;
  minReferrals: number;
  /** card background css */
  background: string;
  /** text color */
  ink: string;
  accent: string;
};

export const FIDELITY_LEVELS: FidelityLevel[] = [
  {
    key: "decouverte", label: "Découverte", minBalance: 0, minReferrals: 0,
    background: "linear-gradient(135deg,#6b7280,#374151)", ink: "#ffffff", accent: "#cbd5e1",
  },
  {
    key: "bronze", label: "Bronze", minBalance: 2_500, minReferrals: 1,
    background: "linear-gradient(135deg,#b45309,#7c2d12)", ink: "#fff7ed", accent: "#fcd34d",
  },
  {
    key: "argent", label: "Argent", minBalance: 10_000, minReferrals: 5,
    background: "linear-gradient(135deg,#9ca3af,#475569)", ink: "#ffffff", accent: "#e5e7eb",
  },
  {
    key: "or", label: "Or", minBalance: 25_000, minReferrals: 15,
    background: "linear-gradient(135deg,#fbbf24,#b45309)", ink: "#1f2937", accent: "#fde68a",
  },
  {
    key: "saphir", label: "Saphir", minBalance: 50_000, minReferrals: 30,
    background: "linear-gradient(135deg,#1e3a8a,#0f172a)", ink: "#ffffff", accent: "#60a5fa",
  },
  {
    key: "diamant", label: "Diamant", minBalance: 100_000, minReferrals: 50,
    background: "linear-gradient(135deg,#e0f2fe,#94a3b8)", ink: "#0f172a", accent: "#0ea5e9",
  },
  {
    key: "platine", label: "Platine", minBalance: 250_000, minReferrals: 100,
    background: "linear-gradient(135deg,#c4b5fd,#64748b,#e2e8f0)", ink: "#0f172a", accent: "#a78bfa",
  },
];

export function fidelityFor(balance: number, referrals: number): FidelityLevel {
  let current = FIDELITY_LEVELS[0];
  for (const lvl of FIDELITY_LEVELS) {
    if (balance >= lvl.minBalance || referrals >= lvl.minReferrals) current = lvl;
  }
  return current;
}

/** Mock commission balance derived from prospects (demo). */
export function mockBalanceFor(p: Profile): number {
  // 500 F per prospect + bonus if premium
  return p.prospects.length * 500 + (p.hasPremium ? 4000 : 0);
}

/** Mock filleul (referral) list — derive from other profiles' prospects pointing to current user phones. */
export function mockReferralsCount(p: Profile): number {
  // 1 referral per 2 visits, capped
  const visits = p.prospects.reduce((s, x) => s + x.visits, 0);
  return Math.floor(visits / 2);
}
