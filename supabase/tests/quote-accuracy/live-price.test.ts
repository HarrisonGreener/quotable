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

  test("search terms are plain words", () => {
    expect(L.searchTerms("2.5mm twin and earth cable")).toEqual(["twin", "earth", "cable"]);
    expect(L.searchTerms("Internal door 1981 x 762mm")).toEqual(["internal", "door", "1981", "762"]);
  });
});
