// bun test supabase/tests/quote-accuracy
import { describe, expect, test } from "bun:test";
(globalThis as any).Deno ??= { env: { get: () => undefined } };
const L = await import("../../functions/_shared/live-price.ts");
const log = console.log; console.log = () => {};
const { isCompatibleProduct } = await import("../../functions/_shared/quote-engine.ts");
console.log = log;

// Real product names seen on supplier sites (Nov 2026)
describe("pack sizes become the quote's unit", () => {
  const cases: [string, string, string, number, number | null][] = [
    ["2.5mm twin and earth cable", "m", "Twin &amp; Earth Cable - 2.5mm2 x 7.5m", 15, 2],
    ["2.5mm twin and earth cable", "m", "4TRADE 6242YH 2.5mm Twin & Earth Cable Grey 50m", 42.09, 0.84],
    ["Double switched socket white", "each", "MK Logic Plus 2 Gang 13A Double Switched Sockets White 5 Pack", 24.8, 4.96],
    ["15mm copper pipe", "m", "Wednesbury Copper Pipe - 15mm x 3m", 16.35, 5.45],
    ["15mm copper pipe 3m length", "each", "Wednesbury Copper Pipe - 15mm x 3m", 16.35, 16.35],
    ["15mm pipe clips pack of 10", "pack", "Primaflow Copper Pipe Clips - 15mm - Pack of 6", 2, 3.33],
    ["Trade vinyl matt emulsion 10L", "tub", "Dulux Trade Vinyl Matt 5L White", 30, 60],
    ["Laminate flooring", "m²", "High Gloss Oak Uptown Grey Oak 8mm Laminate Flooring - 2.2m2", 39.6, 18],
    ["Plasterboard 12.5mm 2400 x 1200mm", "sheet", "Gyproc WallBoard 12.5mm 2400 x 1200mm", 11, 11],
    ["Multi-finish plaster 25kg", "bag", "British Gypsum Thistle Multi Finish 25kg", 12, 12],
    ["Skirting board", "m", "MDF Skirting Board", 15, null], // no length on the page → can't price per metre
  ];
  for (const [name, unit, product, price, want] of cases) {
    test(`${name} (${unit}) ← ${product}`, () => {
      const got = L.convertPrice({ name, unit }, { name: product, price });
      if (want == null) expect(got).toBeNull();
      else expect(got?.unitPrice).toBeCloseTo(want, 1);
    });
  }
});

describe("choosing the offer", () => {
  test("wrong product type is rejected even when cheap", () => {
    const hit = L.chooseOffer({ name: "1.0mm twin and earth cable", unit: "m" }, [
      { name: "IDEAL Industries Flat Cable Stripper for Twin & Earth", price: 46, supplier: "Wickes" },
      { name: "4TRADE 6242Y 1.0mm Twin & Earth Cable Grey 10m", price: 9.64, supplier: "Travis Perkins" },
    ], isCompatibleProduct);
    expect(hit?.supplier).toBe("Travis Perkins");
    expect(hit?.unitPrice).toBeCloseTo(0.96, 2);
  });

  test("wrong size is rejected", () => {
    const hit = L.chooseOffer({ name: "Double panel convector radiator 600 x 600mm", unit: "each" }, [
      { name: "Stelrad Softline Deco Double Panel Double Convector Radiator 600mm x 1400mm", price: 309, supplier: "Travis Perkins" },
    ], isCompatibleProduct);
    expect(hit).toBeNull();
  });

  test("among equally good matches the cheapest per unit wins", () => {
    const hit = L.chooseOffer({ name: "2.5mm twin and earth cable", unit: "m" }, [
      { name: "Twin & Earth Cable - 2.5mm2 x 7.5m", price: 15, supplier: "Wickes" },
      { name: "Time 2.5mm Twin & Earth Cable 50m", price: 42, supplier: "Toolstation" },
    ], isCompatibleProduct);
    expect(hit?.supplier).toBe("Toolstation");
  });

  test("misses found in the live run now match", () => {
    const c = (w: string, h: string) => isCompatibleProduct(w, h);
    expect(c("MDF torus skirting board 119mm", "WH MDF Torus Skirting 4400mm x 119mm x 18mm")).toBe(true);
    expect(c("Thin coat angle bead 2.4m", "Wickes Thin Coat Anglebead - 2.4m")).toBe(true);
    expect(c("RCBO 32A 30mA", "BG AFDD 32A B Curve RCBO Type A 30mA")).toBe(false);
    expect(c("RCBO 32A", "BG Fortress Compact RCBO 30mA Type A 32A B curve")).toBe(true);
    expect(c("Internal door 1981 x 762mm", "Internal Moulded Kensington Door 1981 mm x 762 mm x 35 mm")).toBe(true);
    expect(L.convertPrice({ name: "MDF torus skirting board 119mm", unit: "m" }, { name: "WH MDF Torus Skirting 4400mm x 119mm x 18mm", price: 31.87 })?.unitPrice).toBeCloseTo(7.24, 1);
    expect(L.convertPrice({ name: "Butt hinges 3in", unit: "pair" }, { name: "4Trade Butt Hinges Zinc Plated 75mm Pack of 2", price: 1.93 })?.unitPrice).toBeCloseTo(1.93, 2);
    const sleeve = L.chooseOffer({ name: "Green yellow earth sleeving", unit: "pack" }, [{ name: "Deta Earth Sleeving - 2mm x 25m", price: 1.85, supplier: "Wickes" }], isCompatibleProduct);
    expect(sleeve).not.toBeNull();
  });

  test("live evaluation round 1: right products now match, wrong ones don't", () => {
    const c = (w: string, h: string) => isCompatibleProduct(w, h);
    // should match
    expect(c("CLS timber 38 x 89mm x 2.4m", "38mm x 89mm x 2.4m ECC CLS Profile Timber")).toBe(true);
    expect(c("12.5mm plasterboard 2400 x 1200", "Knauf Standard Plasterboard Wallboard Tapered Edge 2400mm x 1200mm x 12.5mm")).toBe(true);
    expect(c("Type 2 surge protection device", "Axiom Type 2 Surge Protection Device SP+N (SPD) 40kA")).toBe(true);
    expect(c("C24 treated joists 47 x 150mm 4.8m", "47mm x 150mm x 4.8m Regularised Treated Sawn Timber C24")).toBe(true);
    expect(c("Wall tiles 300 x 600mm", "Sutton White Glazed Porcelain Wall and Floor Tile 300 x 600mm Pack of 6")).toBe(true);
    expect(c("13A double switched socket outlet", "MK Logic Plus 13A Double Switched Socket White")).toBe(true);
    expect(c("Concrete fence post 2.4m slotted", "8ft Concrete Fence Post Slotted Intermediate")).toBe(true);
    expect(c("Weed control membrane", "4TRADE Weed Control Landscaping Fabric 1m x 20m")).toBe(true);
    // should not
    expect(c("Ceiling paint white 5L", "IKOpro Black Bitumen Paint - 5L")).toBe(false);
    expect(c("Thistle Multi-Finish 25kg", "British Gypsum Thistlepro Fastset Finish 25kg")).toBe(false);
    expect(c("Bath taps pair chrome", "Bathrooms From TP Aura Basin Taps Chrome Pair")).toBe(false);
    expect(c("13A double switched socket outlet", "BG Nexus 13A Double Switched Socket with USB A & C, 12W")).toBe(false);
    expect(c("13A double switched socket outlet", "BG Decorative Weatherproof Double Switched Power Socket - 13A")).toBe(false);
    expect(c("Concrete fence post 2.4m slotted", "9ft Concrete Fence Post Slotted Corner")).toBe(false);
    expect(c("1.0mm twin and earth cable", "IDEAL Industries 45-235 Flat Cable Stripper for Twin & Earth")).toBe(false);
    expect(L.convertPrice({ name: "Wall tiles 300 x 600mm", unit: "m²" }, { name: "Sutton Tile 300 x 600mm Pack of 6", price: 38.28 })?.unitPrice).toBeCloseTo(35.44, 1);
  });

  test("live evaluation round 2", () => {
    const T: [string, string, boolean][] = [
      ["No More Nails", "UniBond 310ml No More Nails Cartridge", true],
      ["Close coupled toilet", "Toilet To Go Close Coupled Dual Flush", true],
      ["Fire rated LED downlight", "Integral LED Evofire IP65 Fire Rated Downlight White with Insulation Guard", true],
      ["10 way metal consumer unit", "bg metal 100a consumer unit 6 type a rcbos 10 way", true],
      ["35mm 2-gang metal back box", "4Trade 2 Gang 35mm Metal Back Box", true],
      ["16mm meter tails", "16mm 6181Y Meter Tail Cable Brown", true],
      ["Thistle Multi-Finish 25kg", "British Gypsum Thistle Multi Finish Plaster - 25kg", true],
      ["Double switched socket brushed chrome", "BG Nexus Double Switched Socket Brushed Chrome 13A", true],
      ["Internal door 1981 x 762mm", "Internal Moulded Kensington Door 1981 mm x 762 mm x 35 mm", true],
      ["Self levelling compound 20kg", "Stabila LAX 50 Self Levelling Laser Level", false],
      ["Wallpaper", "Wallpaper Seam Roller", false],
      ["35mm 2-gang metal back box", "BG Electrical HGS03 1 Gang 35mm Metal Flush Back Box", false],
      // round 3–6
      ["Wallpaper", "Wallpaper Hanging Scissors - 11in", false],
      ["Plasterboard 12.5mm 2.4m x 1.2m", "Knauf Moisture Plasterboard Square Edge 12.5mm x 2400mm x 1200mm", false],
      ["Laminate underlay 3mm", "Barrier 3mm Laminate & Wood Flooring Underlay with Built-In Moisture Protection - 15m2", true],
      ["10 way metal consumer unit", "bg metal 100a consumer unit 6 type a rcbos", true],
      ["Self levelling compound 20kg", "Setcrete Universal Floor Levelling Compound - 20kg", true],
      ["TRV and lockshield valve set 15mm", "Towelrads Lincoln Dual Fuel Corner TRV & Lockshield Valve - White", false],
    ];
    for (const [w, h, ok] of T) expect([w, h, isCompatibleProduct(w, h)]).toEqual([w, h, ok]);
  });

  test("sizes in metres and millimetres compare correctly", () => {
    expect(L.sameDimensions("Plasterboard 12.5mm 2.4m x 1.2m", "Gyproc Wallboard 2400mm x 1200mm x 12.5mm")).toBe(true);
    expect(L.convertPrice({ name: "Scotia beading", unit: "m" }, { name: "QA Scotia White Beading", price: 1.61 })?.unitPrice).toBeCloseTo(0.67, 2);
  });

  test("Travis Perkins prices are ex VAT and get VAT added", () => {
    expect(L.retailPrice("Travis Perkins", 29.55)).toBeCloseTo(35.46, 2);
    expect(L.retailPrice("Wickes", 32.8)).toBe(32.8);
    expect(L.retailPrice("Toolstation", 6.65)).toBe(6.65);
  });

  test("search terms are plain words", () => {
    expect(L.searchTerms("2.5mm twin and earth cable")).toEqual(["twin", "earth", "cable"]);
    expect(L.searchTerms("16mm meter tails")).toEqual(["meter", "tail"]);
    expect(L.searchTerms("Internal door 1981 x 762mm")).toEqual(["internal", "door", "1981", "762"]);
  });
});

describe("AI evaluation round 1 fixes", () => {
  test("matching and pricing", () => {
    expect(isCompatibleProduct("Double switched socket white molded", "MK Rapid Fix Double Switched Socket White")).toBe(true);
    expect(isCompatibleProduct("Flush mounting box 35mm 2 gang", "4Trade 2 Gang 35mm Metal Back Box")).toBe(true);
    expect(isCompatibleProduct("Door closer CE marked", "Briton Door Closer Universal Silver")).toBe(true);
    expect(isCompatibleProduct("Trade gloss or satinwood paint 750ml", "Wickes Exterior Satinwood Paint - Black - 750ml")).toBe(false);
    expect(L.convertPrice({ name: "15mm angled radiator valves pair", unit: "pair" }, { name: "K-Rad Angled Radiator Valve & Lockshield - 15mm", price: 40 })?.unitPrice).toBe(40);
  });
});

describe("AI evaluation round 2 fixes", () => {
  test("context words", () => {
    expect(isCompatibleProduct("Earth clamp for pipework", "Earth Clamp 12-32mm ECL14 Interior")).toBe(true);
    expect(isCompatibleProduct("Radiator inhibitor 500ml", "Pro PT10 Heating System Inhibitor 500ml")).toBe(true);
    expect(isCompatibleProduct("Type 22 radiator 600 x 800mm", "Wickes Bathroom Mirror 600 x 800mm")).toBe(false);
  });
});
