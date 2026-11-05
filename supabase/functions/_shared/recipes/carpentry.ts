import { type Recipe, mat, lab, num, yes, str, packs, ceil } from "./types.ts";

export const CARPENTRY: Recipe[] = [
  {
    id: "internal_doors",
    trade: "carpentry",
    title: "Hang internal doors",
    covers: "Hang new internal doors in existing frames, with hinges, latches and handles",
    keywords: ["door", "doors", "hang door", "internal door", "fire door"],
    params: [
      { key: "count", label: "Doors", kind: "number", unit: "each", default: 1, min: 1, max: 20, ask: "How many doors?", important: true },
      { key: "type", label: "Door", kind: "choice", choices: ["standard", "oak", "fire"], default: "standard", ask: "Standard (moulded/white), solid oak, or FD30 fire doors?" },
      { key: "supply_doors", label: "We supply the doors", kind: "boolean", default: true, ask: "Are you supplying the doors?" },
    ],
    build: (p) => {
      const n = num(p, "count"), t = str(p, "type");
      const door = t === "oak" ? mat("Oak internal door 1981 x 762mm", n, "each", 110)
        : t === "fire" ? mat("FD30 fire door 1981 x 762mm", n, "each", 125)
        : mat("White primed internal door 1981 x 762mm", n, "each", 45);
      const m = [
        mat(t === "fire" ? "Fire rated ball bearing hinges 4in pack of 3" : "Butt hinges 3in pack of 3", n, "pack", t === "fire" ? 14 : 6),
        mat("Tubular mortice latch 64mm", n, "each", 6),
        mat("Lever door handles on rose pair", n, "pack", 18),
        mat("Wood screws assorted", 1, "pack", 6),
      ];
      if (yes(p, "supply_doors")) m.unshift(door);
      return {
        materials: m,
        labour: [lab("Trim, hang and fit ironmongery", n * (t === "fire" ? 3.5 : 2))],
        overheads: ["Transport", "Waste disposal"],
      };
    },
  },
  {
    id: "skirting",
    trade: "carpentry",
    title: "Fit skirting board",
    covers: "Remove old and fit new MDF skirting boards around rooms",
    keywords: ["skirting", "skirting board", "skirtings"],
    params: [
      { key: "metres", label: "Length", kind: "number", unit: "m", default: 14, min: 1, max: 300, ask: "Roughly how many metres (room perimeter minus doorways)?", important: true },
      { key: "remove_old", label: "Remove old skirting", kind: "boolean", default: true, ask: "Is old skirting being removed?" },
    ],
    build: (p) => {
      const m = num(p, "metres");
      return {
        materials: [
          mat("MDF torus skirting board 119mm x 4.2m primed", packs(m * 1.12, 4.2), "each", 17),
          mat("Grab adhesive 290ml", packs(m, 8), "each", 6),
          mat("Decorators caulk white 310ml", packs(m, 15), "each", 3),
          mat("Panel pins and oval nails assorted", 1, "pack", 4),
        ],
        labour: [
          ...(yes(p, "remove_old") ? [lab("Remove old skirting", 0.08 * m)] : []),
          lab("Cut, mitre and fit skirting", 0.5 + 0.22 * m),
        ],
        overheads: ["Transport", ...(yes(p, "remove_old") ? ["Waste disposal"] : [])],
      };
    },
  },
  {
    id: "architrave",
    trade: "carpentry",
    title: "Fit architrave",
    covers: "Fit new architrave around door openings",
    keywords: ["architrave", "architraves"],
    params: [
      { key: "sides", label: "Door sides", kind: "number", unit: "each", default: 2, min: 1, max: 40, ask: "How many door sides (each door usually has 2)?" },
    ],
    build: (p) => {
      const s = num(p, "sides");
      return {
        materials: [mat("MDF torus architrave set 69mm primed", s, "set", 16), mat("Panel pins and oval nails assorted", 1, "pack", 4), mat("Decorators caulk white 310ml", packs(s, 4), "each", 3)],
        labour: [lab("Cut, mitre and fit architrave", 0.75 * s)],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "laminate_floor",
    trade: "carpentry",
    title: "Lay laminate or engineered flooring",
    covers: "Lay click laminate or engineered wood floor on underlay, with beading and door bars",
    keywords: ["laminate", "flooring", "engineered", "wood floor", "floating floor"],
    params: [
      { key: "area", label: "Floor area", kind: "number", unit: "m²", default: 12, min: 1, max: 200, ask: "Floor area in m² (length × width)?", important: true },
      { key: "type", label: "Floor", kind: "choice", choices: ["laminate", "engineered"], default: "laminate", ask: "Laminate or engineered wood?" },
      { key: "doorways", label: "Doorways", kind: "number", unit: "each", default: 1, min: 0, max: 10, ask: "How many doorways?" },
      { key: "supply_floor", label: "We supply the flooring", kind: "boolean", default: true, ask: "Are you supplying the flooring?" },
    ],
    build: (p) => {
      const a = num(p, "area"), eng = str(p, "type") === "engineered";
      const perim = 4 * Math.sqrt(a);
      const m = [
        mat("Flooring underlay 5mm roll 15m²", packs(a * 1.05, 15), "roll", 30),
        mat("Scotia beading 2.4m", packs(perim, 2.4), "each", 4),
        mat("Door threshold bar 900mm", num(p, "doorways"), "each", 11),
        mat("Grab adhesive 290ml", packs(perim, 10), "each", 6),
      ];
      if (yes(p, "supply_floor")) {
        m.unshift(eng
          ? mat("Engineered oak flooring pack 1.5m²", packs(a * 1.1, 1.5), "pack", 60)
          : mat("Laminate flooring 8mm pack 2.2m²", packs(a * 1.1, 2.2), "pack", 30));
      }
      return {
        materials: m.filter((x) => x.quantity > 0),
        labour: [lab("Prepare floor and lay underlay", 0.1 * a + 0.5), lab("Lay flooring", a * (eng ? 0.5 : 0.4)), lab("Fit beading and door bars", 0.12 * perim + 0.5 * num(p, "doorways"))],
        overheads: ["Transport", "Waste disposal"],
      };
    },
  },
  {
    id: "fence_panels",
    trade: "carpentry",
    title: "Fence panels",
    covers: "Erect or replace 6ft fence panels with posts and gravel boards",
    keywords: ["fence", "fencing", "fence panel", "fence panels"],
    params: [
      { key: "length", label: "Fence length", kind: "number", unit: "m", default: 9, min: 1.8, max: 200, ask: "How long is the fence run in metres?", important: true },
      { key: "posts", label: "Posts", kind: "choice", choices: ["concrete", "timber"], default: "concrete", ask: "Concrete or timber posts?" },
      { key: "remove_old", label: "Remove old fence", kind: "boolean", default: true, ask: "Is an old fence being removed?" },
    ],
    build: (p) => {
      const panels = packs(num(p, "length"), 1.83), posts = panels + 1, conc = str(p, "posts") === "concrete";
      return {
        materials: [
          mat("Overlap fence panel 6ft x 6ft", panels, "each", 38),
          conc ? mat("Concrete slotted fence post 2.4m", posts, "each", 32) : mat("Treated timber fence post 100 x 100mm 2.4m", posts, "each", 18),
          conc ? mat("Concrete gravel board 6ft", panels, "each", 20) : mat("Treated timber gravel board 1.83m", panels, "each", 12),
          mat("Postcrete 20kg", posts * 2, "bag", 8),
          ...(!conc ? [mat("Fence panel clips pack of 4", panels, "pack", 4)] : []),
        ],
        labour: [
          ...(yes(p, "remove_old") ? [lab("Remove old fence and posts", 0.6 * panels)] : []),
          lab("Dig holes, set posts and fit panels", 1.25 * posts + 0.4 * panels),
        ],
        overheads: ["Transport", ...(yes(p, "remove_old") ? ["Waste disposal"] : [])],
      };
    },
  },
  {
    id: "stud_wall",
    trade: "carpentry",
    title: "Stud partition wall",
    covers: "Build a timber stud wall, boarded both sides (plastering is separate)",
    keywords: ["stud wall", "partition", "stud partition"],
    params: [
      { key: "length", label: "Wall length", kind: "number", unit: "m", default: 3, min: 0.6, max: 30, ask: "How long is the wall (metres)?", important: true },
      { key: "height", label: "Height", kind: "number", unit: "m", default: 2.4, min: 2, max: 3.6, ask: "Ceiling height (metres)?" },
      { key: "insulated", label: "Acoustic insulation", kind: "boolean", default: true, ask: "Insulated for sound?" },
      { key: "door", label: "Door opening", kind: "boolean", default: false, ask: "Does it need a door opening?" },
    ],
    build: (p) => {
      const L = num(p, "length"), H = num(p, "height");
      const studs = ceil(L / 0.4) + 1 + (yes(p, "door") ? 2 : 0);
      const timberLengths = studs + packs(2 * L, 2.4) + packs(L, 2.4); // studs + plates + noggins
      const boardArea = 2 * L * H;
      return {
        materials: [
          mat("CLS timber 38 x 89mm 2.4m", timberLengths, "each", 6),
          mat("Plasterboard 12.5mm 2400 x 1200mm", packs(boardArea * 1.1, 2.88), "sheet", 13),
          mat("Drywall screws 38mm box of 1000", 1, "box", 10),
          mat("Wood screws 90mm box", 1, "box", 12),
          ...(yes(p, "insulated") ? [mat("Acoustic insulation roll 50mm 8.6m²", packs(L * H, 8.6), "roll", 30)] : []),
        ],
        labour: [lab("Build stud frame", 1 + 0.9 * L), lab("Board both sides", 0.25 * boardArea)],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "decking",
    trade: "carpentry",
    title: "Timber decking",
    covers: "Build a ground-level softwood deck on a treated joist frame",
    keywords: ["decking", "deck"],
    params: [
      { key: "area", label: "Deck area", kind: "number", unit: "m²", default: 12, min: 2, max: 150, ask: "Deck area in m²?", important: true },
    ],
    build: (p) => {
      const a = num(p, "area");
      const boards = packs((a / (0.144 * 3.6)) * 1.1, 1);
      const joists = packs((a / 0.4 / 4.8) * 1.15, 1) + 2;
      return {
        materials: [
          mat("Treated softwood deck board 144 x 28mm 3.6m", boards, "each", 13),
          mat("Treated joist C24 47 x 150mm 4.8m", joists, "each", 24),
          mat("Decking screws 4.5 x 65mm tub of 500", packs(a, 12), "tub", 18),
          mat("Weed control fabric 1m x 14m", packs(a, 14), "roll", 12),
          mat("Adjustable deck pedestal", ceil(a * 1.5), "each", 4),
          mat("End grain preserver 1L", 1, "each", 11),
        ],
        labour: [lab("Prepare ground and lay membrane", 0.2 * a + 1), lab("Build joist frame", 0.5 * a), lab("Fix deck boards and finish", 0.6 * a)],
        overheads: ["Transport", "Waste disposal"],
      };
    },
  },
];
