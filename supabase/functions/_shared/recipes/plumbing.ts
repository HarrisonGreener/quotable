import { type Recipe, mat, lab, num, yes, str, packs } from "./types.ts";

const COPPER_15_3M = (n: number) => mat("15mm copper pipe 3m length", n, "each", 16);

export const PLUMBING: Recipe[] = [
  {
    id: "tap_replace",
    trade: "plumbing",
    title: "Replace taps",
    covers: "Swap existing basin, kitchen or bath taps like-for-like",
    keywords: ["tap", "mixer", "taps"],
    params: [
      { key: "count", label: "Taps", kind: "number", unit: "each", default: 1, min: 1, max: 10, ask: "How many taps?" },
      { key: "type", label: "Tap type", kind: "choice", choices: ["basin", "kitchen", "bath"], default: "basin", ask: "Basin, kitchen or bath tap?" },
      { key: "valves", label: "New isolating valves", kind: "boolean", default: true, ask: "Do the isolating valves need replacing?" },
    ],
    build: (p) => {
      const n = num(p, "count"), t = str(p, "type");
      const tap = t === "kitchen" ? mat("Kitchen sink mono mixer tap", n, "each", 65)
        : t === "bath" ? mat("Bath filler mixer tap pair", n, "each", 70)
        : mat("Basin mono mixer tap", n, "each", 50);
      const m = [tap, mat("PTFE thread seal tape 12m", 1, "roll", 1.5)];
      if (yes(p, "valves")) m.push(mat("15mm isolating valve", 2 * n, "each", 4.5));
      if (t === "bath") m.push(mat("15mm x 1/2in flexible tap connector 300mm", 2 * n, "each", 6));
      return {
        materials: m,
        labour: [
          lab("Remove old tap(s) and fit new", n * (t === "bath" ? 1.75 : 1.25)),
          ...(yes(p, "valves") ? [lab("Fit isolating valves", 0.25 * n)] : []),
        ],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "toilet_replace",
    trade: "plumbing",
    title: "Replace toilet",
    covers: "Remove an old toilet and fit a new close-coupled toilet on existing pipework",
    keywords: ["toilet", "wc", "cistern"],
    params: [
      { key: "count", label: "Toilets", kind: "number", unit: "each", default: 1, min: 1, max: 6, ask: "How many toilets?" },
      { key: "supply_toilet", label: "We supply the toilet", kind: "boolean", default: true, ask: "Are you supplying the toilet, or is the customer?" },
    ],
    build: (p) => {
      const n = num(p, "count");
      const m = [
        mat("WC pan connector straight", n, "each", 9),
        mat("15mm isolating valve", n, "each", 4.5),
        mat("Flexible cistern connector 15mm x 1/2in", n, "each", 6),
        mat("WC pan fixing kit", n, "each", 5),
        mat("Sanitary silicone sealant white", 1, "each", 7),
      ];
      if (yes(p, "supply_toilet")) m.unshift(mat("Close coupled toilet with soft close seat", n, "each", 160));
      return {
        materials: m,
        labour: [lab("Remove old toilet", 0.75 * n), lab("Fit and connect new toilet", 2 * n)],
        overheads: ["Transport", "Waste disposal"],
      };
    },
  },
  {
    id: "radiator_replace",
    trade: "plumbing",
    title: "Replace radiators",
    covers: "Swap existing radiators for new ones on the same pipework, including TRVs",
    keywords: ["radiator", "radiators", "rad"],
    params: [
      { key: "count", label: "Radiators", kind: "number", unit: "each", default: 1, min: 1, max: 20, ask: "How many radiators?", important: true },
      { key: "size", label: "Size", kind: "choice", choices: ["small", "medium", "large"], default: "medium", ask: "Roughly what size (small ~600×600, medium ~600×1000, large ~600×1400)?" },
      { key: "new_position", label: "New position (new pipework)", kind: "boolean", default: false, ask: "Is it in the same place, or does pipework need moving?" },
    ],
    build: (p) => {
      const n = num(p, "count"), s = str(p, "size");
      const rad = s === "small" ? mat("Double panel convector radiator 600 x 600mm", n, "each", 50)
        : s === "large" ? mat("Double panel convector radiator 600 x 1400mm", n, "each", 105)
        : mat("Double panel convector radiator 600 x 1000mm", n, "each", 75);
      const m = [
        rad,
        mat("Thermostatic radiator valve pack 15mm", n, "each", 22),
        mat("Central heating inhibitor 500ml", 1, "each", 16),
        mat("PTFE thread seal tape 12m", 1, "roll", 1.5),
      ];
      const labour = [
        lab("Isolate or drain down, then refill and bleed", n > 2 ? 1.5 : 0.75),
        lab("Remove old and hang new radiators", 1.25 * n),
      ];
      if (yes(p, "new_position")) {
        m.push(COPPER_15_3M(2 * n), mat("15mm copper fittings assortment", n, "pack", 12), mat("15mm pipe clips pack of 10", n, "pack", 4));
        labour.push(lab("Reroute pipework", 2.5 * n));
      }
      return { materials: m, labour, overheads: ["Transport"] };
    },
  },
  {
    id: "radiator_add",
    trade: "plumbing",
    title: "Add new radiator",
    covers: "Fit an extra radiator where there wasn't one, with new pipe runs off the heating circuit",
    keywords: ["new radiator", "extra radiator", "additional radiator", "add a radiator"],
    params: [
      { key: "count", label: "Radiators", kind: "number", unit: "each", default: 1, min: 1, max: 10, ask: "How many new radiators?" },
      { key: "pipe_m", label: "Pipe run per radiator", kind: "number", unit: "m", default: 6, min: 1, max: 40, ask: "Roughly how far is each from the nearest heating pipe (metres)?", important: true },
      { key: "size", label: "Size", kind: "choice", choices: ["small", "medium", "large"], default: "medium", ask: "Roughly what size?" },
    ],
    build: (p) => {
      const n = num(p, "count"), s = str(p, "size"), pipe = num(p, "pipe_m");
      const price = s === "small" ? 50 : s === "large" ? 105 : 75;
      const dims = s === "small" ? "600 x 600mm" : s === "large" ? "600 x 1400mm" : "600 x 1000mm";
      return {
        materials: [
          mat(`Double panel convector radiator ${dims}`, n, "each", price),
          mat("Thermostatic radiator valve pack 15mm", n, "each", 22),
          COPPER_15_3M(packs(2 * pipe * n, 3)),
          mat("15mm copper fittings assortment", n, "pack", 12),
          mat("15mm pipe clips pack of 10", packs(2 * pipe * n, 10), "pack", 4),
          mat("Central heating inhibitor 500ml", 1, "each", 16),
        ],
        labour: [
          lab("Drain down and refill heating system", 1.5),
          lab("Lift floorboards, run and connect pipework", 1 + 0.35 * pipe * n),
          lab("Hang and connect radiators", 1.25 * n),
        ],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "leak_repair",
    trade: "plumbing",
    title: "Leak or pipe repair",
    covers: "Find and fix a leaking pipe, joint or valve",
    keywords: ["leak", "leaking", "burst", "drip", "dripping"],
    params: [
      { key: "count", label: "Leaks", kind: "number", unit: "each", default: 1, min: 1, max: 6, ask: "How many leaks?" },
      { key: "access", label: "Hard to reach (under floor / boxed in)", kind: "boolean", default: false, ask: "Is the pipe easy to get to, or under floors / boxed in?" },
    ],
    build: (p) => {
      const n = num(p, "count");
      return {
        materials: [
          mat("15mm push-fit coupler", 2 * n, "each", 4),
          COPPER_15_3M(1),
          mat("PTFE thread seal tape 12m", 1, "roll", 1.5),
        ],
        labour: [lab("Trace and repair leak", n * (yes(p, "access") ? 2 : 1))],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "outside_tap",
    trade: "plumbing",
    title: "Fit outside tap",
    covers: "New outside tap off the cold main with isolator",
    keywords: ["outside tap", "garden tap", "outdoor tap"],
    params: [
      { key: "count", label: "Outside taps", kind: "number", unit: "each", default: 1, min: 1, max: 4, ask: "How many outside taps?" },
    ],
    build: (p) => {
      const n = num(p, "count");
      return {
        materials: [
          mat("Outside tap kit with wall plate and non-return valve", n, "each", 28),
          COPPER_15_3M(n),
          mat("15mm isolating valve", n, "each", 4.5),
        ],
        labour: [lab("Core through wall, tee into main and fit outside tap", 2 * n)],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "shower_mixer",
    trade: "plumbing",
    title: "Fit mixer shower",
    covers: "Fit a thermostatic bar mixer shower on hot and cold feeds (not an electric shower)",
    keywords: ["mixer shower", "bar shower", "thermostatic shower"],
    params: [
      { key: "new_feeds", label: "Needs new hot & cold feeds", kind: "boolean", default: false, ask: "Is it replacing an existing mixer, or does it need new pipework?" },
    ],
    build: (p) => ({
      materials: [
        mat("Thermostatic bar mixer shower with riser rail", 1, "each", 130),
        ...(yes(p, "new_feeds") ? [COPPER_15_3M(3), mat("15mm copper fittings assortment", 1, "pack", 12)] : []),
        mat("Sanitary silicone sealant white", 1, "each", 7),
      ],
      labour: [
        lab("Fit shower valve and riser", 2.5),
        ...(yes(p, "new_feeds") ? [lab("Run new hot and cold feeds", 3)] : []),
      ],
      overheads: ["Transport"],
    }),
  },
  {
    id: "boiler_service",
    trade: "plumbing",
    title: "Boiler service",
    covers: "Annual gas boiler service with safety checks (Gas Safe engineer)",
    keywords: ["boiler service", "service the boiler", "annual service"],
    params: [],
    build: () => ({
      materials: [],
      labour: [lab("Service boiler, flue gas analysis and safety checks", 1)],
      overheads: ["Transport"],
    }),
  },
  {
    id: "basin_replace",
    trade: "plumbing",
    title: "Replace basin",
    covers: "Swap a bathroom basin and pedestal, with new tap and waste",
    keywords: ["basin", "sink", "pedestal"],
    params: [
      { key: "count", label: "Basins", kind: "number", unit: "each", default: 1, min: 1, max: 4, ask: "How many basins?" },
      { key: "supply_basin", label: "We supply the basin", kind: "boolean", default: true, ask: "Are you supplying the basin and tap?" },
    ],
    build: (p) => {
      const n = num(p, "count");
      const m = [
        mat("Basin waste slotted click clack", n, "each", 12),
        mat("32mm bottle trap", n, "each", 7),
        mat("15mm isolating valve", 2 * n, "each", 4.5),
        mat("Sanitary silicone sealant white", 1, "each", 7),
      ];
      if (yes(p, "supply_basin")) m.unshift(mat("Basin and full pedestal 550mm", n, "each", 85), mat("Basin mono mixer tap", n, "each", 50));
      return {
        materials: m,
        labour: [lab("Remove old basin", 0.5 * n), lab("Fit basin, tap and waste", 2 * n)],
        overheads: ["Transport", "Waste disposal"],
      };
    },
  },
];

