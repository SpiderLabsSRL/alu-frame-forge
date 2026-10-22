import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
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
// CONFIGURACIONES TÉCNICAS
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

// ============================================================================
// BASE DE DATOS DE KITS
// ============================================================================
type KitItem = { name: string; qty: number; unit: string };
type Kit = { code: string; name: string; price: number; items: KitItem[] };

const KITS_DB: Kit[] = [
  { 
    code: "KIT-2H", 
    name: "Kit Básico 2 Hojas", 
    price: 25.00,
    items: [
      { name: "Felpa", qty: 24, unit: "m" },
      { name: "Silicona", qty: 3, unit: "tubo" },
      { name: "Ruedas", qty: 2, unit: "pieza" },
      { name: "Guías", qty: 8, unit: "pieza" },
    ]
  },
  { 
    code: "KIT-3H", 
    name: "Kit Estándar 3 Hojas", 
    price: 35.00,
    items: [
      { name: "Felpa", qty: 34, unit: "m" },
      { name: "Silicona", qty: 4, unit: "tubo" },
      { name: "Ruedas", qty: 4, unit: "pieza" },
      { name: "Guías", qty: 12, unit: "pieza" },
    ]
  },
  { 
    code: "KIT-4H", 
    name: "Kit Completo 4 Hojas (Alta gama)", 
    price: 45.00,
    items: [
      { name: "Felpa", qty: 39, unit: "m" },
      { name: "Silicona", qty: 5, unit: "tubo" },
      { name: "Ruedas", qty: 4, unit: "pieza" },
      { name: "Guías", qty: 16, unit: "pieza" },
    ]
  },
  { 
    code: "KIT-FIJO", 
    name: "Kit Ventana Fija (Sin ruedas)", 
    price: 10.00,
    items: [
      { name: "Felpa", qty: 12, unit: "m" },
      { name: "Silicona", qty: 2, unit: "tubo" },
    ]
  },
];

const fmt = (n: number, d = 2) => n.toLocaleString("es-BO", { minimumFractionDigits: d, maximumFractionDigits: d });

function Index() {
  // Estados del Formulario
  const [formWidth, setFormWidth] = useState<number | "">("");
  const [formHeight, setFormHeight] = useState<number | "">("");
  const [formLeaves, setFormLeaves] = useState<number | "">("");
  const [formSlidingLeaves, setFormSlidingLeaves] = useState<number | "">("");
  
  // Estado para mostrar errores
  const [formError, setFormError] = useState<string | null>(null);

  // Estados de la ventana generada
  const [generated, setGenerated] = useState(false);
  const [cfg, setCfg] = useState<WindowConfig>(DEFAULT_CONFIG);

  // Estados de Cotización
  const [pricePerKg, setPricePerKg] = useState<number | "">("");
  const [glassPrice, setGlassPrice] = useState<number | "">("");
  
  // Estado para el Selector de Kit
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [kitPrice, setKitPrice] = useState<number | "">("");
  const [isKitOpen, setIsKitOpen] = useState(false);
  const [kitSearchQuery, setKitSearchQuery] = useState("");
  
  // Estados de edición de precio
  const [isEditingKitPrice, setIsEditingKitPrice] = useState(false);
  const [isEditingAlumPrice, setIsEditingAlumPrice] = useState(false);
  const [isEditingGlassPrice, setIsEditingGlassPrice] = useState(false);

  // Modal para ver accesorios del kit
  const [showKitDetails, setShowKitDetails] = useState(false);
  
  const kitRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (kitRef.current && !kitRef.current.contains(event.target as Node)) {
        setIsKitOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let currentTech = TECH_2_HOJAS;
  if (cfg.leaves === 3) currentTech = TECH_3_HOJAS;
  if (cfg.leaves === 4) currentTech = TECH_4_HOJAS;

  const supported = cfg.leaves >= 2 && cfg.leaves <= 4;
  
  const res = useMemo(() => {
    if (!generated || !supported) return null;
    return calculate(cfg, currentTech);
  }, [generated, cfg, supported, currentTech]);

  const handleGenerate = () => {
    if (!formWidth || !formHeight || !formLeaves || !formSlidingLeaves) {
      setFormError("Por favor, completa todas las medidas y selecciona la cantidad de hojas (tanto totales como corredizas).");
      return;
    }
    setFormError(null);
    setCfg({ ...DEFAULT_CONFIG, width: formWidth, height: formHeight, leaves: formLeaves });
    setGenerated(true);
  };

  // Lógica de precios
  const totalWeight = res ? res.aluminumWeight : 0;
  const aluminumCost = totalWeight * (Number(pricePerKg) || 0);
  const totalCost = aluminumCost + (Number(glassPrice) || 0) + (Number(kitPrice) || 0);

  const filteredKits = KITS_DB.filter(k => 
    k.name.toLowerCase().includes(kitSearchQuery.toLowerCase()) || 
    k.code.toLowerCase().includes(kitSearchQuery.toLowerCase())
  );

  const handleSelectKit = (kit: Kit) => {
    setSelectedKit(kit);
    setKitPrice(kit.price);
    setIsKitOpen(false);
    setKitSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      <header className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded bg-slate-800 font-mono text-xs font-bold text-white">AV</div>
          <div>
            <div className="text-sm font-bold tracking-tight">ALUVI</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Diseñador y Cotizador</div>
          </div>
        </div>
        <div className="flex gap-2">
          {generated && <Btn primary onClick={() => window.print()}>Imprimir PDF</Btn>}
        </div>
      </header>

      <main className="no-print max-w-[1200px] mx-auto p-4 space-y-6">
        
        {/* CONFIGURACIÓN */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 tracking-wide">Configuración de la Ventana</h2>
            <span className="text-xs text-slate-400 font-medium">Ingresa los datos para calcular</span>
          </div>

          {formError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="text-sm font-medium">{formError}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
            <Field label="Ancho (mm)">
              <input 
                type="number" min={0} step={10} value={formWidth} 
                onChange={(e) => { setFormWidth(e.target.value ? +e.target.value : ""); setFormError(null); }} 
                placeholder="Ej. 2000" className={inputCls} 
              />
            </Field>
            <Field label="Alto (mm)">
              <input 
                type="number" min={0} step={10} value={formHeight} 
                onChange={(e) => { setFormHeight(e.target.value ? +e.target.value : ""); setFormError(null); }} 
                placeholder="Ej. 2000" className={inputCls} 
              />
            </Field>
            <Field label="Cantidad de Hojas">
              <select 
                value={formLeaves} 
                onChange={(e) => {
                  const val = e.target.value ? +e.target.value : "";
                  setFormLeaves(val);
                  setFormSlidingLeaves(""); // Se resetea a vacío
                  setFormError(null);
                }} 
                className={inputCls}
              >
                <option value="">Seleccione...</option>
                <option value={2}>2 hojas</option>
                <option value={3}>3 hojas</option>
                <option value={4}>4 hojas</option>
              </select>
            </Field>
            <Field label="Hojas Corredizas">
              <select 
                value={formSlidingLeaves} 
                onChange={(e) => { setFormSlidingLeaves(e.target.value ? +e.target.value : ""); setFormError(null); }} 
                className={inputCls} disabled={!formLeaves}
              >
                <option value="">Seleccione...</option>
                {formLeaves && Array.from({ length: formLeaves }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} corredizas</option>
                ))}
              </select>
            </Field>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleGenerate} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 h-10 rounded-lg shadow-md transition-all">
              Generar Ventana
            </Button>
          </div>
        </section>

        {/* RESULTADOS */}
        {generated && res && (
          <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <Panel title="Plano Técnico" noPadding>
              <div className="bg-white p-4 flex justify-center items-center min-h-[350px] border-b border-slate-100">
                <PlanoImagen cfg={cfg} />
              </div>
            </Panel>

            <Panel title="Despiece, Cortes y Peso" noPadding>
              <UnifiedTable res={res} tech={currentTech} />
            </Panel>

            {/* COTIZACIÓN */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-800 text-white px-6 py-4">
                <h2 className="text-sm font-bold uppercase tracking-widest">Cotización Estimada</h2>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col gap-4">
                  
                  {/* Fila 1: Aluminio */}
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px] gap-4 items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Aluminio</div>
                      <div className="text-[11px] text-slate-400">Peso total: {fmt(totalWeight)} kg</div>
                    </div>
                    
                    {/* Información Intuitiva para el Aluminio */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-600">Precio por Kg ($):</span>
                      {isEditingAlumPrice ? (
                        <input 
                          type="number" min={0} value={pricePerKg} 
                          onChange={(e) => setPricePerKg(e.target.value ? +e.target.value : "")} 
                          onBlur={() => setIsEditingAlumPrice(false)}
                          autoFocus
                          className="w-24 rounded border border-slate-300 px-2 py-1 font-mono text-sm outline-none" 
                        />
                      ) : (
                        <div 
                          onClick={() => setIsEditingAlumPrice(true)}
                          className={`cursor-pointer px-3 py-1 rounded font-mono text-sm font-semibold min-w-[80px] text-center ${
                            !pricePerKg 
                              ? "bg-white border border-dashed border-slate-400 text-slate-400 hover:bg-slate-100" 
                              : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-100"
                          }`}
                          title="Haz clic para ingresar el precio"
                        >
                          {pricePerKg ? `$${fmt(Number(pricePerKg))}` : "Ingresar precio"}
                        </div>
                      )}
                    </div>

                    <div className="text-right font-mono font-bold text-lg text-slate-800">
                      ${fmt(aluminumCost)}
                    </div>
                  </div>

                  {/* Fila 2: Vidrio */}
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px] gap-4 items-center bg-sky-50/50 p-4 rounded-lg border border-sky-100">
                    <div>
                      <div className="text-xs font-bold text-sky-700 uppercase">Vidrio</div>
                      <div className="text-[11px] text-slate-500">{res.glassCuts?.[0]?.qty || 0} piezas</div>
                    </div>
                    
                    {/* Información Intuitiva para el Vidrio */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-600">Precio Total ($):</span>
                      {isEditingGlassPrice ? (
                        <input 
                          type="number" min={0} value={glassPrice} 
                          onChange={(e) => setGlassPrice(e.target.value ? +e.target.value : "")} 
                          onBlur={() => setIsEditingGlassPrice(false)}
                          autoFocus
                          className="w-24 rounded border border-slate-300 px-2 py-1 font-mono text-sm outline-none" 
                        />
                      ) : (
                        <div 
                          onClick={() => setIsEditingGlassPrice(true)}
                          className={`cursor-pointer px-3 py-1 rounded font-mono text-sm font-semibold min-w-[80px] text-center ${
                            !glassPrice 
                              ? "bg-white border border-dashed border-slate-400 text-slate-400 hover:bg-slate-100" 
                              : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-100"
                          }`}
                          title="Haz clic para ingresar el precio"
                        >
                          {glassPrice ? `$${fmt(Number(glassPrice))}` : "Ingresar precio"}
                        </div>
                      )}
                    </div>

                    <div className="text-right font-mono font-bold text-lg text-slate-800">
                      ${fmt(Number(glassPrice) || 0)}
                    </div>
                  </div>

                  {/* Fila 3: Kit de Accesorios */}
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px] gap-4 items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Kit Accesorios</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {selectedKit ? selectedKit.name : "Sin seleccionar"}
                      </div>
                    </div>
                    
                    {/* Selector de Kit */}
                    <div className="flex items-center gap-2 w-full">
                      <div className="relative flex-1" ref={kitRef}>
                        <div 
                          onClick={() => setIsKitOpen(!isKitOpen)}
                          className={`${inputCls} cursor-pointer flex justify-between items-center h-[38px]`}
                        >
                          <span className="truncate text-xs font-bold">
                            {selectedKit ? selectedKit.code : "Buscar y seleccionar kit..."}
                          </span>
                          <div className="flex items-center gap-1">
                            {selectedKit && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowKitDetails(true); }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                                title="Ver accesorios del kit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                              </button>
                            )}
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>

                        {isKitOpen && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden bottom-full mb-1">
                            <div className="p-2 border-b border-slate-100 bg-slate-50">
                              <input 
                                type="text" 
                                placeholder="Buscar..." 
                                value={kitSearchQuery}
                                onChange={(e) => setKitSearchQuery(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded outline-none focus:border-slate-500"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              {filteredKits.length > 0 ? filteredKits.map(kit => (
                                <div 
                                  key={kit.code} 
                                  onClick={() => handleSelectKit(kit)}
                                  className="px-3 py-2 text-xs cursor-pointer hover:bg-slate-100 border-b border-slate-50 last:border-0 flex flex-col"
                                >
                                  <span className="font-bold text-slate-800">{kit.code} - ${fmt(kit.price)}</span>
                                  <span className="text-[10px] text-slate-500 truncate">{kit.name}</span>
                                </div>
                              )) : <div className="p-3 text-xs text-slate-400">No se encontraron kits</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Precio del Kit Editable en Línea */}
                    <div className="text-right font-mono font-bold text-lg text-slate-800 flex justify-end">
                      {isEditingKitPrice ? (
                        <input 
                          type="number" min={0} value={kitPrice} 
                          onChange={(e) => setKitPrice(e.target.value ? +e.target.value : "")} 
                          onBlur={() => setIsEditingKitPrice(false)}
                          autoFocus
                          className="w-24 rounded border border-slate-300 px-2 py-1 font-mono text-sm outline-none text-right" 
                        />
                      ) : (
                        <div 
                          onClick={() => setIsEditingKitPrice(true)}
                          className={`cursor-pointer px-2 py-1 rounded min-w-[60px] text-right ${
                            !kitPrice 
                              ? "bg-white border border-dashed border-slate-400 text-slate-400 hover:bg-slate-100" 
                              : "hover:bg-slate-200"
                          }`}
                          title="Haz clic para editar el precio"
                        >
                          {kitPrice ? `$${fmt(Number(kitPrice))}` : "$0.00"}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
              
              <div className="bg-slate-100 border-t border-slate-200 p-6 flex justify-between items-center">
                <span className="text-lg font-bold uppercase tracking-widest text-slate-700">Total General</span>
                <span className="text-3xl font-mono font-bold text-slate-900">${fmt(totalCost)}</span>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* MODAL DE DETALLES DEL KIT */}
      {showKitDetails && selectedKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowKitDetails(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">{selectedKit.code} - {selectedKit.name}</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Precio del Kit: ${fmt(selectedKit.price)}</p>
              </div>
              <button onClick={() => setShowKitDetails(false)} className="text-slate-300 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 border-b pb-1">Accesorios Incluidos</h4>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400">
                    <th className="pb-2">Accesorio</th>
                    <th className="pb-2 text-right">Cantidad</th>
                    <th className="pb-2 pl-4">Unidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedKit.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2 text-right font-mono font-bold">{item.qty}</td>
                      <td className="py-2 pl-4 text-slate-500">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-4 py-3 text-right">
              <button onClick={() => setShowKitDetails(false)} className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <PrintSheet 
        cfg={cfg} res={res} tech={currentTech} 
        totalCost={totalCost} aluminumCost={aluminumCost} 
        glassPrice={Number(glassPrice) || 0} kitPrice={Number(kitPrice) || 0} 
        selectedKit={selectedKit} 
      />
    </div>
  );
}

// ============================================================================
// COMPONENTES UI
// ============================================================================
const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all disabled:bg-slate-50 disabled:text-slate-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}
function Btn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return <Button onClick={onClick} className={`rounded font-medium transition ${primary ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white border text-slate-800 hover:bg-slate-50"}`}>{children}</Button>;
}
function Panel({ title, children, noPadding }: { title: string; children: React.ReactNode; noPadding?: boolean }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">{title}</h2>
      </div>
      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </section>
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
        className="max-w-full max-h-[400px] object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const errorMsg = document.createElement('div');
            errorMsg.className = "text-center p-6 text-sm text-amber-600 border border-dashed border-amber-300 rounded bg-amber-50";
            errorMsg.innerHTML = `<p class="font-bold mb-1">Plano no encontrado</p><p class="font-mono text-xs px-2 py-1 mt-1 bg-white rounded inline-block">public/planos/${fileName}</p>`;
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
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-[10px] uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-bold text-center w-28">Perfil</th>
            <th className="px-4 py-3 font-bold w-56">Descripción</th>
            <th className="px-4 py-3 font-bold text-center w-24">Descuento</th>
            <th className="px-4 py-3 font-bold text-right w-16">Cant</th>
            <th className="px-4 py-3 font-bold text-right w-28">Corte (mm)</th>
            <th className="px-4 py-3 font-bold text-right w-24">Peso (kg)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {res.pieces.map((p, i) => {
            const profileTech = tech.profiles.find(tp => tp.code === p.code);
            const formula = profileTech ? `${profileTech.base} ${profileTech.offset >= 0 ? "+" : ""}${profileTech.offset}` : "-";

            return (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-2 align-middle">
                  <div className="flex h-14 w-20 mx-auto items-center justify-center bg-white border border-slate-200 rounded shadow-sm p-0.5">
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
                <td className="px-4 py-2 align-middle">
                  <div className="text-[13px] font-mono text-slate-800 font-bold leading-tight truncate">{p.code}</div>
                  <div className="text-[11px] text-slate-500 truncate leading-tight">{p.name}</div>
                </td>
                <td className="px-4 py-2 text-center align-middle font-mono text-[12px] text-slate-600 bg-slate-50/50">
                  {formula}
                </td>
                <td className="px-4 py-2 text-right align-middle font-mono text-[13px] text-slate-700">{p.qty}</td>
                <td className="px-4 py-2 text-right align-middle font-mono text-[14px] font-bold text-slate-800">{fmt(p.length, 0)}</td>
                <td className="px-4 py-2 text-right align-middle font-mono text-[13px] text-slate-600">{fmt(p.totalWeight, 2)}</td>
              </tr>
            );
          })}
          
          {res.glassCuts?.map((g, i) => (
            <tr key={"v" + i} className="bg-sky-50/30 hover:bg-sky-50/50">
              <td className="p-2 align-middle">
                <div className="flex h-14 w-20 mx-auto items-center justify-center border border-sky-200 bg-sky-100 rounded shadow-sm">
                  <span className="text-[10px] font-bold text-sky-600">VIDRIO</span>
                </div>
              </td>
              <td className="px-4 py-2 align-middle">
                <div className="text-[13px] font-mono text-sky-700 font-bold leading-tight truncate">Cristal</div>
                <div className="text-[11px] text-slate-500 leading-tight truncate">{g.qty} piezas</div>
              </td>
              <td className="px-4 py-2 text-center align-middle font-mono text-[12px] text-slate-600 bg-slate-50/50">
                 L/{tech.glass.widthDivisor} {tech.glass.widthOffset}
              </td>
              <td className="px-4 py-2 text-right align-middle font-mono text-[13px] text-slate-700">{g.qty}</td>
              <td className="px-4 py-2 text-right align-middle font-mono text-[14px] font-bold text-slate-800">
                {fmt(g.w, 0)}×{fmt(g.h, 0)}
              </td>
              <td className="px-4 py-2 text-right align-middle font-mono text-[12px] text-slate-400">—</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 flex justify-between items-center">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Totales Aluminio</span>
        <span className="font-mono text-sm font-bold text-slate-800">{fmt(res.aluminumMeters)} m <span className="text-slate-400 font-normal mx-2">|</span> {fmt(res.aluminumWeight)} kg</span>
      </div>
    </div>
  );
}

// ============================================================================
// IMPRESIÓN
// ============================================================================
function PrintSheet({ cfg, res, tech, totalCost, aluminumCost, glassPrice, kitPrice, selectedKit }: { 
  cfg: WindowConfig; res: CalcResult | null; tech: TechParams; 
  totalCost: number; aluminumCost: number; glassPrice: number; kitPrice: number; selectedKit: Kit | null;
}) {
  if (!res) return null;

  return (
    <div className="print-only p-8 bg-white max-w-4xl mx-auto">
      <div className="border-b-2 border-slate-800 pb-2 mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ALUVI · Cotización</h1>
          <p className="text-sm font-semibold text-slate-600">{MODELS[cfg.model].label} · {cfg.leaves} hojas · {cfg.width} × {cfg.height} mm</p>
        </div>
        <p className="text-[10px] text-slate-500 text-right">Generado: {new Date().toLocaleString("es-BO")}<br/>PROTOTIPO TÉCNICO</p>
      </div>

      <h3 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2 uppercase tracking-widest">Plano</h3>
      <div className="mb-6 flex justify-center">
        <PlanoImagen cfg={cfg} />
      </div>

      <h3 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2 uppercase tracking-widest">Tabla de Despiece y Cortes</h3>
      <div className="mb-6">
        <UnifiedTable res={res} tech={tech} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border rounded p-2">
          <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-1 border-b">Aluminio</h4>
          <p className="text-xs flex justify-between"><span>Peso:</span> <span className="font-mono">{fmt(res.aluminumWeight)} kg</span></p>
          <p className="text-sm font-bold flex justify-between mt-1 pt-1 border-t"><span>Subtotal:</span> <span className="font-mono">${fmt(aluminumCost)}</span></p>
        </div>
        <div className="border rounded p-2">
          <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-1 border-b">Vidrio</h4>
          <p className="text-xs flex justify-between"><span>Cantidad:</span> <span className="font-mono">{res.glassCuts?.[0]?.qty || 0} pzas</span></p>
          <p className="text-sm font-bold flex justify-between mt-1 pt-1 border-t"><span>Subtotal:</span> <span className="font-mono">${fmt(glassPrice)}</span></p>
        </div>
        <div className="border rounded p-2">
          <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-1 border-b">Kit Accesorios</h4>
          <p className="text-xs flex justify-between"><span>Kit:</span> <span className="font-mono">{selectedKit?.code || "-"}</span></p>
          <p className="text-xs truncate text-slate-500">{selectedKit?.name || "No seleccionado"}</p>
          <p className="text-sm font-bold flex justify-between mt-1 pt-1 border-t"><span>Subtotal:</span> <span className="font-mono">${fmt(kitPrice)}</span></p>
        </div>
      </div>

      <div className="bg-slate-800 text-white p-3 flex justify-between items-center rounded">
        <span className="text-sm font-bold uppercase tracking-widest">Total General</span>
        <span className="text-xl font-mono font-bold">${fmt(totalCost)}</span>
      </div>
    </div>
  );
}