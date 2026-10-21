import { describe, it, expect } from "vitest";
import { calculate, DEFAULT_CONFIG } from "./aluvi";

describe("calculate", () => {
  it("peso = cantidad × longitud(m) × kg/m para el marco horizontal", () => {
    const r = calculate(DEFAULT_CONFIG)!;
    const mh = r.pieces.find((p) => p.code === "MH-01")!;
    expect(mh.qty).toBe(2);
    expect(mh.length).toBe(1500);
    expect(mh.totalWeight).toBeCloseTo(2 * 1.5 * 0.62, 3);
  });
  it("devuelve null si faltan parámetros", () => {
    expect(calculate({ ...DEFAULT_CONFIG, glassThickness: 0 })).toBeNull();
  });
});
