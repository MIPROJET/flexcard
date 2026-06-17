import logoOfficial from "@/assets/flexcard-logo-official.png.asset.json";

/**
 * Carte premium NFC — fidèle au prototype fourni.
 * Fond navy #0a1a3a, ratio carte bancaire (1.586:1), coins doux.
 */
export function PremiumCardNFC({
  side = "front",
  className = "",
}: {
  side?: "front" | "back";
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-[1.4rem] shadow-2xl ${className}`}
      style={{ background: "#0a1a3a" }}
    >
      {/* léger éclat haut-droit pour relief */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 60%)" }}
      />

      {side === "front" ? <NfcGlyph /> : <BackLogo />}
    </div>
  );
}

function NfcGlyph() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <svg viewBox="0 0 200 200" className="h-[58%] w-[58%]" fill="none" stroke="#ffffff" strokeWidth="11" strokeLinecap="round">
        <circle cx="100" cy="100" r="86" />
        {/* lettre N */}
        <path d="M70 135 V 70 L 130 135 V 70" strokeWidth="14" />
        {/* ondes NFC à droite */}
        <path d="M150 70 Q 175 100 150 130" />
        <path d="M165 55 Q 200 100 165 145" />
      </svg>
    </div>
  );
}

function BackLogo() {
  return (
    <div className="absolute inset-0 grid place-items-center px-6">
      <img
        src={logoOfficial.url}
        alt="FlexCard"
        className="max-h-[70%] w-auto object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)]"
      />
    </div>
  );
}

/** Vue recto + verso côte à côte (responsive). */
export function PremiumCardNFCPair({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-2 ${className}`}>
      <div>
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-navy/70">Recto (NFC)</div>
        <PremiumCardNFC side="front" />
      </div>
      <div>
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-navy/70">Verso</div>
        <PremiumCardNFC side="back" />
      </div>
    </div>
  );
}
