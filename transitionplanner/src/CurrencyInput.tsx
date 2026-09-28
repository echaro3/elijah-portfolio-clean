import * as React from "react";

const formatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string | number;
  onValueChange: (value: string) => void;
};

export default function CurrencyInput({ value, onValueChange, ...props }: Props) {
  const [draft, setDraft] = React.useState<string | null>(null);
  return <span className="currency-input">
    <span aria-hidden="true">$</span>
    <input {...props} type="text" inputMode="decimal" autoComplete="off" placeholder="0.00"
      value={draft ?? (value === "" ? "" : formatter.format(Number(value)))}
      onFocus={() => setDraft(String(value))} onBlur={() => setDraft(null)}
      onChange={event => {
        const next = event.target.value.replace(/[$,\s]/g, "");
        if (!/^\d*(\.\d{0,2})?$/.test(next)) return;
        const normalized = next === "." ? "0." : next;
        setDraft(normalized);
        onValueChange(normalized);
      }} />
  </span>;
}
