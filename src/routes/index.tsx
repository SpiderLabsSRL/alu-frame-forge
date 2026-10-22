import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  calculate, validate, DEFAULT_CONFIG, DEFAULT_TECH, ALUVI_REF_SIZE, cutLength, DEMO_PARAMS, GLASS_TYPES, MODELS, PROFILES,
  type CalcResult, type TechParams, type Base, type WindowConfig, type ModelId, type Distribution,
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
  const [form, setForm] = useState({ leaves: 2, width: 2000, height: 2000 });
  const [cfg, setCfg] = useState<WindowConfig>(DEFAULT_CONFIG);
  const [genAt, setGenAt] = useState(() => new Date());
  const tech = DEFAULT_TECH;
  const supported = cfg.leaves === 2;
  const warnings = supported ? validate(cfg) : [`No hay reglas técnicas documentadas para ${cfg.leaves} hojas. Pendiente de validación: solo está disponible el modelo de 2 hojas del documento ALUVI.`];
  const res = useMemo(() => (supported ? calculate(cfg, tech) : null), [cfg, supported, tech]);
  const generate = () => { setCfg({ ...DEFAULT_CONFIG, leaves: form.leaves, width: form.width, height: form.height }); setGenAt(new Date()); };

  return (
    <div className="min-h-screen">
      <header className="no-print flex items-center justify-between border-b border-sidebar-border bg-sidebar px-6 py-3 text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-sm bg-primary font-mono text-sm font-bold text-primary-foreground">AV</div>
          <div>
            <div className="text-sm font-semibold tracking-wide">ALUVI · Diseñador de ventanas</div>
            <div className="text-xs opacity-60">Prototipo técnico pendiente de validación</div>
          </div>
        </div>
        <Btn primary onClick={() => window.print()}>Imprimir / Guardar PDF</Btn>
      </header>

      <div className="no-print border-b border-warning bg-warning-soft px-6 py-2 text-xs text-warning-foreground">
        ⚠ <b>Prototipo técnico pendiente de validación.</b> Descuentos, cantidades y pesos por metro tomados del documento técnico ALUVI (corrediza 2 hojas). Confirmar antes de fabricar.
      </div>

      <main className="no-print grid grid-cols-[280px_1fr_340px] gap-4 p-4">
        <Panel title="Datos de la ventana">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); generate(); }}>
            <Field label="Cantidad de hojas">
              <select value={form.leaves} onChange={(e) => setForm({ ...form, leaves: +e.target.value })} className={inputCls}>
                <option value={2}>2 hojas (documentado)</option>
                <option value={3}>3 hojas (pendiente)</option>
                <option value={4}>4 hojas (pendiente)</option>
              </select>
            </Field>
            <Field label="Ancho (mm)"><NumInput value={form.width} onChange={(v) => setForm({ ...form, width: v })} /></Field>
            <Field label="Alto (mm)"><NumInput value={form.height} onChange={(v) => setForm({ ...form, height: v })} /></Field>
            <button type="submit" className="w-full rounded-sm border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Generar ventana</button>
          </form>
          <p className="text-xs text-muted-foreground">Generado {genAt.toLocaleTimeString("es-BO")} · {cfg.leaves} hojas · {cfg.width} × {cfg.height} mm</p>
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Plano técnico">
            <div className="grid h-[440px] place-items-center rounded-sm bg-muted">
              {res ? <WindowSvg cfg={cfg} res={res} showDims /> : <Warnings items={warnings} />}
            </div>
          </Panel>
          <Panel title="Lista de cortes, vidrios y accesorios">
            {res ? <><PiecesTable res={res} /><AccessoriesTable tech={tech} cfg={cfg} /></> : <Warnings items={warnings} />}
          </Panel>
        </div>

        <Panel title="Resumen">
          <Summary cfg={cfg} res={res} warnings={warnings} />
        </Panel>
      </main>

      <PrintSheet cfg={cfg} res={res} warnings={warnings} tech={tech} />
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
  const isA = cfg.model === "aluvi2";
  const F = isA ? 30 : DEMO_PARAMS.frameProfileWidth, L = isA ? 50 : DEMO_PARAMS.leafProfileWidth;
  const bite = isA ? 0 : DEMO_PARAMS.glassBite;
  const fs = Math.max(W, H) * 0.028;
  const leafY = isA ? F : F + DEMO_PARAMS.leafHeightClearance / 2;
  const leafH = isA ? H - 2 * F : H - 2 * F - DEMO_PARAMS.leafHeightClearance;
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
      {res.glass.map((g, i) => <rect key={i} x={g.x + bite} y={g.y + bite} width={g.w - 2 * bite} height={g.h - 2 * bite} className="fill-glass" />)}
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
          {isA && res.glass.map((g, i) => (
            <text key={"g" + i} x={g.x + g.w / 2} y={g.y + g.h * 0.62} textAnchor="middle" fontSize={fs * 0.7} className="fill-alu-dark">Vidrio {fmt(g.w, 0)} × {fmt(g.h, 0)}</text>
          ))}
          {isA && <text x={W / 2} y={-pad * 0.2} textAnchor="middle" fontSize={fs * 0.75} className="fill-muted-foreground">Cabezal {fmt(W / 2 - 68, 0)} c/u (L/2 − 68)</text>}
          {!isA && cfg.model !== "fixed" && res.leaves.map((l, i) => (
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
            <td className="py-1.5 text-primary">{p.code}</td><td className="font-sans">{p.name}</td><td className="text-right">{p.qty}</td><td className="text-right">{fmt(p.length, 1)}</td><td className="text-right text-warning-foreground">{fmt(p.kgm, 3)}*</td><td className="text-right">{fmt(p.unitWeight, 3)}</td><td className="text-right font-medium">{fmt(p.totalWeight, 3)}</td>
          </tr>
        ))}
        {res.glassCuts?.map((g, i) => (
          <tr key={"v" + i} className="border-b border-border/60 bg-muted/40">
            <td className="py-1.5 text-primary">VID</td><td className="font-sans">Vidrio (ancho × alto)</td><td className="text-right">{g.qty}</td><td className="text-right">{fmt(g.w, 0)} × {fmt(g.h, 0)}</td><td /><td /><td className="text-right text-muted-foreground">ver resumen</td>
          </tr>
        ))}
        <tr className="font-semibold"><td className="py-2" colSpan={2}>Total aluminio</td><td className="text-right">{res.pieceCount}</td><td className="text-right">{fmt(res.aluminumMeters)} m</td><td /><td /><td className="text-right">{fmt(res.aluminumWeight)}</td></tr>
      </tbody>
      <tfoot><tr><td colSpan={7} className="pt-2 text-xs text-muted-foreground">{res.glassCuts ? "* Peso por metro según documento técnico ALUVI (pendiente de validación)." : "* Peso por metro de demostración."} Peso total = cantidad × longitud (m) × kg/m.{res.pending?.map((m) => <div key={m} className="text-warning-foreground">⚠ {m}</div>)}</td></tr></tfoot>
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
      <div className="text-sm font-medium">{MODELS[cfg.model].label}</div>
      <Row label="Ancho total" value={cfg.width ? `${cfg.width} mm` : "—"} />
      <Row label="Alto total" value={cfg.height ? `${cfg.height} mm` : "—"} />
      {res ? <>
        <Row label="Cantidad de piezas" value={`${res.pieceCount}`} />
        <Row label="Metros lineales aluminio" value={`${fmt(res.aluminumMeters)} m`} />
        {res.glassCuts?.map((g, i) => <Row key={i} label="Vidrios" value={`${g.qty} × ${fmt(g.w, 0)}×${fmt(g.h, 0)} mm`} />)}
        <Row label="Superficie de vidrio" value={`${fmt(res.glassArea, 3)} m²`} />
        <Row label="Peso aluminio" value={`${fmt(res.aluminumWeight)} kg`} est />
        <Row label="Peso vidrio" value="Pendiente de validación" />
      </> : <Warnings items={warnings} />}
      <div className="flex gap-3 pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-muted" />Calculado geométricamente</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm border border-dashed border-warning bg-warning-soft" />Estimación demo</span>
      </div>
    </div>
  );
}

function PrintSheet({ cfg, res, warnings, tech }: { cfg: WindowConfig; res: CalcResult | null; warnings: string[]; tech: TechParams }) {
  const PrintAccessories = ({ cfg }: { cfg: WindowConfig }) => <AccessoriesTable tech={tech} cfg={cfg} />;
  return (
    <div className="print-only p-6">
      <h1 className="text-xl font-bold">ALUVI · Ficha de ventana</h1>
      <p className="text-xs">{new Date().toLocaleString("es-BO")} · PROTOTIPO TÉCNICO PENDIENTE DE VALIDACIÓN — confirmar fórmulas antes de fabricar.</p>
      <p className="mt-2 text-sm">{MODELS[cfg.model].label}{cfg.model === "aluvi2" && " (PROTOTIPO TÉCNICO PENDIENTE DE VALIDACIÓN)"} · {cfg.width} × {cfg.height} mm · {cfg.leaves} hojas</p>
      {res ? <>
        <div className="my-4 h-[340px]"><WindowSvg cfg={cfg} res={res} showDims /></div>
        <PiecesTable res={res} />
        {cfg.model === "aluvi2" && <PrintAccessories cfg={cfg} />}
        <p className="mt-3 text-sm">Vidrio: {fmt(res.glassArea, 3)} m² (peso pendiente de validación) — <b>Peso aluminio: {fmt(res.aluminumWeight)} kg</b></p>
      </> : <Warnings items={warnings} />}
    </div>
  );
}

const isRef = (c: WindowConfig) => c.width === ALUVI_REF_SIZE.width && c.height === ALUVI_REF_SIZE.height;

function AccessoriesTable({ tech, cfg }: { tech: TechParams; cfg: WindowConfig }) {
  const ref = isRef(cfg);
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Accesorios (referencia)</div>
      <table className="w-full text-sm [&_td]:px-2 [&_th]:px-2">
        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="py-1.5">Accesorio</th><th className="text-right">Cant. ref. 2000×2000</th><th>Unidad</th><th>Para esta medida</th></tr></thead>
        <tbody>
          {tech.accessories.map((a, i) => (
            <tr key={i} className="border-b border-border/60">
              <td className="py-1.5">{a.name}{a.note && <span className="text-muted-foreground"> · {a.note}</span>}</td>
              <td className="text-right font-mono">{a.qty ?? "—"}</td><td>{a.unit}</td>
              <td className={ref ? "" : "text-warning-foreground"}>{ref && a.qty != null ? `${a.qty} ${a.unit}` : "Pendiente de confirmar"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-muted-foreground">Cantidades del documento técnico para 2000 × 2000 mm. No se extrapolan a otras medidas.</p>
    </div>
  );
}

function TechEditor({ tech, setTech, cfg }: { tech: TechParams; setTech: (t: TechParams) => void; cfg: WindowConfig }) {
  const cell = "w-full rounded-sm border border-input bg-card px-1.5 py-1 font-mono text-xs outline-none focus:border-ring";
  const num = (v: string) => (v === "" ? null : +v);
  const upP = (i: number, patch: Partial<TechParams["profiles"][number]>) => setTech({ ...tech, profiles: tech.profiles.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const upA = (i: number, patch: Partial<TechParams["accessories"][number]>) => setTech({ ...tech, accessories: tech.accessories.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const g = tech.glass;
  return (
    <Panel title="Parámetros técnicos editables · prototipo" actions={<Btn small onClick={() => setTech(DEFAULT_TECH)}>Valores del documento</Btn>}>
      <table className="w-full text-sm [&_td]:px-1 [&_th]:px-1">
        <thead><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground"><th>Código</th><th>Perfil</th><th>kg/m</th><th>Cant.</th><th>Base</th><th>Descuento (mm)</th><th className="text-right">Corte actual</th></tr></thead>
        <tbody>
          {tech.profiles.map((p, i) => (
            <tr key={p.code}>
              <td className="font-mono text-primary">{p.code}</td><td className="text-xs">{p.name}</td>
              <td><input type="number" step={0.001} className={cell} value={p.kgm} onChange={(e) => upP(i, { kgm: +e.target.value })} /></td>
              <td><input type="number" min={0} className={cell} value={p.qty ?? ""} placeholder="?" onChange={(e) => upP(i, { qty: num(e.target.value) })} /></td>
              <td><select className={cell} value={p.base} onChange={(e) => upP(i, { base: e.target.value as Base })}><option>L</option><option>H</option><option>L/2</option></select></td>
              <td><input type="number" className={cell} value={p.offset} onChange={(e) => upP(i, { offset: +e.target.value })} /></td>
              <td className="text-right font-mono text-xs">{p.base} {p.offset >= 0 ? "+" : "−"} {Math.abs(p.offset)} = {fmt(cutLength(p, cfg.width, cfg.height), 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-4 gap-2 text-xs">
        <Field label="Vidrios (cant.)"><input type="number" min={1} max={2} className={cell} value={g.qty} onChange={(e) => setTech({ ...tech, glass: { ...g, qty: +e.target.value } })} /></Field>
        <Field label="Ancho: L ÷"><input type="number" min={1} className={cell} value={g.widthDivisor} onChange={(e) => setTech({ ...tech, glass: { ...g, widthDivisor: +e.target.value || 1 } })} /></Field>
        <Field label="Ancho: descuento"><input type="number" className={cell} value={g.widthOffset} onChange={(e) => setTech({ ...tech, glass: { ...g, widthOffset: +e.target.value } })} /></Field>
        <Field label="Alto: H descuento"><input type="number" className={cell} value={g.heightOffset} onChange={(e) => setTech({ ...tech, glass: { ...g, heightOffset: +e.target.value } })} /></Field>
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Accesorios de referencia</div>
        <div className="grid gap-1">
          {tech.accessories.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_1fr] gap-1">
              <input className={cell} value={a.name} onChange={(e) => upA(i, { name: e.target.value })} />
              <input type="number" className={cell} value={a.qty ?? ""} placeholder="?" onChange={(e) => upA(i, { qty: num(e.target.value) })} />
              <input className={cell} value={a.unit} onChange={(e) => upA(i, { unit: e.target.value })} />
              <input className={cell} value={a.note ?? ""} placeholder="Nota" onChange={(e) => upA(i, { note: e.target.value })} />
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-warning-foreground">Deja una cantidad vacía si no está confirmada: se mostrará como pendiente en vez de un resultado definitivo.</p>
    </Panel>
  );
}
