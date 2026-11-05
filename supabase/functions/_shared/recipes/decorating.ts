// Plastering, painting & decorating, tiling
import { type Recipe, type Params, mat, lab, num, yes, str, packs } from "./types.ts";

/** Wall and ceiling area from room dimensions, or the areas given directly. */
const roomAreas = (p: Params) => {
  const L = num(p, "length"), W = num(p, "width"), H = num(p, "height") || 2.4;
  const walls = num(p, "wall_area") || (L && W ? 2 * (L + W) * H - 1.9 * num(p, "doors") - 1.5 * num(p, "windows") : 0);
  const ceiling = num(p, "ceiling_area") || (L && W ? L * W : 0);
  const perimeter = L && W ? 2 * (L + W) : Math.sqrt(Math.max(ceiling, 1)) * 4;
  return { walls: Math.max(0, walls), ceiling, perimeter };
};

const ROOM_PARAMS = [
  { key: "length", label: "Room length", kind: "number" as const, unit: "m", default: 4, min: 0, max: 30, ask: "Room length (metres)?", important: true },
  { key: "width", label: "Room width", kind: "number" as const, unit: "m", default: 3.5, min: 0, max: 30, ask: "Room width (metres)?", important: true },
  { key: "height", label: "Ceiling height", kind: "number" as const, unit: "m", default: 2.4, min: 2, max: 5, ask: "Ceiling height (metres)?" },
  { key: "doors", label: "Doors", kind: "number" as const, unit: "each", default: 1, min: 0, max: 6, ask: "How many doors?" },
  { key: "windows", label: "Windows", kind: "number" as const, unit: "each", default: 1, min: 0, max: 8, ask: "How many windows?" },
];

export const DECORATING: Recipe[] = [
  {
    id: "paint_room",
    trade: "decorating",
    title: "Paint a room",
    covers: "Prepare and paint a room's walls, and optionally ceiling, skirting and doors",
    keywords: ["paint", "painting", "decorate", "decorating", "repaint", "emulsion"],
    params: [
      ...ROOM_PARAMS,
      { key: "rooms", label: "Rooms like this", kind: "number", unit: "each", default: 1, min: 1, max: 15, ask: "How many rooms?" },
      { key: "ceiling", label: "Paint ceiling", kind: "boolean", default: true, ask: "Ceiling too?" },
      { key: "woodwork", label: "Paint skirting & doors", kind: "boolean", default: true, ask: "Skirting, door frames and doors too?" },
      { key: "coats", label: "Coats", kind: "number", default: 2, min: 1, max: 3, ask: "Two coats (usual), or one for a same-colour refresh?" },
      { key: "prep", label: "Prep level", kind: "choice", choices: ["light", "normal", "heavy"], default: "normal", ask: "How much filling and sanding do the walls need?" },
    ],
    build: (p) => {
      const rooms = num(p, "rooms") || 1, coats = num(p, "coats") || 2;
      const { walls, ceiling, perimeter } = roomAreas(p);
      const W = walls * rooms, C = yes(p, "ceiling") ? ceiling * rooms : 0;
      const skirt = yes(p, "woodwork") ? (perimeter - 0.8 * num(p, "doors")) * rooms : 0;
      const doors = yes(p, "woodwork") ? num(p, "doors") * rooms : 0;
      const prep = { light: 0.02, normal: 0.04, heavy: 0.12 }[str(p, "prep")] ?? 0.04;
      // Emulsion ~12 m²/L/coat on sound walls; trade 10L tubs
      const wallLitres = (W * coats) / 14;
      const ceilLitres = (C * coats) / 14;
      // Woodwork: satinwood ~16 m²/L; skirting ≈ 0.15 m²/m, door + frame ≈ 4 m² both faces
      const woodArea = skirt * 0.15 + doors * 4;
      const m = [
        mat("Trade vinyl matt emulsion 10L", wallLitres > 6 ? packs(wallLitres, 10) : 0, "tub", 48),
        mat("Trade vinyl matt emulsion 5L", wallLitres > 6 ? 0 : packs(wallLitres, 5), "tub", 28),
        ...(C ? [mat("Brilliant white matt ceiling emulsion 5L", packs(ceilLitres, 5), "tub", 24)] : []),
        ...(woodArea ? [(woodArea * 2) / 16 <= 1.5
          ? mat("Satinwood paint 750ml", packs((woodArea * 2) / 16, 0.75), "tin", 15)
          : mat("Satinwood paint 2.5L", packs((woodArea * 2) / 16, 2.5), "tin", 38)] : []),
        mat("Flexible filler 330g", packs((W + C) * (prep * 10), 25), "each", 7),
        mat("Decorators caulk white 310ml", packs(skirt + doors * 10 + 1, 15), "each", 3),
        mat("Masking tape 50m", packs(rooms, 2), "roll", 4),
        mat("Sandpaper assorted pack", packs(rooms, 3), "pack", 6),
        mat("Dust sheet 12 x 9ft", 2, "each", 6),
        mat("Roller sleeve and tray set", 1, "set", 10),
      ].filter((x) => x.quantity > 0);
      return {
        materials: m,
        labour: [
          lab("Protect room and prepare surfaces", rooms * 0.5 + (W + C) * prep),
          lab("Paint walls", W * 0.05 * coats),
          ...(C ? [lab("Paint ceiling", C * 0.08 * coats)] : []),
          ...(woodArea ? [lab("Undercoat and paint woodwork", skirt * 0.07 * 2 + doors * 1)] : []),
        ],
        overheads: ["Transport"],
      };
    },
  },
  {
    id: "skim",
    trade: "decorating",
    title: "Skim plaster",
    covers: "Skim-coat walls and/or ceilings with multi-finish plaster",
    keywords: ["skim", "skimming", "plaster", "plastering", "replaster", "re-skim"],
    params: [
      { key: "wall_area", label: "Wall area to skim", kind: "number", unit: "m²", default: 0, min: 0, max: 500, ask: "Wall area to skim in m² (or give the room size)?", important: true },
      { key: "ceiling_area", label: "Ceiling area to skim", kind: "number", unit: "m²", default: 0, min: 0, max: 300, ask: "Ceiling area to skim in m²?" },
      ...ROOM_PARAMS.map((x) => ({ ...x, important: false, default: 0 })),
      { key: "include_ceiling", label: "Skim the ceiling too", kind: "boolean", default: false, ask: "Ceiling as well as walls?" },
      { key: "corners", label: "External corners", kind: "number", unit: "each", default: 0, min: 0, max: 30, ask: "Any external corners needing angle bead?" },
    ],
    build: (p) => {
      const room = roomAreas(p);
      let walls = room.walls;
      const ceiling = num(p, "ceiling_area") || (yes(p, "include_ceiling") ? room.ceiling : 0);
      if (!walls && !ceiling) walls = 30;
      const area = walls + ceiling;
      return {
        materials: [
          mat("Multi-finish plaster 25kg", packs(area, 10), "bag", 12),
          mat("PVA bonding agent 5L", packs(area, 40), "each", 14),
          mat("Plasterboard scrim tape 90m", packs(area, 60), "roll", 5),
          ...(num(p, "corners") ? [mat("Thin coat angle bead 2.4m", num(p, "corners"), "each", 3)] : []),
          mat("Dust sheet 12 x 9ft", 2, "each", 6),
        ],
        labour: [
          lab("Protect, prepare and PVA surfaces", 1.5 + area * 0.05),
          ...(walls ? [lab("Skim walls", walls * 0.33)] : []),
          ...(ceiling ? [lab("Skim ceiling", ceiling * 0.4)] : []),
        ],
        overheads: ["Transport", "Waste disposal"],
      };
    },
  },
  {
    id: "ceiling_board",
    trade: "decorating",
    title: "Replace or overboard ceiling",
    covers: "Take down or overboard a ceiling with new plasterboard, tape and skim",
    keywords: ["ceiling", "overboard", "artex", "new ceiling", "ceiling down"],
    params: [
      { key: "ceiling_area", label: "Ceiling area", kind: "number", unit: "m²", default: 12, min: 1, max: 200, ask: "Ceiling area in m²?", important: true },
      { key: "remove_old", label: "Take old ceiling down", kind: "boolean", default: false, ask: "Taking the old ceiling down, or boarding over it?" },
    ],
    build: (p) => {
      const a = num(p, "ceiling_area");
      return {
        materials: [
          mat("Plasterboard 12.5mm 2400 x 1200mm", packs(a * 1.1, 2.88), "sheet", 13),
          mat("Drywall screws 38mm box of 1000", packs(a, 40), "box", 10),
          mat("Plasterboard scrim tape 90m", 1, "roll", 5),
          mat("Multi-finish plaster 25kg", packs(a, 10), "bag", 12),
        ],
        labour: [
          ...(yes(p, "remove_old") ? [lab("Take down old ceiling and clear", 0.35 * a)] : []),
          lab("Fix plasterboard", 0.3 * a + 0.5),
          lab("Tape and skim", 0.45 * a),
        ],
        overheads: ["Transport", yes(p, "remove_old") ? "Skip hire" : "Waste disposal"],
      };
    },
  },
  {
    id: "wallpaper",
    trade: "decorating",
    title: "Hang wallpaper",
    covers: "Strip (optional) and hang wallpaper on walls",
    keywords: ["wallpaper", "paper the", "feature wall", "wall paper"],
    params: [
      { key: "wall_area", label: "Wall area", kind: "number", unit: "m²", default: 0, min: 0, max: 400, ask: "Wall area to paper in m² (or room size)?", important: true },
      ...ROOM_PARAMS.map((x) => ({ ...x, important: false, default: 0 })),
      { key: "strip", label: "Strip old paper", kind: "boolean", default: false, ask: "Is there old paper to strip?" },
      { key: "supply_paper", label: "We supply the paper", kind: "boolean", default: false, ask: "Is the customer supplying the wallpaper?" },
    ],
    build: (p) => {
      let { walls } = roomAreas(p);
      if (!walls) walls = 10;
      const rolls = packs(walls * 1.15, 5.3);
      return {
        materials: [
          ...(yes(p, "supply_paper") ? [mat("Wallpaper roll 10m x 0.53m", rolls, "roll", 20)] : []),
          mat("Ready mixed wallpaper paste 4.5kg", packs(rolls, 6), "tub", 12),
          mat("Flexible filler 330g", 1, "each", 7),
          mat("Sandpaper assorted pack", 1, "pack", 6),
        ],
        labour: [
          ...(yes(p, "strip") ? [lab("Strip old wallpaper", walls * 0.15)] : []),
          lab("Prepare walls and size", walls * 0.04 + 0.5),
          lab("Hang wallpaper", rolls * 0.85),
        ],
        overheads: ["Transport", ...(yes(p, "strip") ? ["Waste disposal"] : [])],
      };
    },
  },
  {
    id: "tiling",
    trade: "decorating",
    title: "Wall or floor tiling",
    covers: "Tile walls or floors (bathroom, kitchen splashback), including adhesive, grout and trims",
    keywords: ["tile", "tiles", "tiling", "retile", "splashback"],
    params: [
      { key: "area", label: "Tiled area", kind: "number", unit: "m²", default: 6, min: 0.5, max: 200, ask: "Area to tile in m²?", important: true },
      { key: "surface", label: "Surface", kind: "choice", choices: ["wall", "floor"], default: "wall", ask: "Walls or floor?" },
      { key: "tile_price", label: "Tile price", kind: "number", unit: "£/m²", default: 25, min: 0, max: 300, ask: "Tile budget per m² (0 if the customer supplies them)?" },
      { key: "remove_old", label: "Remove old tiles", kind: "boolean", default: false, ask: "Are old tiles being removed?" },
      { key: "large_format", label: "Large format (600mm+)", kind: "boolean", default: false, ask: "Large tiles (600mm or bigger)?" },
    ],
    build: (p) => {
      const a = num(p, "area"), floor = str(p, "surface") === "floor", big = yes(p, "large_format");
      const tileM2 = a * (big ? 1.12 : 1.1);
      const perBag = floor || big ? 3.5 : 5;
      const m = [
        ...(num(p, "tile_price") > 0 ? [mat(`${floor ? "Floor" : "Wall"} tiles`, Math.ceil(tileM2 * 10) / 10, "m²", num(p, "tile_price"))] : []),
        mat(floor ? "Flexible rapid set floor tile adhesive 20kg" : "Ready mixed wall tile adhesive 15kg", packs(a, perBag), floor ? "bag" : "tub", floor ? 24 : 22),
        mat("Flexible wall and floor tile grout 5kg", packs(a, floor ? 8 : 12), "bag", 12),
        mat("Tile trim 2.5m", packs(Math.sqrt(a) * 2, 2.5), "each", 5),
        mat("Tile spacers and levelling clips", 1, "pack", big ? 25 : 6),
        mat("Sanitary silicone sealant white", 1, "each", 7),
        ...(floor ? [mat("Tile primer 1L", packs(a, 10), "each", 12)] : []),
      ];
      return {
        materials: m,
        labour: [
          ...(yes(p, "remove_old") ? [lab("Remove old tiles and make good", 0.6 * a)] : []),
          lab("Prepare and set out", 1 + 0.1 * a),
          lab("Tile", a * (floor ? 0.8 : 0.6) * (big ? 1.2 : 1)),
          lab("Grout, trim and seal", 0.25 * a + 0.5),
        ],
        overheads: ["Transport", ...(yes(p, "remove_old") ? ["Waste disposal"] : [])],
      };
    },
  },
  {
    id: "exterior_paint",
    trade: "decorating",
    title: "Exterior masonry painting",
    covers: "Wash down and paint rendered or masonry outside walls",
    keywords: ["masonry", "render", "exterior", "outside walls", "front of the house"],
    params: [
      { key: "area", label: "Wall area", kind: "number", unit: "m²", default: 40, min: 5, max: 600, ask: "Wall area to paint in m²?", important: true },
      { key: "access", label: "Access", kind: "choice", choices: ["ladders", "tower", "scaffold"], default: "tower", ask: "Ground floor only (ladders), or a tower / scaffold needed?" },
    ],
    build: (p) => {
      const a = num(p, "area"), acc = str(p, "access");
      return {
        materials: [
          mat("Smooth masonry paint 10L", packs((a * 2) / 9, 10), "tub", 50),
          mat("Fungicidal wash 5L", packs(a, 60), "each", 16),
          mat("Exterior filler 1kg", packs(a, 40), "each", 9),
          mat("Masking tape 50m", 2, "roll", 4),
        ],
        labour: [lab("Wash down and repair", 0.06 * a + 1), lab("Paint two coats", a * 0.18)],
        overheads: ["Transport", ...(acc === "tower" ? ["Access equipment"] : acc === "scaffold" ? ["Scaffolding"] : [])],
      };
    },
  },
  {
    id: "coving",
    trade: "decorating",
    title: "Fit coving",
    covers: "Fit plaster or polystyrene coving around a ceiling",
    keywords: ["coving", "cornice"],
    params: [{ key: "metres", label: "Length", kind: "number", unit: "m", default: 14, min: 1, max: 200, ask: "Room perimeter in metres?", important: true }],
    build: (p) => {
      const m = num(p, "metres");
      return {
        materials: [
          mat("Plaster coving 127mm x 3m", packs(m * 1.1, 3), "each", 12),
          mat("Coving adhesive 1.5kg", packs(m, 12), "each", 8),
          mat("Decorators caulk white 310ml", packs(m, 10), "each", 3),
        ],
        labour: [lab("Cut, mitre and fit coving", 0.5 + 0.3 * m)],
        overheads: ["Transport"],
      };
    },
  },
];
