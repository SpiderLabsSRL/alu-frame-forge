import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  calculate, validate, DEFAULT_CONFIG, DEMO_PARAMS, GLASS_TYPES, MODELS, PROFILES,
  type CalcResult, type WindowConfig, type ModelId, type Distribution,
} from "@/lib/aluvi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALUVI · Diseñador y calculadora de ventanas" },
      { name: "description", content: "Demo para diseñar ventanas de aluminio y calcular despiece, materiales y peso estimado." },
      { property: "og:title", content: "ALUVI · Diseñador de ventanas" },
      { property: "og:description", content: "Configura, visualiza y calcula ventanas de aluminio en una sola pantalla." },
    ],
  }),
  component: Index,
});

const EMPTY: WindowConfig = { ...DEFAULT_CONFIG, width: 0, height: 0, glassThickness: 0 };
const fmt = (n: number, d = 2) => n.toLocaleString("es-BO", { minimumFractionDigits: d, maximumFractionDigits: d });

function Index() {
  const [cfg, setCfg] = useState<WindowConfig>(DEFAULT_CONFIG);
  const [showDims, setShowDims] = useState(true);
  const [tick, setTick] = useState(0);
  const [lastCalc, setLastCalc] = useState(() => new Date());
  const warnings = validate(cfg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const res = useMemo(() => calculate(cfg), [cfg, tick]);

  const set = <K extends keyof WindowConfig>(k: K, v: WindowConfig[K]) => { setCfg((c) => ({ ...c, [k]: v })); setLastCalc(new Date()); };
  const setModel = (m: ModelId) => { setCfg((c) => ({ ...c, model: m, leaves: MODELS[m].leaves, distribution: "equal" })); setLastCalc(new Date()); };

  return (
    <div className="min-h-screen">
      <header className="no-print flex items-center justify-between border-b border-sidebar-border bg-sidebar px-6 py-3 text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-sm bg-primary font-mono text-sm font-bold text-primary-foreground">AV</div>
          <div>
            <div className="text-sm font-semibold tracking-wide">ALUVI · Diseñador de ventanas</div>
            <div className="text-xs opacity-60">Demo técnica · valores de demostración</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => { setCfg(EMPTY); setLastCalc(new Date()); }}>Nueva ventana</Btn>
          <Btn onClick={() => { setTick((t) => t + 1); setLastCalc(new Date()); }}>Recalcular</Btn>
          <Btn onClick={() => { setCfg(DEFAULT_CONFIG); setShowDims(true); setLastCalc(new Date()); }}>Restablecer</Btn>
          <Btn primary onClick={() => window.print()}>Imprimir ficha</Btn>
        </div>
      </header>

      <div className="no-print border-b border-warning bg-warning-soft px-6 py-2 text-xs text-warning-foreground">
        ⚠ Las fórmulas de corte, pesos por metro y densidad del vidrio son <b>parámetros de demostración</b>. Los resultados son estimaciones hasta introducir las fichas técnicas oficiales de ALUVI.
      </div>

      <main className="no-print grid grid-cols-[300px_1fr_340px] gap-4 p-4">
        {/* Izquierda */}
        <Panel title="Configuración">
          <Field label="Modelo">
            <div className="grid gap-1">
              {(Object.keys(MODELS) as ModelId[]).map((m) => (
                <button key={m} onClick={() => setModel(m)}
                  className={`rounded-sm border px-3 py-2 text-left text-sm transition ${cfg.model === m ? "border-primary bg-accent font-medium text-accent-foreground" : "border-border bg-card hover:bg-muted"}`}>
                  {MODELS[m].label}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ancho (mm)"><NumInput value={cfg.width} onChange={(v) => set("width", v)} /></Field>
            <Field label="Alto (mm)"><NumInput value={cfg.height} onChange={(v) => set("height", v)} /></Field>
          </div>
          <Field label="Cantidad de hojas">
            <select disabled={cfg.model === "fixed"} value={cfg.model === "fixed" ? 1 : cfg.leaves} onChange={(e) => set("leaves", +e.target.value)} className={inputCls}>
              {cfg.model === "fixed" ? <option value={1}>1 (fija)</option> : [2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Distribución de hojas">
            <select disabled={cfg.model === "fixed"} value={cfg.distribution} onChange={(e) => set("distribution", e.target.value as Distribution)} className={inputCls}>
              <option value="equal">Hojas iguales</option>
              <option value="left-wide">Hoja izquierda mayor</option>
              {cfg.leaves >= 3 && <option value="center-wide">Hoja central mayor</option>}
            </select>
          </Field>
          <Field label="Tipo de vidrio">
            <select value={cfg.glassType} onChange={(e) => set("glassType", e.target.value as WindowConfig["glassType"])} className={inputCls}>
              {Object.entries(GLASS_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Espesor del vidrio (mm)">
            <select value={cfg.glassThickness} onChange={(e) => set("glassThickness", +e.target.value)} className={inputCls}>
              <option value={0}>— Seleccionar —</option>
              {[4, 5, 6, 8, 10].map((t) => <option key={t} value={t}>{t} mm</option>)}
            </select>
          </Field>
          <details className="rounded-sm border border-dashed border-warning bg-warning-soft p-3 text-xs text-warning-foreground">
            <summary className="cursor-pointer font-semibold">Parámetros demo</summary>
            <ul className="mt-2 space-y-1 font-mono">
              <li>Marco visto: {DEMO_PARAMS.frameProfileWidth} mm</li>
              <li>Hoja visto: {DEMO_PARAMS.leafProfileWidth} mm</li>
              <li>Solape hojas: {DEMO_PARAMS.leafOverlap} mm</li>
              <li>Holgura vertical: {DEMO_PARAMS.leafHeightClearance} mm</li>
              <li>Inserción vidrio: {DEMO_PARAMS.glassBite} mm/lado</li>
              <li>Vidrio: {DEMO_PARAMS.glassDensity} kg/m²·mm</li>
              {Object.entries(PROFILES).map(([c, p]) => <li key={c}>{c}: {p.kgm} kg/m</li>)}
            </ul>
          </details>
        </Panel>

        {/* Centro */}
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Vista frontal" actions={
            <div className="flex gap-2">
              <Btn small onClick={() => setShowDims((s) => !s)}>{showDims ? "Ocultar cotas" : "Mostrar cotas"}</Btn>
              <Btn small onClick={() => { setCfg(DEFAULT_CONFIG); setLastCalc(new Date()); }}>Restablecer diseño</Btn>
            </div>}>
            <div className="grid h-[440px] place-items-center rounded-sm bg-muted">
              {res ? <WindowSvg cfg={cfg} res={res} showDims={showDims} /> : <Warnings items={warnings} />}
            </div>
          </Panel>
          <Panel title="Tabla de despiece" actions={<span className="text-xs text-muted-foreground">Calculado {lastCalc.toLocaleTimeString("es-BO")}</span>}>
            {res ? <PiecesTable res={res} /> : <Warnings items={warnings} />}
          </Panel>
        </div>

        {/* Derecha */}
        <Panel title="Resumen">
          <Summary cfg={cfg} res={res} warnings={warnings} />
        </Panel>
      </main>

      <PrintSheet cfg={cfg} res={res} warnings={warnings} />
    </div>
  );
}

const inputCls = "w-full rounded-sm border border-input bg-card px-2 py-1.5 font-mono text-sm outline-none focus:border-ring disabled:opacity-50";

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <input type="number" min={0} step={10} value={value || ""} placeholder="—" onChange={(e) => onChange(+e.target.value)} className={inputCls} />;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>{children}</label>;
}
function Btn({ children, onClick, primary, small }: { children: React.ReactNode; onClick: () => void; primary?: boolean; small?: boolean }) {
  return <button onClick={onClick} className={`rounded-sm border font-medium transition ${small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"} ${primary ? "border-primary bg-primary text-primary-foreground hover:opacity-90" : small ? "border-border bg-card text-foreground hover:bg-muted" : "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-primary"}`}>{children}</button>;
}
function Panel({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>{actions}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}
function Warnings({ items }: { items: string[] }) {
  return (
    <div className="rounded-sm border border-warning bg-warning-soft p-3 text-sm text-warning-foreground">
      <div className="font-semibold">Faltan parámetros — no se muestran resultados</div>
      <ul className="mt-1 list-disc pl-5">{items.map((w) => <li key={w}>{w}</li>)}</ul>
    </div>
  );
}

function WindowSvg({ cfg, res, showDims }: { cfg: WindowConfig; res: CalcResult; showDims: boolean }) {
  const { width: W, height: H } = cfg;
  const pad = Math.max(W, H) * 0.12;
  const F = DEMO_PARAMS.frameProfileWidth, L = DEMO_PARAMS.leafProfileWidth;
  const fs = Math.max(W, H) * 0.028;
  const leafY = F + DEMO_PARAMS.leafHeightClearance / 2;
  const leafH = H - 2 * F - DEMO_PARAMS.leafHeightClearance;
  const sw = Math.max(W, H) * 0.0015;
  return (
    <svg viewBox={`${-pad} ${-pad * 0.6} ${W + pad * 1.6} ${H + pad * 1.6}`} className="h-full w-full p-4">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="fill-dim" /></marker>
      </defs>
      {/* Marco */}
      <rect x={0} y={0} width={W} height={H} className="fill-alu stroke-alu-dark" strokeWidth={sw * 2} />
      <rect x={F} y={F} width={W - 2 * F} height={H - 2 * F} className="fill-background stroke-alu-dark" strokeWidth={sw} />
      {/* Vidrios */}
      {res.glass.map((g, i) => <rect key={i} x={g.x + DEMO_PARAMS.glassBite} y={g.y + DEMO_PARAMS.glassBite} width={g.w - 2 * DEMO_PARAMS.glassBite} height={g.h - 2 * DEMO_PARAMS.glassBite} className="fill-glass" />)}
      {/* Hojas */}
      {cfg.model !== "fixed" && res.leaves.map((l, i) => (
        <g key={i}>
          <path d={`M${l.x},${leafY} h${l.width} v${leafH} h${-l.width} z M${l.x + L},${leafY + L} v${leafH - 2 * L} h${l.width - 2 * L} v${-(leafH - 2 * L)} z`} fillRule="evenodd" className="fill-alu stroke-alu-dark" strokeWidth={sw} opacity={i % 2 ? 1 : 0.92} />
          <line x1={l.x + l.width * 0.3} x2={l.x + l.width * 0.7} y1={leafY + leafH / 2} y2={leafY + leafH / 2} className="stroke-alu-dark" strokeWidth={sw * 1.5} markerEnd="url(#arr)" markerStart="url(#arr)" opacity={0.5} />
          <text x={l.x + l.width / 2} y={leafY + L + fs * 1.4} textAnchor="middle" fontSize={fs * 0.8} className="fill-alu-dark font-mono">H{i + 1}</text>
        </g>
      ))}
      {cfg.model === "fixed" && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={fs} className="fill-alu-dark font-mono">FIJO</text>}
      {showDims && (
        <g className="font-mono" fontSize={fs}>
          <line x1={0} x2={W} y1={H + pad * 0.5} y2={H + pad * 0.5} className="stroke-dim" strokeWidth={sw} markerStart="url(#arr)" markerEnd="url(#arr)" />
          <line x1={0} x2={0} y1={H + pad * 0.1} y2={H + pad * 0.6} className="stroke-dim" strokeWidth={sw} />
          <line x1={W} x2={W} y1={H + pad * 0.1} y2={H + pad * 0.6} className="stroke-dim" strokeWidth={sw} />
          <text x={W / 2} y={H + pad * 0.5 - fs * 0.4} textAnchor="middle" className="fill-dim">{W} mm</text>
          <line x1={-pad * 0.5} x2={-pad * 0.5} y1={0} y2={H} className="stroke-dim" strokeWidth={sw} markerStart="url(#arr)" markerEnd="url(#arr)" />
          <line x1={-pad * 0.6} x2={-pad * 0.1} y1={0} y2={0} className="stroke-dim" strokeWidth={sw} />
          <line x1={-pad * 0.6} x2={-pad * 0.1} y1={H} y2={H} className="stroke-dim" strokeWidth={sw} />
          <text x={-pad * 0.5 - fs * 0.4} y={H / 2} textAnchor="middle" transform={`rotate(-90 ${-pad * 0.5 - fs * 0.4} ${H / 2})`} className="fill-dim">{H} mm</text>
          {cfg.model !== "fixed" && res.leaves.map((l, i) => (
            <text key={i} x={l.x + l.width / 2} y={-pad * 0.2} textAnchor="middle" fontSize={fs * 0.75} className="fill-muted-foreground">{fmt(l.width, 0)}</text>
          ))}
        </g>
      )}
    </svg>
  );
}

function PiecesTable({ res }: { res: CalcResult }) {
  return (
    <table className="w-full text-sm [&_td]:px-2 [&_th]:px-2">
      <thead>
        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
          <th className="py-2">Código</th><th>Nombre</th><th className="text-right">Cant.</th><th className="text-right">Long. corte (mm)</th><th className="text-right">kg/m</th><th className="text-right">Peso unit. (kg)</th><th className="text-right">Peso total (kg)</th>
        </tr>
      </thead>
      <tbody className="font-mono">
        {res.pieces.map((p, i) => (
          <tr key={i} className="border-b border-border/60">
            <td className="py-1.5 text-primary">{p.code}</td><td className="font-sans">{p.name}</td><td className="text-right">{p.qty}</td><td className="text-right">{fmt(p.length, 1)}</td><td className="text-right text-warning-foreground">{fmt(p.kgm)}*</td><td className="text-right">{fmt(p.unitWeight, 3)}</td><td className="text-right font-medium">{fmt(p.totalWeight, 3)}</td>
          </tr>
        ))}
        <tr className="font-semibold"><td className="py-2" colSpan={2}>Total aluminio</td><td className="text-right">{res.pieceCount}</td><td className="text-right">{fmt(res.aluminumMeters)} m</td><td /><td /><td className="text-right">{fmt(res.aluminumWeight)}</td></tr>
      </tbody>
      <tfoot><tr><td colSpan={7} className="pt-2 text-xs text-muted-foreground">* Peso por metro de demostración. Peso total = cantidad × longitud (m) × kg/m.</td></tr></tfoot>
    </table>
  );
}

function Summary({ cfg, res, warnings }: { cfg: WindowConfig; res: CalcResult | null; warnings: string[] }) {
  const Row = ({ label, value, est }: { label: string; value: string; est?: boolean }) => (
    <div className={`flex items-baseline justify-between rounded-sm px-3 py-2 ${est ? "border border-dashed border-warning bg-warning-soft" : "bg-muted"}`}>
      <span className="text-xs text-muted-foreground">{label}{est && <span className="ml-1 rounded-sm bg-warning px-1 text-[10px] font-semibold text-warning-foreground">EST.</span>}</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{MODELS[cfg.model].label} · {GLASS_TYPES[cfg.glassType]}</div>
      <Row label="Ancho total" value={cfg.width ? `${cfg.width} mm` : "—"} />
      <Row label="Alto total" value={cfg.height ? `${cfg.height} mm` : "—"} />
      {res ? <>
        <Row label="Cantidad de piezas" value={`${res.pieceCount}`} />
        <Row label="Metros lineales aluminio" value={`${fmt(res.aluminumMeters)} m`} />
        <Row label="Superficie de vidrio" value={`${fmt(res.glassArea, 3)} m²`} />
        <Row label="Peso aluminio" value={`${fmt(res.aluminumWeight)} kg`} est />
        <Row label="Peso vidrio" value={`${fmt(res.glassWeight)} kg`} est />
        <div className="mt-3 rounded-sm border-2 border-dashed border-warning bg-warning-soft p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-warning-foreground">Peso total estimado</div>
          <div className="font-mono text-3xl font-bold">{fmt(res.totalWeight)} kg</div>
        </div>
      </> : <Warnings items={warnings} />}
      <div className="flex gap-3 pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-muted" />Calculado geométricamente</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm border border-dashed border-warning bg-warning-soft" />Estimación demo</span>
      </div>
    </div>
  );
}

function PrintSheet({ cfg, res, warnings }: { cfg: WindowConfig; res: CalcResult | null; warnings: string[] }) {
  return (
    <div className="print-only p-6">
      <h1 className="text-xl font-bold">ALUVI · Ficha de ventana</h1>
      <p className="text-xs">{new Date().toLocaleString("es-BO")} · DOCUMENTO DE DEMOSTRACIÓN — medidas y pesos estimados con parámetros de ejemplo, no válidos para fabricación.</p>
      <p className="mt-2 text-sm">{MODELS[cfg.model].label} · {cfg.width} × {cfg.height} mm · {cfg.model === "fixed" ? 1 : cfg.leaves} hoja(s) · {GLASS_TYPES[cfg.glassType]} {cfg.glassThickness} mm</p>
      {res ? <>
        <div className="my-4 h-[340px]"><WindowSvg cfg={cfg} res={res} showDims /></div>
        <PiecesTable res={res} />
        <p className="mt-3 text-sm">Vidrio: {fmt(res.glassArea, 3)} m² · {fmt(res.glassWeight)} kg (est.) — Aluminio: {fmt(res.aluminumWeight)} kg (est.) — <b>Total estimado: {fmt(res.totalWeight)} kg</b></p>
      </> : <Warnings items={warnings} />}
    </div>
  );
}
