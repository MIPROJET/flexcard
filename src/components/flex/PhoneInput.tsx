import { useMemo } from "react";

export const WEST_AFRICA_DIAL_CODES = [
  { iso: "CI", dial: "+225", name: "Côte d'Ivoire" },
  { iso: "SN", dial: "+221", name: "Sénégal" },
  { iso: "ML", dial: "+223", name: "Mali" },
  { iso: "BF", dial: "+226", name: "Burkina Faso" },
  { iso: "GH", dial: "+233", name: "Ghana" },
  { iso: "TG", dial: "+228", name: "Togo" },
  { iso: "BJ", dial: "+229", name: "Bénin" },
  { iso: "NG", dial: "+234", name: "Nigéria" },
  { iso: "NE", dial: "+227", name: "Niger" },
  { iso: "GN", dial: "+224", name: "Guinée" },
  { iso: "LR", dial: "+231", name: "Libéria" },
  { iso: "SL", dial: "+232", name: "Sierra Leone" },
  { iso: "MR", dial: "+222", name: "Mauritanie" },
  { iso: "GW", dial: "+245", name: "Guinée-Bissau" },
  { iso: "CV", dial: "+238", name: "Cap-Vert" },
  { iso: "GM", dial: "+220", name: "Gambie" },
];

type Props = {
  value: string;
  onChange: (full: string) => void;
  placeholder?: string;
  className?: string;
  defaultDial?: string;
  inputClassName?: string;
  selectClassName?: string;
};

export function splitDial(value: string, defaultDial = "+225") {
  const v = (value ?? "").trim();
  for (const c of WEST_AFRICA_DIAL_CODES) {
    if (v.startsWith(c.dial)) {
      return { dial: c.dial, local: v.slice(c.dial.length).trimStart() };
    }
  }
  return { dial: defaultDial, local: v };
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "07 12 34 56 78",
  className = "",
  defaultDial = "+225",
  inputClassName = "",
  selectClassName = "",
}: Props) {
  const { dial, local } = useMemo(() => splitDial(value, defaultDial), [value, defaultDial]);

  const update = (d: string, l: string) => {
    const cleaned = l.replace(/^\++/, "").replace(/\s+/g, " ").trimStart();
    onChange(cleaned ? `${d} ${cleaned}` : "");
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        value={dial}
        onChange={(e) => update(e.target.value, local)}
        className={`shrink-0 rounded-xl border border-input bg-background px-2 py-2.5 text-sm outline-none focus:ring-brand ${selectClassName}`}
        aria-label="Indicatif pays"
      >
        {WEST_AFRICA_DIAL_CODES.map((c) => (
          <option key={c.iso} value={c.dial}>
            {c.iso} {c.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        value={local}
        onChange={(e) => update(dial, e.target.value)}
        placeholder={placeholder}
        className={`min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand ${inputClassName}`}
      />
    </div>
  );
}
