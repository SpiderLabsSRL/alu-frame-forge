import { describe, it, expect } from "vitest";
import { calculate, DEFAULT_CONFIG, type WindowConfig } from "./aluvi";

const demo: WindowConfig = { ...DEFAULT_CONFIG, model: "sliding2", width: 1500, height: 1200 };

describe("calculate (demo)", () => {
  it("peso = cantidad × longitud(m) × kg/m para el marco horizontal", () => {
    const mh = calculate(demo)!.pieces.find((p) => p.code === "MH-01")!;
    expect(mh.qty).toBe(2);
    expect(mh.totalWeight).toBeCloseTo(2 * 1.5 * 0.62, 3);
  });
  it("devuelve null si faltan parámetros", () => {
    expect(calculate({ ...DEFAULT_CONFIG, glassThickness: 0 })).toBeNull();
  });
});

describe("modelo ALUVI 2 hojas 2000×2000", () => {
  const r = calculate(DEFAULT_CONFIG)!;
  const len = (c: string) => r.pieces.find((p) => p.code === c)!.length;
  it("vidrios: 2 de 920 × 1843 mm", () => {
    expect(r.glassCuts).toEqual([{ qty: 2, w: 920, h: 1843 }]);
  });
  it("rieles L-30 = 1970", () => { expect(len("7621")).toBe(1970); expect(len("7622")).toBe(1970); });
  it("jamba H = 2000", () => expect(len("7623")).toBe(2000));
  it("cabezal y zócalos L/2-68 = 932", () => { expect(len("7624")).toBe(932); expect(len("7625A")).toBe(932); });
  it("pierna y enganche H-71 = 1929", () => { expect(len("7626")).toBe(1929); expect(len("7627")).toBe(1929); });
  it("peso riel superior = 1 × 1,970 × 1,038", () => {
    expect(r.pieces.find((p) => p.code === "7621")!.totalWeight).toBeCloseTo(1.97 * 1.038, 3);
  });
});
