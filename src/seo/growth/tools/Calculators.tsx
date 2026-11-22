// Free calculators for trades. Simple, honest maths with the assumptions shown.
import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const n = (s: string) => { const v = parseFloat(s); return Number.isFinite(v) && v > 0 ? v : 0; };
const gbp = (v: number) => `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (v: number, dp = 1) => v.toLocaleString("en-GB", { maximumFractionDigits: dp });

const Field = ({ id, label, value, onChange, suffix, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; suffix?: string; hint?: string }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className={`h-11 ${suffix ? "pr-12" : ""}`} />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>}
    </div>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const Result = ({ rows, note }: { rows: [string, string, boolean?][]; note?: ReactNode }) => (
  <div className="rounded-md border border-border bg-card p-5 sm:p-6 shadow-md" aria-live="polite">
    <dl className="space-y-3">
      {rows.map(([k, v, big]) => (
        <div key={k} className={`flex items-baseline justify-between gap-4 ${big ? "border-t-2 border-primary pt-3" : ""}`}>
          <dt className={big ? "font-heading text-primary" : "text-muted-foreground"}>{k}</dt>
          <dd className={`tabular text-right ${big ? "font-heading text-2xl text-accent" : "font-medium"}`}>{v}</dd>
        </div>
      ))}
    </dl>
    {note && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{note}</p>}
  </div>
);

const Layout = ({ children, result }: { children: ReactNode; result: ReactNode }) => (
  <div className="grid md:grid-cols-[1.1fr_1fr] gap-8 items-start">
    <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    {result}
  </div>
);

export const VatCalculator = () => {
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState("20");
  const [mode, setMode] = useState<"add" | "remove">("add");
  const a = n(amount), r = n(rate) / 100;
  const net = mode === "add" ? a : a / (1 + r);
  const vat = net * r;
  return (
    <div className="space-y-6">
      <div role="radiogroup" aria-label="Add or remove VAT" className="flex flex-wrap gap-2">
        {(["add", "remove"] as const).map((m) => (
          <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
            className={`min-h-[2.75rem] rounded-md border px-4 text-sm font-semibold ${mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
            {m === "add" ? "Add VAT to a price" : "Take VAT off a price"}
          </button>
        ))}
      </div>
      <Layout result={<Result rows={[["Price without VAT", gbp(net)], [`VAT at ${fmt(r * 100)}%`, gbp(vat)], ["Price with VAT", gbp(net + vat), true]]}
        note="Standard rate 20%. Some work qualifies for 5% or 0%: check HMRC's guidance for the job before using a lower rate." />}>
        <Field id="vat-amount" label={mode === "add" ? "Price without VAT" : "Price including VAT"} value={amount} onChange={setAmount} suffix="£" />
        <Field id="vat-rate" label="VAT rate" value={rate} onChange={setRate} suffix="%" />
      </Layout>
    </div>
  );
};

/** Wall area from room size, minus doors and windows. */
const useRoom = () => {
  const [length, setLength] = useState("4");
  const [width, setWidth] = useState("3.5");
  const [height, setHeight] = useState("2.4");
  const [doors, setDoors] = useState("1");
  const [windows, setWindows] = useState("1");
  const walls = Math.max(0, 2 * (n(length) + n(width)) * n(height) - n(doors) * 1.9 - n(windows) * 1.5);
  const ceiling = n(length) * n(width);
  const fields = (
    <>
      <Field id="r-l" label="Room length" value={length} onChange={setLength} suffix="m" />
      <Field id="r-w" label="Room width" value={width} onChange={setWidth} suffix="m" />
      <Field id="r-h" label="Wall height" value={height} onChange={setHeight} suffix="m" />
      <Field id="r-d" label="Doors" value={doors} onChange={setDoors} hint="About 1.9 m² each" />
      <Field id="r-win" label="Windows" value={windows} onChange={setWindows} hint="About 1.5 m² each" />
    </>
  );
  return { walls, ceiling, fields };
};

export const PaintCalculator = () => {
  const { walls, ceiling, fields } = useRoom();
  const [coats, setCoats] = useState("2");
  const [coverage, setCoverage] = useState("12");
  const [withCeiling, setWithCeiling] = useState(false);
  const area = walls + (withCeiling ? ceiling : 0);
  const litres = (area * Math.max(1, n(coats))) / Math.max(1, n(coverage)) * 1.1;
  const tins5 = Math.ceil(litres / 5);
  return (
    <Layout result={<Result rows={[["Area to paint", `${fmt(area)} m²`], ["Coats", fmt(n(coats), 0)], ["5 L tins", String(tins5)], ["Paint needed", `${fmt(litres)} litres`, true]]}
      note="Includes 10% extra. Emulsion typically covers 10 to 13 m² per litre per coat: check the tin. New plaster needs a mist coat first, and strong colour changes may need a third coat." />}>
      {fields}
      <Field id="p-coats" label="Coats" value={coats} onChange={setCoats} />
      <Field id="p-cov" label="Coverage" value={coverage} onChange={setCoverage} suffix="m²/L" />
      <label className="sm:col-span-2 inline-flex min-h-[2.75rem] items-center gap-2 text-sm">
        <input type="checkbox" checked={withCeiling} onChange={(e) => setWithCeiling(e.target.checked)} className="h-4 w-4" /> Include the ceiling
      </label>
    </Layout>
  );
};

export const PlasterCalculator = () => {
  const { walls, ceiling, fields } = useRoom();
  const [withCeiling, setWithCeiling] = useState(false);
  const [perBag, setPerBag] = useState("10");
  const area = walls + (withCeiling ? ceiling : 0);
  const bags = Math.ceil((area / Math.max(1, n(perBag))) * 1.1);
  return (
    <Layout result={<Result rows={[["Area to skim", `${fmt(area)} m²`], ["25 kg bags of finish", String(bags), true]]}
      note="For a 2 mm skim of multi-finish, a 25 kg bag covers roughly 10 m². Includes 10% extra. Bonding or backing coats need far more: check the bag for your thickness." />}>
      {fields}
      <Field id="pl-bag" label="Coverage per 25 kg bag" value={perBag} onChange={setPerBag} suffix="m²" />
      <label className="sm:col-span-2 inline-flex min-h-[2.75rem] items-center gap-2 text-sm">
        <input type="checkbox" checked={withCeiling} onChange={(e) => setWithCeiling(e.target.checked)} className="h-4 w-4" /> Include the ceiling
      </label>
    </Layout>
  );
};

export const TileCalculator = () => {
  const [areaW, setAreaW] = useState("2.4");
  const [areaH, setAreaH] = useState("2");
  const [tileW, setTileW] = useState("300");
  const [tileH, setTileH] = useState("600");
  const [waste, setWaste] = useState("10");
  const [perBox, setPerBox] = useState("6");
  const area = n(areaW) * n(areaH);
  const tileArea = (n(tileW) / 1000) * (n(tileH) / 1000);
  const tiles = tileArea ? Math.ceil((area / tileArea) * (1 + n(waste) / 100)) : 0;
  const boxes = n(perBox) ? Math.ceil(tiles / n(perBox)) : 0;
  return (
    <Layout result={<Result rows={[["Area", `${fmt(area, 2)} m²`], ["Boxes", String(boxes)], ["Tiles needed", String(tiles), true]]}
      note="Add 10% for straight layouts and 15% for diagonal or herringbone, more for lots of cuts. Buy all tiles from the same batch." />}>
      <Field id="t-aw" label="Area width" value={areaW} onChange={setAreaW} suffix="m" />
      <Field id="t-ah" label="Area height or length" value={areaH} onChange={setAreaH} suffix="m" />
      <Field id="t-tw" label="Tile width" value={tileW} onChange={setTileW} suffix="mm" />
      <Field id="t-th" label="Tile height" value={tileH} onChange={setTileH} suffix="mm" />
      <Field id="t-ws" label="Extra for cuts" value={waste} onChange={setWaste} suffix="%" />
      <Field id="t-pb" label="Tiles per box" value={perBox} onChange={setPerBox} />
    </Layout>
  );
};

export const ConcreteCalculator = () => {
  const [l, setL] = useState("3");
  const [w, setW] = useState("2");
  const [d, setD] = useState("100");
  const volume = n(l) * n(w) * (n(d) / 1000);
  const withWaste = volume * 1.1;
  const bags = Math.ceil((withWaste * 2350) / 25);
  return (
    <Layout result={<Result rows={[["Volume", `${fmt(volume, 2)} m³`], ["With 10% extra", `${fmt(withWaste, 2)} m³`], ["25 kg bags of ready-mix", String(bags), true]]}
      note="Bag count assumes about 2,350 kg of concrete per m³. For more than about 1 m³, a ready-mix delivery is usually cheaper than bags. Typical depths: 100 mm for paths and shed bases, 150 mm for driveways." />}>
      <Field id="c-l" label="Length" value={l} onChange={setL} suffix="m" />
      <Field id="c-w" label="Width" value={w} onChange={setW} suffix="m" />
      <Field id="c-d" label="Depth" value={d} onChange={setD} suffix="mm" />
    </Layout>
  );
};
