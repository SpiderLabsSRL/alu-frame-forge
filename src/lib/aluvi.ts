// =====================================================================
// PARÁMETROS DE DEMOSTRACIÓN — NO SON REGLAS REALES DE FABRICACIÓN.
// Sustituir por las fichas técnicas oficiales de ALUVI.
// =====================================================================

export type ModelId = "aluvi2" | "sliding2" | "sliding3" | "fixed";
export type Distribution = "equal" | "left-wide" | "center-wide";

export const DEMO_PARAMS = {
  frameProfileWidth: 45,
  leafProfileWidth: 40,
  leafOverlap: 30,
  leafHeightClearance: 10,
  glassBite: 8,
  glassDensity: 2.5,
};

export const PROFILES = {
  "MH-01": { name: "Marco horizontal", kgm: 0.62 },
  "MV-01": { name: "Marco vertical", kgm: 0.58 },
  "HH-01": { name: "Hoja perfil horizontal", kgm: 0.48 },
  "HV-01": { name: "Hoja perfil vertical (jamba/traslape)", kgm: 0.52 },
} as const;

export const GLASS_TYPES = {
  float: "Float incoloro",
  tinted: "Float bronce",
  laminated: "Laminado",
} as const;

export const MODELS: Record<ModelId, { label: string; leaves: number }> = {
  aluvi2: { label: "Ventana corrediza de 2 hojas (ALUVI)", leaves: 2 },
  sliding2: { label: "Corrediza 2 hojas", leaves: 2 },
  sliding3: { label: "Corrediza 3 hojas", leaves: 3 },
  fixed: { label: "Ventana fija", leaves: 1 },
};

export interface WindowConfig {
  model: ModelId;
  width: number;
  height: number;
  leaves: number;
  distribution: Distribution;
  glassType: keyof typeof GLASS_TYPES;
  glassThickness: number;
}

export const DEFAULT_CONFIG: WindowConfig = {
  model: "aluvi2",
  width: 2000,
  height: 2000,
  leaves: 2,
  distribution: "equal",
  glassType: "float",
  glassThickness: 6,
};

export interface Piece {
  code: string;
  name: string;
  qty: number;
  length: number;
  kgm: number;
  unitWeight: number;
  totalWeight: number;
}

export interface Leaf { x: number; width: number }
export interface GlassPane { x: number; y: number; w: number; h: number }

export interface CalcResult {
  pieces: Piece[];
  leaves: Leaf[];
  glass: GlassPane[];
  pieceCount: number;
  aluminumMeters: number;
  aluminumWeight: number;
  glassArea: number;
  glassWeight: number;
  totalWeight: number;
  glassCuts?: { qty: number; w: number; h: number }[];
  pending?: string[];
}

// =====================================================================
// MODELO TÉCNICO ALUVI — Corrediza 2 hojas (fuente: documento técnico).
// =====================================================================
export type Base = "L" | "H" | "L/2";
export interface TechProfile { code: string; name: string; kgm: number; qty: number | null; base: Base; offset: number }
export interface Accessory { name: string; qty: number | null; unit: string; note?: string }
export interface TechParams {
  profiles: TechProfile[];
  glass: { qty: number; widthDivisor: number; widthOffset: number; heightOffset: number };
  accessories: Accessory[];
}
export const ALUVI_REF_SIZE = { width: 2000, height: 2000 };
export const DEFAULT_TECH: TechParams = {
  profiles: [
    { code: "7621", name: "Riel superior", kgm: 1.038, qty: 1, base: "L", offset: -30 },
    { code: "7622", name: "Riel inferior", kgm: 1.018, qty: 1, base: "L", offset: -30 },
    { code: "7623", name: "Jamba", kgm: 0.551, qty: 2, base: "H", offset: 0 },
    { code: "7624", name: "Cabezal", kgm: 0.525, qty: 2, base: "L/2", offset: -68 },
    { code: "7625", name: "Zócalo pequeño superior", kgm: 0.558, qty: 1, base: "L/2", offset: -68 },
    { code: "7625A", name: "Zócalo grande inferior", kgm: 0.842, qty: 1, base: "L/2", offset: -68 },
    { code: "7626", name: "Pierna", kgm: 0.615, qty: 2, base: "H", offset: -71 },
    { code: "7627", name: "Enganche", kgm: 0.64, qty: 2, base: "H", offset: -71 },
  ],
  glass: { qty: 2, widthDivisor: 2, widthOffset: -80, heightOffset: -157 },
  accessories: [
    { name: "Felpa", qty: 24, unit: "m" },
    { name: "Silicona", qty: 31, unit: "m/l", note: "3 tubos" },
    { name: "Ruedas", qty: 2, unit: "pieza" },
    { name: "Canoa", qty: 1, unit: "pieza" },
    { name: "Guías", qty: 8, unit: "pieza" },
    { name: "Tornillo 8x0,5", qty: 8, unit: "pieza" },
  ],
};
export const cutLength = (p: TechProfile, W: number, H: number) =>
  (p.base === "L" ? W : p.base === "H" ? H : W / 2) + p.offset;

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function validate(c: WindowConfig): string[] {
  const w: string[] = [];
  if (!c.width || c.width < 400 || c.width > 4000) w.push("El ancho debe estar entre 400 y 4000 mm.");
  if (!c.height || c.height < 300 || c.height > 3000) w.push("El alto debe estar entre 300 y 3000 mm.");
  if (!c.glassThickness || c.glassThickness <= 0) w.push("Falta el espesor del vidrio.");
  if (c.model !== "fixed" && c.model !== "aluvi2" && (!c.leaves || c.leaves < 2)) w.push("Una corrediza necesita al menos 2 hojas.");
  return w;
}

function ratios(n: number, d: Distribution): number[] {
  if (n <= 1 || d === "equal") return Array(n).fill(1 / n);
  if (d === "left-wide") {
    const first = 0.5;
    return [first, ...Array(n - 1).fill((1 - first) / (n - 1))];
  }
  if (n < 3) return Array(n).fill(1 / n);
  const mid = Math.floor(n / 2);
  const big = 0.45;
  return Array.from({ length: n }, (_, i) => (i === mid ? big : (1 - big) / (n - 1)));
}

export function calculate(c: WindowConfig, tech: TechParams = DEFAULT_TECH): CalcResult | null {
  if (validate(c).length) return null;
  if (c.model === "aluvi2") return calculateAluvi(c, tech);
  // ... (El resto de cálculos genéricos se mantienen igual)
  const P = DEMO_PARAMS;
  const n = c.model === "fixed" ? 1 : c.leaves;
  const innerW = c.width - 2 * P.frameProfileWidth;
  const innerH = c.height - 2 * P.frameProfileWidth;
  const r = ratios(n, c.distribution);
  const totalLeafW = innerW + P.leafOverlap * (n - 1);
  const leaves: Leaf[] = [];
  let x = P.frameProfileWidth;
  r.forEach((ri) => {
    const lw = n === 1 ? innerW : totalLeafW * ri;
    leaves.push({ x, width: lw });
    x += lw - (n === 1 ? 0 : P.leafOverlap);
  });
  const mk = (code: keyof typeof PROFILES, qty: number, length: number): Piece => {
    const kgm = PROFILES[code].kgm;
    const unitWeight = (length / 1000) * kgm;
    return { code, name: PROFILES[code].name, qty, length: round(length, 1), kgm, unitWeight: round(unitWeight, 3), totalWeight: round(qty * unitWeight, 3) };
  };
  const pieces: Piece[] = [mk("MH-01", 2, c.width), mk("MV-01", 2, c.height)];
  const glass: GlassPane[] = [];
  const bite = P.glassBite;
  if (c.model === "fixed") {
    glass.push({ x: P.frameProfileWidth - bite, y: P.frameProfileWidth - bite, w: innerW + 2 * bite, h: innerH + 2 * bite });
  } else {
    const leafH = innerH - P.leafHeightClearance;
    const groups = new Map<number, number>();
    leaves.forEach((l) => { const k = round(l.width, 1); groups.set(k, (groups.get(k) ?? 0) + 1); });
    groups.forEach((count, lw) => pieces.push(mk("HH-01", 2 * count, lw)));
    pieces.push(mk("HV-01", 2 * n, leafH));
    const y = P.frameProfileWidth + P.leafHeightClearance / 2;
    leaves.forEach((l) => {
      glass.push({ x: l.x + P.leafProfileWidth - bite, y: y + P.leafProfileWidth - bite, w: l.width - 2 * P.leafProfileWidth + 2 * bite, h: leafH - 2 * P.leafProfileWidth + 2 * bite });
    });
  }
  const pieceCount = pieces.reduce((s, p) => s + p.qty, 0);
  const aluminumMeters = pieces.reduce((s, p) => s + (p.qty * p.length) / 1000, 0);
  const aluminumWeight = pieces.reduce((s, p) => s + p.totalWeight, 0);
  const glassArea = glass.reduce((s, g) => s + (g.w * g.h) / 1e6, 0);
  const glassWeight = glassArea * c.glassThickness * P.glassDensity;
  return { pieces, leaves, glass, pieceCount, aluminumMeters: round(aluminumMeters), aluminumWeight: round(aluminumWeight), glassArea: round(glassArea, 3), glassWeight: round(glassWeight), totalWeight: round(aluminumWeight + glassWeight) };
}

function calculateAluvi(c: WindowConfig, t: TechParams): CalcResult {
  const W = c.width, H = c.height;
  const pending: string[] = [];
  const pieces: Piece[] = t.profiles.map((p) => {
    const length = cutLength(p, W, H);
    const unitWeight = (length / 1000) * p.kgm;
    if (p.qty == null) pending.push(`Cantidad de ${p.code} ${p.name} pendiente de confirmar.`);
    const qty = p.qty ?? 0;
    return { code: p.code, name: p.name, qty, length: round(length, 1), kgm: p.kgm, unitWeight: round(unitWeight, 3), totalWeight: round(qty * unitWeight, 3) };
  });

  // Cálculos basados exactamente en el plano técnico y Excel
  const gw = round(W / t.glass.widthDivisor + t.glass.widthOffset, 1);
  const gh = round(H + t.glass.heightOffset, 1);
  
  // Ancho del marco exterior e interior para el dibujo (proporcional)
  const frameDraw = 30; 
  const overlapDraw = 46; // Traslape central (según plano AutoCAD)
  const leafW = (W - overlapDraw) / 2;

  // Hojas: Izquierda y Derecha con el traslape en el centro
  const leaves: Leaf[] = [
    { x: frameDraw, width: leafW }, 
    { x: W - frameDraw - leafW, width: leafW }
  ];

  // Posicionamiento del vidrio dentro de las hojas
  const glass: GlassPane[] = leaves.slice(0, t.glass.qty).map((l) => ({
    x: l.x + 15, // Margen interno de la hoja (perfil)
    y: (H - gh) / 2, 
    w: gw, 
    h: gh,
  }));

  const pieceCount = pieces.reduce((s, p) => s + p.qty, 0);
  const aluminumMeters = pieces.reduce((s, p) => s + (p.qty * p.length) / 1000, 0);
  const aluminumWeight = pieces.reduce((s, p) => s + p.totalWeight, 0);
  const glassArea = (t.glass.qty * gw * gh) / 1e6;
  const glassWeight = glassArea * c.glassThickness * DEMO_PARAMS.glassDensity;

  return {
    pieces, leaves, glass, pieceCount,
    aluminumMeters: round(aluminumMeters), aluminumWeight: round(aluminumWeight),
    glassArea: round(glassArea, 3), glassWeight: round(glassWeight),
    totalWeight: round(aluminumWeight + glassWeight),
    glassCuts: [{ qty: t.glass.qty, w: gw, h: gh }],
    pending,
  };
}