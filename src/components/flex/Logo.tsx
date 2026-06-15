import logoAsset from "@/assets/flexcard-logo.png.asset.json";

export function Logo({ className = "h-8", showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <img
      src={logoAsset.url}
      alt={showWord ? "FlexCard — Une carte. Mille connexions." : ""}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <img
      src={logoAsset.url}
      alt=""
      style={{ width: size, height: size, objectFit: "contain" }}
      aria-hidden
    />
  );
}
