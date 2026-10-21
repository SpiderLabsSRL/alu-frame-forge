// =====================================================================
// PARÁMETROS DE DEMOSTRACIÓN — NO SON REGLAS REALES DE FABRICACIÓN.
// Sustituir por las fichas técnicas oficiales de ALUVI.
// =====================================================================

export type ModelId = "sliding2" | "sliding3" | "fixed";
export type Distribution = "equal" | "left-wide" | "center-wide";

export const DEMO_PARAMS = {
  frameProfileWidth: 45, // mm, ancho visto del marco
  leafProfileWidth: 40, // mm, ancho visto de la hoja
  leafOverlap: 30, // mm, solape entre hojas (traslape)
  leafHeightClearance: 10, // mm, holgura total vertical de la hoja en el marco
  glassBite: 8, // mm por lado, inserción del vidrio en el perfil
  glassDensity: 2.5, // kg/m² por mm de espesor (vidrio float nominal)
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
  model: "sliding2",
  width: 1500,
  height: 1200,
  leaves: 2,
  distribution: "equal",
  glassType: "float",
  glassThickness: 6,
};

export interface Piece {
  code: keyof typeof PROFILES;
  name: string;
  qty: number;
  length: number; // mm
  kgm: number;
  unitWeight: number; // kg
  totalWeight: number; // kg
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
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function validate(c: WindowConfig): string[] {
  const w: string[] = [];
  if (!c.width || c.width < 400 || c.width > 4000) w.push("El ancho debe estar entre 400 y 4000 mm.");
  if (!c.height || c.height < 300 || c.height > 3000) w.push("El alto debe estar entre 300 y 3000 mm.");
  if (!c.glassThickness || c.glassThickness <= 0) w.push("Falta el espesor del vidrio.");
  if (c.model !== "fixed" && (!c.leaves || c.leaves < 2)) w.push("Una corrediza necesita al menos 2 hojas.");
  return w;
}

function ratios(n: number, d: Distribution): number[] {
  if (n <= 1 || d === "equal") return Array(n).fill(1 / n);
  if (d === "left-wide") {
    const first = 0.5;
    return [first, ...Array(n - 1).fill((1 - first) / (n - 1))];
  }
  // center-wide
  if (n < 3) return Array(n).fill(1 / n);
  const mid = Math.floor(n / 2);
  const big = 0.45;
  return Array.from({ length: n }, (_, i) => (i === mid ? big : (1 - big) / (n - 1)));
}

export function calculate(c: WindowConfig): CalcResult | null {
  if (validate(c).length) return null;
  const P = DEMO_PARAMS;
  const n = c.model === "fixed" ? 1 : c.leaves;
  const innerW = c.width - 2 * P.frameProfileWidth;
  const innerH = c.height - 2 * P.frameProfileWidth;

  const r = ratios(n, c.distribution);
  // Ancho total de hojas incluye solapes
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
    // agrupar hojas por ancho
    const groups = new Map<number, number>();
    leaves.forEach((l) => { const k = round(l.width, 1); groups.set(k, (groups.get(k) ?? 0) + 1); });
    groups.forEach((count, lw) => pieces.push(mk("HH-01", 2 * count, lw)));
    pieces.push(mk("HV-01", 2 * n, leafH));
    const y = P.frameProfileWidth + P.leafHeightClearance / 2;
    leaves.forEach((l) => {
      glass.push({
        x: l.x + P.leafProfileWidth - bite,
        y: y + P.leafProfileWidth - bite,
        w: l.width - 2 * P.leafProfileWidth + 2 * bite,
        h: leafH - 2 * P.leafProfileWidth + 2 * bite,
      });
    });
  }

  const pieceCount = pieces.reduce((s, p) => s + p.qty, 0);
  const aluminumMeters = pieces.reduce((s, p) => s + (p.qty * p.length) / 1000, 0);
  const aluminumWeight = pieces.reduce((s, p) => s + p.totalWeight, 0);
  const glassArea = glass.reduce((s, g) => s + (g.w * g.h) / 1e6, 0);
  const glassWeight = glassArea * c.glassThickness * P.glassDensity;

  return {
    pieces,
    leaves,
    glass,
    pieceCount,
    aluminumMeters: round(aluminumMeters),
    aluminumWeight: round(aluminumWeight),
    glassArea: round(glassArea, 3),
    glassWeight: round(glassWeight),
    totalWeight: round(aluminumWeight + glassWeight),
  };
}
