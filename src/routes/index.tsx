import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  calculate, validate, DEFAULT_CONFIG, ALUVI_REF_SIZE,
  type CalcResult, type TechParams, type WindowConfig, MODELS,
} from "@/lib/aluvi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALUVI · Diseñador y calculadora de ventanas" },
      { name: "description", content: "Diseñador y calculadora de ventanas de aluminio." },
    ],
  }),
  component: Index,
});

// ============================================================================
// CONFIGURACIONES TÉCNICAS POR CANTIDAD DE HOJAS
// ============================================================================
const TECH_2_HOJAS: TechParams = {
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

const TECH_3_HOJAS: TechParams = {
  profiles: [
    { code: "7621", name: "Riel superior", kgm: 1.038, qty: 1, base: "L", offset: -30 },
    { code: "7622", name: "Riel inferior", kgm: 1.018, qty: 1, base: "L", offset: -30 },
    { code: "7623", name: "Jamba", kgm: 0.551, qty: 2, base: "H", offset: 0 },
    { code: "7624", name: "Cabezal", kgm: 0.525, qty: 2, base: "L/3" as any, offset: -55 }, 
    { code: "7625", name: "Zócalo pequeño sup", kgm: 0.558, qty: 2, base: "L/3" as any, offset: -55 },
    { code: "7625A", name: "Zócalo grande inf", kgm: 0.842, qty: 1, base: "L/3" as any, offset: -48 },
    { code: "7626", name: "Pierna", kgm: 0.615, qty: 2, base: "H", offset: -56 },
    { code: "7627", name: "Enganche", kgm: 0.64, qty: 2, base: "H", offset: -56 },
  ],
  glass: { qty: 3, widthDivisor: 3, widthOffset: -66, heightOffset: -157 }, 
  accessories: [
    { name: "Felpa", qty: 34, unit: "m" },
    { name: "Silicona", qty: 40, unit: "m/l", note: "4 tubos" },
    { name: "Ruedas", qty: 4, unit: "pieza" },
    { name: "Canoa", qty: 2, unit: "pieza" },
    { name: "Guías", qty: 12, unit: "pieza" },
    { name: "Tornillo 8x0,5", qty: 12, unit: "pieza" },
  ],
};

const TECH_4_HOJAS: TechParams = {
  profiles: [
    { code: "7621", name: "Riel superior", kgm: 1.038, qty: 1, base: "L", offset: -30 },
    { code: "7622", name: "Riel inferior", kgm: 1.018, qty: 1, base: "L", offset: -30 },
    { code: "7623", name: "Jamba", kgm: 0.551, qty: 2, base: "H", offset: 0 },
    { code: "7624", name: "Cabezal", kgm: 0.525, qty: 4, base: "L/4" as any, offset: -60 }, 
    { code: "7625", name: "Zócalo pequeño sup", kgm: 0.558, qty: 2, base: "L/4" as any, offset: -60 },
    { code: "7625A", name: "Zócalo grande inf", kgm: 0.842, qty: 2, base: "L/4" as any, offset: -60 },
    { code: "7626", name: "Pierna", kgm: 0.615, qty: 2, base: "H", offset: -56 },
    { code: "7628", name: "Encuentro", kgm: 0.377, qty: 1, base: "H", offset: -71 },
    { code: "7627", name: "Enganche", kgm: 0.64, qty: 2, base: "H", offset: -56 },
  ],
  glass: { qty: 4, widthDivisor: 4, widthOffset: -72, heightOffset: -157 }, 
  accessories: [
    { name: "Felpa", qty: 39, unit: "m" },
    { name: "Silicona", qty: 50, unit: "m/l", note: "5 tubos" },
    { name: "Ruedas", qty: 4, unit: "pieza" },
    { name: "Canoa", qty: 2, unit: "pieza" },
    { name: "Guías", qty: 16, unit: "pieza" },
    { name: "Tornillo 8x0,5", qty: 16, unit: "pieza" },
  ],
};

const fmt = (n: number, d = 2) => n.toLocaleString("es-BO", { minimumFractionDigits: d, maximumFractionDigits: d });

function Index() {
  const [form, setForm] = useState({ leaves: 2, width: 2000, height: 2000 });
  const [cfg, setCfg] = useState<WindowConfig>(DEFAULT_CONFIG);

  let currentTech = TECH_2_HOJAS;
  if (form.leaves === 3) currentTech = TECH_3_HOJAS;
  if (form.leaves === 4) currentTech = TECH_4_HOJAS;
  
  const supported = cfg.leaves >= 2 && cfg.leaves <= 4;
  const warnings = supported ? validate(cfg) : [`No hay reglas técnicas documentadas para ${cfg.leaves} hojas.`];
  
  const res = useMemo(() => {
    if (!supported) return null;
    return calculate(cfg, currentTech);
  }, [cfg, supported, currentTech]);

  const updateForm = (next: typeof form) => { 
    setForm(next); 
    setCfg({ ...DEFAULT_CONFIG, leaves: next.leaves, width: next.width, height: next.height }); 
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded bg-slate-800 font-mono text-[10px] font-bold text-white">AV</div>
          <div>
            <div className="text-xs font-bold tracking-tight">ALUVI</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Diseñador técnico</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn primary small onClick={() => window.print()}>Imprimir PDF</Btn>
        </div>
      </header>

      <main className="no-print grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-3 p-3 max-w-[1400px] mx-auto items-start">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="flex flex-col gap-3">
          <Panel title="Configuración">
            <div className="space-y-3">
              <Field label="Cantidad de hojas">
                <select value={form.leaves} onChange={(e) => updateForm({ ...form, leaves: +e.target.value })} className={inputCls}>
                  <option value={2}>2 hojas</option>
                  <option value={3}>3 hojas</option>
                  <option value={4}>4 hojas</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Ancho (mm)"><NumInput value={form.width} onChange={(v) => updateForm({ ...form, width: v })} /></Field>
                <Field label="Alto (mm)"><NumInput value={form.height} onChange={(v) => updateForm({ ...form, height: v })} /></Field>
              </div>
            </div>
          </Panel>
          
          <Panel title="Accesorios">
             <AccessoriesTable tech={currentTech} cfg={cfg} />
          </Panel>

          <Panel title="Resumen">
            <Summary cfg={cfg} res={res} warnings={warnings} />
          </Panel>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="flex flex-col gap-3 min-w-0">
          <Panel title="Plano técnico" noPadding>
            <div className="bg-white p-2 flex justify-center items-center min-h-[300px] border-b border-slate-100">
              {validate(cfg).length === 0 ? (
                <PlanoImagen cfg={cfg} />
              ) : (
                <div className="p-2 w-full"><Warnings items={warnings} /></div>
              )}
            </div>
          </Panel>

          <Panel title="Despiece y cortes" noPadding>
            {res ? (
              <UnifiedTable res={res} tech={currentTech} />
            ) : <div className="p-3"><Warnings items={warnings} /></div>}
          </Panel>
        </div>

      </main>

      <PrintSheet cfg={cfg} res={res} warnings={warnings} tech={currentTech} />
    </div>
  );
}

// ============================================================================
// COMPONENTES UI
// ============================================================================
const inputCls = "w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-[11px] outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20";

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <input type="number" min={0} step={10} value={value || ""} placeholder="—" onChange={(e) => onChange(+e.target.value)} className={inputCls} />;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}
function Btn({ children, onClick, primary, small }: { children: React.ReactNode; onClick: () => void; primary?: boolean; small?: boolean }) {
  return <Button onClick={onClick} size={small ? "sm" : "default"} className={`rounded text-xs transition ${primary ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white border text-slate-800 hover:bg-slate-50"}`}>{children}</Button>;
}
function Panel({ title, children, noPadding }: { title: string; children: React.ReactNode; noPadding?: boolean }) {
  return (
    <section className="rounded border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-2.5 py-1.5">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{title}</h2>
      </div>
      <div className={noPadding ? "" : "p-2.5"}>{children}</div>
    </section>
  );
}
function Warnings({ items }: { items: string[] }) {
  return (
    <div className="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
      <div className="font-semibold mb-1">Faltan parámetros:</div>
      <ul className="list-disc pl-4 space-y-0.5">{items.map((w) => <li key={w}>{w}</li>)}</ul>
    </div>
  );
}

// ============================================================================
// IMAGEN DEL PLANO
// ============================================================================
function PlanoImagen({ cfg }: { cfg: WindowConfig }) {
  let fileName = `${cfg.width}x${cfg.height}.png`;
  if (cfg.leaves === 3) fileName = `${cfg.width}x${cfg.height}_3hojas.png`;
  if (cfg.leaves === 4) fileName = `${cfg.width}x${cfg.height}_4hojas.png`;
  
  return (
    <div className="w-full flex justify-center">
      <img 
        src={`/planos/${fileName}`} 
        alt={`Plano ${fileName}`}
        className="max-w-full max-h-[380px] object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const errorMsg = document.createElement('div');
            errorMsg.className = "text-center p-4 text-[11px] text-amber-600";
            errorMsg.innerHTML = `<p>Plano no encontrado</p><p class="font-mono bg-amber-50 px-1 py-0.5 mt-1 rounded">public/planos/${fileName}</p>`;
            parent.appendChild(errorMsg);
          }
        }}
      />
    </div>
  );
}

// ============================================================================
// TABLA UNIFICADA
// ============================================================================
function UnifiedTable({ res, tech }: { res: CalcResult; tech: TechParams }) {
  return (
    <div className="w-full overflow-hidden">
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="bg-slate-100 border-b border-slate-200">
          <tr className="text-[10px] uppercase tracking-wider text-slate-500">
            <th className="px-2 py-2 font-bold text-center w-28">Perfil</th>
            <th className="px-2 py-2 font-bold w-[35%]">Descripción</th>
            <th className="px-2 py-2 font-bold text-center w-20">Descuento</th>
            <th className="px-2 py-2 font-bold text-right w-12">Cant</th>
            <th className="px-2 py-2 font-bold text-right w-24">Corte (mm)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {res.pieces.map((p, i) => {
            const profileTech = tech.profiles.find(tp => tp.code === p.code);
            const formula = profileTech ? `${profileTech.base} ${profileTech.offset >= 0 ? "+" : ""}${profileTech.offset}` : "-";

            return (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-1 align-middle">
                  <div className="flex h-14 w-24 mx-auto items-center justify-center bg-white border border-slate-200 rounded shadow-sm p-0.5">
                    <img
                      src={`/profiles/${p.code}.png`}
                      alt={p.code}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><text x="20" y="20" font-size="6" text-anchor="middle" fill="%23ccc">Sin img</text></svg>';
                      }}
                    />
                  </div>
                </td>
                <td className="px-2 py-1 align-middle">
                  <div className="text-[12px] font-mono text-slate-800 font-bold leading-tight">{p.code}</div>
                  <div className="text-[10px] text-slate-500 truncate leading-tight">{p.name}</div>
                </td>
                <td className="px-2 py-1 text-center align-middle font-mono text-[11px] text-slate-600 bg-slate-50/50">
                  {formula}
                </td>
                <td className="px-2 py-1 text-right align-middle font-mono text-[12px] text-slate-700">{p.qty}</td>
                <td className="px-2 py-1 text-right align-middle font-mono text-[13px] font-bold text-slate-800">{fmt(p.length, 0)}</td>
              </tr>
            );
          })}
          
          {res.glassCuts?.map((g, i) => (
            <tr key={"v" + i} className="bg-sky-50/30 hover:bg-sky-50/50">
              <td className="p-1 align-middle">
                <div className="flex h-14 w-24 mx-auto items-center justify-center border border-sky-200 bg-sky-100 rounded shadow-sm">
                  <span className="text-[10px] font-bold text-sky-600">VIDRIO</span>
                </div>
              </td>
              <td className="px-2 py-1 align-middle">
                <div className="text-[12px] font-mono text-sky-700 font-bold leading-tight">Cristal</div>
                <div className="text-[10px] text-slate-500 leading-tight">{g.qty} piezas</div>
              </td>
              <td className="px-2 py-1 text-center align-middle font-mono text-[11px] text-slate-600 bg-slate-50/50">
                 L/{tech.glass.widthDivisor} {tech.glass.widthOffset}
              </td>
              <td className="px-2 py-1 text-right align-middle font-mono text-[12px] text-slate-700">{g.qty}</td>
              <td className="px-2 py-1 text-right align-middle font-mono text-[13px] font-bold text-slate-800">
                {fmt(g.w, 0)}×{fmt(g.h, 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Totales Aluminio</span>
        <span className="font-mono text-[11px] font-bold text-slate-800">{fmt(res.aluminumMeters)} m <span className="text-slate-400 font-normal mx-1">|</span> {fmt(res.aluminumWeight)} kg</span>
      </div>
    </div>
  );
}

// ============================================================================
// RESUMEN Y ACCESORIOS
// ============================================================================
function Summary({ cfg, res, warnings }: { cfg: WindowConfig; res: CalcResult | null; warnings: string[] }) {
  const Row = ({ label, value, est }: { label: string; value: string; est?: boolean }) => (
    <div className={`flex items-center justify-between rounded px-2 py-1.5 mb-1 text-[11px] ${est ? "bg-amber-50 text-amber-900 border border-amber-100" : "bg-slate-50 text-slate-700"}`}>
      <span className="opacity-80">{label} {est && <span className="text-[9px] bg-amber-200 px-1 rounded ml-1">EST</span>}</span>
      <span className="font-mono font-bold text-xs">{value}</span>
    </div>
  );
  
  return (
    <div className="space-y-0.5">
      {res ? (
        <>
          <Row label="Medida" value={`${cfg.width}×${cfg.height}`} />
          <Row label="Piezas totales" value={`${res.pieceCount}`} />
          <Row label="Aluminio" value={`${fmt(res.aluminumMeters)} m`} />
          <Row label="Peso Alum." value={`${fmt(res.aluminumWeight)} kg`} est />
          <Row label="Peso Vidrio" value="Pendiente" />
          <div className="mt-2 pt-2 border-t border-slate-200">
            <Row label="Área Vidrio" value={`${fmt(res.glassArea, 2)} m²`} />
          </div>
        </>
      ) : <Warnings items={warnings} />}
    </div>
  );
}

function AccessoriesTable({ tech, cfg }: { tech: TechParams; cfg: WindowConfig }) {
  const ref = cfg.width === ALUVI_REF_SIZE.width && cfg.height === ALUVI_REF_SIZE.height;
  return (
    <div>
      <table className="w-full text-left border-collapse">
        <thead><tr className="border-b border-slate-200 text-[9px] uppercase text-slate-500"><th className="pb-1">Item</th><th className="pb-1 text-right">Cant</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {tech.accessories.map((a, i) => (
            <tr key={i}>
              <td className="py-1.5 text-[10px] text-slate-600 truncate max-w-[120px]">
                {a.name} {a.note && <span className="text-[9px] opacity-70">({a.note})</span>}
              </td>
              <td className="text-right font-mono text-[10px] font-bold text-slate-800">
                {ref ? `${a.qty} ${a.unit}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!ref && <p className="mt-1.5 text-[9px] text-amber-600 bg-amber-50 p-1.5 rounded">* Solo válido para 2000×2000.</p>}
    </div>
  );
}

// ============================================================================
// IMPRESIÓN
// ============================================================================
function PrintSheet({ cfg, res, warnings, tech }: { cfg: WindowConfig; res: CalcResult | null; warnings: string[]; tech: TechParams }) {
  return (
    <div className="print-only p-8 bg-white max-w-4xl mx-auto">
      <div className="border-b-2 border-slate-800 pb-2 mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ALUVI · Ficha Técnica</h1>
          <p className="text-sm font-semibold text-slate-600">{MODELS[cfg.model].label} · {cfg.leaves} hojas · {cfg.width} × {cfg.height} mm</p>
        </div>
        <p className="text-[10px] text-slate-500 text-right">Generado: {new Date().toLocaleString("es-BO")}<br/>PROTOTIPO TÉCNICO</p>
      </div>

      <h3 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2 uppercase tracking-widest">Plano</h3>
      <div className="mb-6 flex justify-center">
        <PlanoImagen cfg={cfg} />
      </div>

      {res && (
        <>
          <h3 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2 uppercase tracking-widest">Tabla de Despiece y Cortes</h3>
          <div className="mb-6">
            <UnifiedTable res={res} tech={tech} />
          </div>
        </>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2 uppercase tracking-widest">Configuración</h3>
          <div className="text-xs space-y-1">
            <p><strong>Hojas:</strong> {cfg.leaves}</p>
            <p><strong>Ancho:</strong> {cfg.width} mm</p>
            <p><strong>Alto:</strong> {cfg.height} mm</p>
            <p><strong>Modelo:</strong> {MODELS[cfg.model].label}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2 uppercase tracking-widest">Accesorios</h3>
          <AccessoriesTable tech={tech} cfg={cfg} />
        </div>

        <div>
          <h3 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2 uppercase tracking-widest">Resumen</h3>
          {res ? <Summary cfg={cfg} res={res} warnings={warnings} /> : <Warnings items={warnings} />}
        </div>
      </div>
    </div>
  );
}