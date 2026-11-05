import { type Recipe, mat, lab, num, yes, str, packs } from "./types.ts";

const TE25 = (m: number) => mat("2.5mm twin and earth cable", Math.ceil(m), "m", 1.3);
const TE15 = (m: number) => mat("1.5mm twin and earth cable", Math.ceil(m), "m", 0.95);
const TE1 = (m: number) => mat("1.0mm twin and earth cable", Math.ceil(m), "m", 0.8);

export const ELECTRICAL: Recipe[] = [
  {
    id: "sockets_add",
    trade: "electrical",
    title: "Add sockets",
    covers: "New double sockets, either spurred/extended from an existing ring or on a new dedicated circuit",
    keywords: ["socket", "sockets", "plug socket", "power point"],
    params: [
      { key: "count", label: "New double sockets", kind: "number", unit: "each", default: 1, min: 1, max: 30, ask: "How many new sockets?", important: true },
      { key: "new_circuit", label: "New circuit from consumer unit", kind: "boolean", default: false, ask: "Can they come off an existing circuit, or is a new circuit needed?" },
      { key: "flush", label: "Flush (chased in)", kind: "boolean", default: true, ask: "Flush (chased into the wall) or surface-mounted?" },
      { key: "finish", label: "Finish", kind: "choice", choices: ["white", "metal"], default: "white", ask: "White plastic or a metal finish?" },
    ],
    build: (p) => {
      const n = num(p, "count"), nc = yes(p, "new_circuit"), flush = yes(p, "flush");
      const socket = str(p, "finish") === "metal"
        ? mat("Double switched socket brushed chrome", n, "each", 12)
        : mat("Double switched socket white", n, "each", 4.5);
      const m = [
        socket,
        flush ? mat("Metal back box 35mm double", n, "each", 1.5) : mat("Surface pattress box double 32mm", n, "each", 2.5),
        TE25(nc ? 15 + 4 * n : 5 * n),
        mat("Earth sleeving green/yellow 6mm", 1, "pack", 3),
      ];
      if (flush) m.push(mat("One coat filler 1kg", 1, "each", 8));
      if (!flush) m.push(mat("Mini trunking 16 x 16mm 3m", packs(n * 2, 3), "each", 4));
      if (nc) m.push(mat("RCBO 32A 30mA type A", 1, "each", 28));
      return {
        materials: m,
        labour: [
          lab(flush ? "Chase walls, fit back boxes and run cable" : "Run cable in trunking and fit boxes", n * (flush ? 1.25 : 0.75)),
          lab("Connect sockets", 0.25 * n),
          ...(nc ? [lab("Install new circuit at consumer unit", 1.5)] : []),
          lab("Test and certify", nc ? 1 : 0.5),
        ],
        overheads: ["Transport", ...(nc ? ["Building control notification"] : [])],
      };
    },
  },
  {
    id: "accessories_replace",
    trade: "electrical",
    title: "Replace sockets & switches",
    covers: "Swap existing socket and switch faceplates like-for-like (no new wiring)",
    keywords: ["replace sockets", "change sockets", "faceplates", "replace switches", "chrome sockets"],
    params: [
      { key: "sockets", label: "Sockets", kind: "number", unit: "each", default: 4, min: 0, max: 60, ask: "How many sockets?" },
      { key: "switches", label: "Light switches", kind: "number", unit: "each", default: 0, min: 0, max: 40, ask: "How many light switches?" },
      { key: "finish", label: "Finish", kind: "choice", choices: ["white", "metal"], default: "white", ask: "White or metal finish?" },
    ],
    build: (p) => {
      const s = num(p, "sockets"), w = num(p, "switches"), metal = str(p, "finish") === "metal";
      const m = [];
      if (s) m.push(metal ? mat("Double switched socket brushed chrome", s, "each", 12) : mat("Double switched socket white", s, "each", 4.5));
      if (w) m.push(metal ? mat("1 gang 2 way light switch brushed chrome", w, "each", 8) : mat("1 gang 2 way light switch white", w, "each", 2.5));
      return {
        materials: m,
        labour: [lab("Replace accessories", 0.3 * (s + w)), lab("Test circuits", 0.5)],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "lights",
    trade: "electrical",
    title: "Fit lights",
    covers: "Fit or replace ceiling pendants or LED downlights",
    keywords: ["downlight", "downlights", "spotlights", "light fitting", "pendant", "ceiling light", "lights"],
    params: [
      { key: "count", label: "Light fittings", kind: "number", unit: "each", default: 1, min: 1, max: 40, ask: "How many lights?", important: true },
      { key: "type", label: "Type", kind: "choice", choices: ["pendant", "downlight"], default: "pendant", ask: "Ceiling pendants or downlights/spotlights?" },
      { key: "new_wiring", label: "New positions (new wiring)", kind: "boolean", default: false, ask: "Replacing existing lights, or new positions?" },
    ],
    build: (p) => {
      const n = num(p, "count"), down = str(p, "type") === "downlight", nw = yes(p, "new_wiring");
      const m = [down
        ? mat("Fire rated LED downlight integrated", n, "each", 11)
        : mat("Ceiling pendant light fitting", n, "each", 18)];
      if (nw || down) m.push(TE1(nw ? 3 * n + 5 : n), mat("Junction box 4 terminal 20A", Math.ceil(n / 3), "each", 3.5));
      return {
        materials: m,
        labour: [
          lab(down ? "Cut holes and fit downlights" : "Fit light fittings", n * (down ? 0.6 : 0.5)),
          ...(nw ? [lab("Run new lighting cable", 0.5 * n + 1)] : []),
          lab("Test and certify", 0.5),
        ],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "consumer_unit",
    trade: "electrical",
    title: "Consumer unit replacement",
    covers: "Replace a fuse board with a new 18th-edition metal consumer unit (RCBOs, surge protection)",
    keywords: ["consumer unit", "fuse box", "fuse board", "fuseboard", "distribution board"],
    params: [
      { key: "circuits", label: "Circuits", kind: "number", unit: "each", default: 8, min: 2, max: 24, ask: "How many circuits (roughly the number of fuses/breakers now)?", important: true },
    ],
    build: (p) => {
      const c = num(p, "circuits");
      return {
        materials: [
          mat(`Metal consumer unit ${c + 2 > 14 ? 18 : c + 2 > 10 ? 14 : 10} way with main switch`, 1, "each", 70),
          mat("RCBO 30mA type A", c, "each", 20),
          mat("Surge protection device type 2", 1, "each", 42),
          mat("25mm meter tails 2m pair", 1, "pack", 18),
          mat("16mm earth cable green/yellow", 3, "m", 3),
          mat("10mm earth cable green/yellow", 5, "m", 2),
        ],
        labour: [
          lab("Isolate, remove old board, fit and wire new consumer unit", 3 + 0.15 * c),
          lab("Main bonding check and upgrade", 0.5),
          lab("Test all circuits and certify", 0.75 + 0.15 * c),
        ],
        overheads: ["Transport", "Building control notification"],
      };
    },
  },
  {
    id: "eicr",
    trade: "electrical",
    title: "Electrical safety report (EICR)",
    covers: "Periodic inspection and testing of a home's installation with report",
    keywords: ["eicr", "periodic inspection", "electrical safety", "landlord certificate", "electrical report"],
    params: [
      { key: "bedrooms", label: "Bedrooms", kind: "number", unit: "each", default: 2, min: 0, max: 10, ask: "How many bedrooms?" },
      { key: "circuits", label: "Circuits", kind: "number", unit: "each", default: 8, min: 1, max: 40, ask: "How many circuits?" },
    ],
    build: (p) => ({
      materials: [],
      labour: [lab("Inspect, test and write report", 2 + 0.25 * num(p, "circuits") + 0.25 * num(p, "bedrooms"))],
      overheads: ["Transport"],
    }),
  },
  {
    id: "electric_shower",
    trade: "electrical",
    title: "Electric shower",
    covers: "Fit an electric shower, either replacing like-for-like or with a new dedicated circuit",
    keywords: ["electric shower"],
    params: [
      { key: "new_circuit", label: "New circuit", kind: "boolean", default: false, ask: "Replacing an existing electric shower on the same cable, or a new circuit?" },
      { key: "cable_m", label: "Cable run", kind: "number", unit: "m", default: 15, min: 3, max: 40, ask: "Roughly how far from the consumer unit (metres)?" },
    ],
    build: (p) => {
      const nc = yes(p, "new_circuit"), run = num(p, "cable_m");
      return {
        materials: [
          mat("Electric shower 9.5kW", 1, "each", 165),
          ...(nc ? [
            mat("10mm twin and earth cable", Math.ceil(run), "m", 6.5),
            mat("RCBO 45A 30mA type A", 1, "each", 30),
            mat("45A ceiling pull cord switch", 1, "each", 14),
          ] : []),
          mat("Sanitary silicone sealant white", 1, "each", 7),
        ],
        labour: [
          lab("Remove old and fit new shower", 2),
          ...(nc ? [lab("Run new shower circuit", 1.5 + 0.15 * run)] : []),
          lab("Test and certify", nc ? 1 : 0.5),
        ],
        overheads: ["Transport", ...(nc ? ["Building control notification"] : [])],
      };
    },
  },
  {
    id: "extractor_fan",
    trade: "electrical",
    title: "Extractor fan",
    covers: "Fit a bathroom or kitchen extractor fan with timer, ducted through a wall or ceiling",
    keywords: ["extractor", "extractor fan", "bathroom fan"],
    params: [
      { key: "count", label: "Fans", kind: "number", unit: "each", default: 1, min: 1, max: 6, ask: "How many fans?" },
      { key: "new_hole", label: "Needs a new hole cored", kind: "boolean", default: true, ask: "Is there an existing vent hole, or does one need cutting?" },
    ],
    build: (p) => {
      const n = num(p, "count");
      return {
        materials: [
          mat("100mm extractor fan with timer", n, "each", 32),
          mat("100mm wall duct kit with external grille", n, "each", 15),
          mat("3 pole fan isolator switch", n, "each", 9),
          mat("1.5mm 3 core and earth cable", 5 * n, "m", 1.5),
          TE15(4 * n),
        ],
        labour: [lab("Fit and wire extractor fan", 1.5 * n), ...(yes(p, "new_hole") ? [lab("Core drill wall for duct", n)] : []), lab("Test", 0.25)],
        overheads: ["Transport", ...(yes(p, "new_hole") ? ["Equipment hire (core drill)"] : [])],
      };
    },
  },
  {
    id: "smoke_alarms",
    trade: "electrical",
    title: "Mains smoke & heat alarms",
    covers: "Fit mains-powered interlinked smoke/heat alarms",
    keywords: ["smoke alarm", "smoke alarms", "heat alarm", "smoke detector"],
    params: [
      { key: "count", label: "Alarms", kind: "number", unit: "each", default: 3, min: 1, max: 15, ask: "How many alarms?" },
    ],
    build: (p) => {
      const n = num(p, "count");
      return {
        materials: [mat("Mains interlinked smoke alarm with battery backup", n, "each", 26), mat("1.5mm 3 core and earth cable", 5 * n, "m", 1.5)],
        labour: [lab("Fit and interlink alarms", n + 1), lab("Test and certify", 0.5)],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "outdoor_socket",
    trade: "electrical",
    title: "Outdoor socket",
    covers: "Weatherproof outdoor double socket on the outside wall",
    keywords: ["outdoor socket", "outside socket", "garden socket", "external socket"],
    params: [{ key: "count", label: "Outdoor sockets", kind: "number", unit: "each", default: 1, min: 1, max: 4, ask: "How many outdoor sockets?" }],
    build: (p) => {
      const n = num(p, "count");
      return {
        materials: [mat("Outdoor double socket IP66", n, "each", 22), TE25(8 * n), mat("20mm conduit 2m", n, "each", 4)],
        labour: [lab("Drill through wall, run cable and fit socket", 2.5 * n), lab("Test and certify", 0.5)],
        overheads: ["Transport"],
      };
    },
  },
];
