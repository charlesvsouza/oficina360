import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Loader2, Ruler, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Medidas de um cilindro */
export interface CylMeasure {
  diametroNominal: string;
  diametroMedido:  string;
  ovalização:      string;
  conicidade:      string;
  folgaPistao:     string;
}

/** Medidas de munhão principal ou moente do virabrequim */
export interface JournalMeasure {
  diametroNominal: string;
  diametroMedido:  string;
  ovalização:      string;
  conicidade:      string;
}

/** Medidas de mancal do bloco ou cabeça de biela */
export interface BoreMeasure {
  diametroNominal: string;
  diametroMedido:  string;
}

export interface MetrologiaData {
  // Empenamentos (mm)
  empenamentoCabecote: string;
  empenamentoBloco:    string;
  // Cilindros
  numeroCilindros: number;
  cilindros:       CylMeasure[];
  // Virabrequim — munhões principais
  numeroMunhoes:   number;
  munhoes:         JournalMeasure[];
  // Virabrequim — moentes (munhões de biela)
  numeroMoentes:   number;
  moentes:         JournalMeasure[];
  // Mancais de apoio do bloco
  numeroMancais:   number;
  mancaisBloco:    BoreMeasure[];
  // Cabeças de biela
  numeroBielas:    number;
  bielas:          BoreMeasure[];
  observacoes:     string;
  tecnico:         string;
  dataLeitura:     string;
}

interface Props {
  osId:        string;
  osNumber:    string;
  onSave:      (data: MetrologiaData) => Promise<void>;
  onCancel:    () => void;
  initialData?: MetrologiaData | null;
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const EMPTY_CYL:     CylMeasure     = { diametroNominal: '', diametroMedido: '', ovalização: '', conicidade: '', folgaPistao: '' };
const EMPTY_JOURNAL: JournalMeasure = { diametroNominal: '', diametroMedido: '', ovalização: '', conicidade: '' };
const EMPTY_BORE:    BoreMeasure    = { diametroNominal: '', diametroMedido: '' };

function mkArr<T>(n: number, empty: T): T[] { return Array.from({ length: n }, () => ({ ...empty as any })); }
function adjustArr<T>(arr: T[], n: number, empty: T): T[] {
  if (n > arr.length) return [...arr, ...mkArr(n - arr.length, empty)];
  return arr.slice(0, n);
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function NumStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))}
        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"><Minus size={12} /></button>
      <span className="w-6 text-center text-white font-black text-sm">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(16, value + 1))}
        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"><Plus size={12} /></button>
    </div>
  );
}

function Section({ title, color = 'blue', open, onToggle, children }: {
  title: string; color?: 'blue' | 'amber'; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const bg   = color === 'amber' ? 'bg-amber-500/10 text-amber-300' : 'bg-blue-500/10 text-blue-300';
  const ring = color === 'amber' ? 'border-amber-500/30' : 'border-blue-500/30';
  return (
    <div className={`rounded-xl border ${ring}`}>
      <button type="button" onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 ${bg} text-xs font-black uppercase tracking-widest rounded-xl`}>
        {title}
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
  );
}

function NInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="number" step="0.001" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder="—"
      className="w-24 bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500/60 placeholder:text-slate-600" />
  );
}

function JournalTable({ rows, update, dotColor = 'blue' }: {
  rows: JournalMeasure[];
  update: (i: number, f: keyof JournalMeasure, v: string) => void;
  dotColor?: 'blue' | 'amber';
}) {
  const dot = dotColor === 'amber' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400';
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="text-slate-500 text-left">
          <th className="py-1.5 pr-3 w-10">#</th>
          <th className="py-1.5 pr-2">Ø Nominal (mm)</th>
          <th className="py-1.5 pr-2">Ø Medido (mm)</th>
          <th className="py-1.5 pr-2">Ovalização (mm)</th>
          <th className="py-1.5">Conicidade (mm)</th>
        </tr></thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-1.5 pr-3"><span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${dot}`}>{i + 1}</span></td>
              <td className="py-1.5 pr-2"><NInput value={r.diametroNominal} onChange={(v) => update(i, 'diametroNominal', v)} /></td>
              <td className="py-1.5 pr-2"><NInput value={r.diametroMedido}  onChange={(v) => update(i, 'diametroMedido', v)} /></td>
              <td className="py-1.5 pr-2"><NInput value={r.ovalização}      onChange={(v) => update(i, 'ovalização', v)} /></td>
              <td className="py-1.5">    <NInput value={r.conicidade}      onChange={(v) => update(i, 'conicidade', v)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BoreTable({ rows, update }: {
  rows: BoreMeasure[];
  update: (i: number, f: keyof BoreMeasure, v: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="text-slate-500 text-left">
          <th className="py-1.5 pr-3 w-10">#</th>
          <th className="py-1.5 pr-2">Ø Nominal (mm)</th>
          <th className="py-1.5">Ø Medido (mm)</th>
        </tr></thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-1.5 pr-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 font-black text-xs">{i + 1}</span></td>
              <td className="py-1.5 pr-2"><NInput value={r.diametroNominal} onChange={(v) => update(i, 'diametroNominal', v)} /></td>
              <td className="py-1.5">    <NInput value={r.diametroMedido}  onChange={(v) => update(i, 'diametroMedido', v)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  osId:         string;
  osNumber:     string;
  onSave:       (data: MetrologiaData) => Promise<void>;
  onCancel:     () => void;
  initialData?: MetrologiaData | null;
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function MetrologiaModal({ osId, osNumber, onSave, onCancel, initialData }: Props) {
  const nCylInit = initialData?.numeroCilindros ?? 4;

  const [empCab, setEmpCab] = useState(initialData?.empenamentoCabecote ?? '');
  const [empBlo, setEmpBlo] = useState(initialData?.empenamentoBloco ?? '');

  const [numCyl, setNumCyl] = useState(nCylInit);
  const [cils,   setCils]   = useState<CylMeasure[]>(initialData?.cilindros ?? mkArr(nCylInit, EMPTY_CYL));

  const [numMun, setNumMun] = useState(initialData?.numeroMunhoes ?? nCylInit + 1);
  const [munhoes, setMunhoes] = useState<JournalMeasure[]>(initialData?.munhoes ?? mkArr(nCylInit + 1, EMPTY_JOURNAL));

  const [numMoe, setNumMoe] = useState(initialData?.numeroMoentes ?? nCylInit);
  const [moentes, setMoentes] = useState<JournalMeasure[]>(initialData?.moentes ?? mkArr(nCylInit, EMPTY_JOURNAL));

  const [numMan, setNumMan] = useState(initialData?.numeroMancais ?? nCylInit + 1);
  const [mancais, setMancais] = useState<BoreMeasure[]>(initialData?.mancaisBloco ?? mkArr(nCylInit + 1, EMPTY_BORE));

  const [numBie, setNumBie] = useState(initialData?.numeroBielas ?? nCylInit);
  const [bielas,  setBielas]  = useState<BoreMeasure[]>(initialData?.bielas ?? mkArr(nCylInit, EMPTY_BORE));

  const [tecnico, setTecnico] = useState(initialData?.tecnico ?? '');
  const [obs,     setObs]     = useState(initialData?.observacoes ?? '');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const [open, setOpen] = useState({ emp: true, cil: true, mun: false, moe: false, man: false, bie: false, fin: true });
  const toggle = (k: keyof typeof open) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  // Alterar cilindros sincroniza moentes/bielas/munhões/mancais
  const handleNumCyl = (n: number) => {
    setNumCyl(n); setCils((p) => adjustArr(p, n, EMPTY_CYL));
    setNumMoe(n); setMoentes((p) => adjustArr(p, n, EMPTY_JOURNAL));
    setNumBie(n); setBielas((p) => adjustArr(p, n, EMPTY_BORE));
    setNumMun(n + 1); setMunhoes((p) => adjustArr(p, n + 1, EMPTY_JOURNAL));
    setNumMan(n + 1); setMancais((p) => adjustArr(p, n + 1, EMPTY_BORE));
  };

  const updCyl = (i: number, f: keyof CylMeasure, v: string) =>
    setCils((p) => { const a = [...p]; a[i] = { ...a[i], [f]: v }; return a; });
  const updJou = (setter: React.Dispatch<React.SetStateAction<JournalMeasure[]>>) =>
    (i: number, f: keyof JournalMeasure, v: string) =>
      setter((p) => { const a = [...p]; a[i] = { ...a[i], [f]: v }; return a; });
  const updBor = (setter: React.Dispatch<React.SetStateAction<BoreMeasure[]>>) =>
    (i: number, f: keyof BoreMeasure, v: string) =>
      setter((p) => { const a = [...p]; a[i] = { ...a[i], [f]: v }; return a; });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        empenamentoCabecote: empCab, empenamentoBloco: empBlo,
        numeroCilindros: numCyl, cilindros: cils,
        numeroMunhoes: numMun, munhoes,
        numeroMoentes: numMoe, moentes,
        numeroMancais: numMan, mancaisBloco: mancais,
        numeroBielas: numBie, bielas,
        tecnico, observacoes: obs,
        dataLeitura: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(onCancel, 900);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <Ruler className="text-blue-400 w-5 h-5" />
              <div>
                <h2 className="text-white font-black text-lg">Ficha de Metrologia</h2>
                <p className="text-slate-500 text-xs">OS #{osNumber} · preencha antes de avançar para Metrologia</p>
              </div>
            </div>
            <button type="button" onClick={onCancel} className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

            {/* Empenamentos */}
            <Section title="Empenamentos" open={open.emp} onToggle={() => toggle('emp')}>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div>
                  <label className="text-slate-400 text-xs font-semibold block mb-1.5">Empenamento — Face do cabeçote (mm)</label>
                  <input type="number" step="0.001" min="0" value={empCab} onChange={(e) => setEmpCab(e.target.value)} placeholder="ex: 0.050"
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/60 placeholder:text-slate-600" />
                  <p className="text-slate-600 text-[10px] mt-1">Limite típico: 0,05 mm</p>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-semibold block mb-1.5">Empenamento — Face do bloco (mm)</label>
                  <input type="number" step="0.001" min="0" value={empBlo} onChange={(e) => setEmpBlo(e.target.value)} placeholder="ex: 0.050"
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/60 placeholder:text-slate-600" />
                  <p className="text-slate-600 text-[10px] mt-1">Limite típico: 0,05 mm</p>
                </div>
              </div>
            </Section>

            {/* Cilindros */}
            <Section title={`Cilindros (${numCyl})`} open={open.cil} onToggle={() => toggle('cil')}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-slate-400 text-xs font-semibold">Número de cilindros:</span>
                <NumStepper value={numCyl} onChange={handleNumCyl} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-slate-500 text-left">
                    <th className="py-1.5 pr-3 w-10">Cil.</th>
                    <th className="py-1.5 pr-2">Ø Nominal (mm)</th>
                    <th className="py-1.5 pr-2">Ø Medido (mm)</th>
                    <th className="py-1.5 pr-2">Ovalização (mm)</th>
                    <th className="py-1.5 pr-2">Conicidade (mm)</th>
                    <th className="py-1.5">Folga Pistão (mm)</th>
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {cils.map((c, i) => (
                      <tr key={i}>
                        <td className="py-1.5 pr-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 font-black text-xs">{i + 1}</span></td>
                        <td className="py-1.5 pr-2"><NInput value={c.diametroNominal} onChange={(v) => updCyl(i, 'diametroNominal', v)} /></td>
                        <td className="py-1.5 pr-2"><NInput value={c.diametroMedido}  onChange={(v) => updCyl(i, 'diametroMedido', v)} /></td>
                        <td className="py-1.5 pr-2"><NInput value={c.ovalização}      onChange={(v) => updCyl(i, 'ovalização', v)} /></td>
                        <td className="py-1.5 pr-2"><NInput value={c.conicidade}      onChange={(v) => updCyl(i, 'conicidade', v)} /></td>
                        <td className="py-1.5">    <NInput value={c.folgaPistao}     onChange={(v) => updCyl(i, 'folgaPistao', v)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Munhões principais */}
            <Section title={`Munhões do Virabrequim — Principais (${numMun})`} color="amber" open={open.mun} onToggle={() => toggle('mun')}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-slate-400 text-xs font-semibold">Quantidade:</span>
                <NumStepper value={numMun} onChange={(n) => { setNumMun(n); setMunhoes((p) => adjustArr(p, n, EMPTY_JOURNAL)); }} />
                <span className="text-slate-600 text-[10px]">(geralmente cilindros + 1)</span>
              </div>
              <JournalTable rows={munhoes} update={updJou(setMunhoes)} dotColor="amber" />
            </Section>

            {/* Moentes */}
            <Section title={`Moentes do Virabrequim — Munhões de Biela (${numMoe})`} color="amber" open={open.moe} onToggle={() => toggle('moe')}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-slate-400 text-xs font-semibold">Quantidade:</span>
                <NumStepper value={numMoe} onChange={(n) => { setNumMoe(n); setMoentes((p) => adjustArr(p, n, EMPTY_JOURNAL)); }} />
              </div>
              <JournalTable rows={moentes} update={updJou(setMoentes)} dotColor="amber" />
            </Section>

            {/* Mancais do bloco */}
            <Section title={`Mancais de Apoio do Bloco (${numMan})`} open={open.man} onToggle={() => toggle('man')}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-slate-400 text-xs font-semibold">Quantidade:</span>
                <NumStepper value={numMan} onChange={(n) => { setNumMan(n); setMancais((p) => adjustArr(p, n, EMPTY_BORE)); }} />
              </div>
              <BoreTable rows={mancais} update={updBor(setMancais)} />
            </Section>

            {/* Bielas */}
            <Section title={`Diâmetro Interno das Cabeças de Biela (${numBie})`} open={open.bie} onToggle={() => toggle('bie')}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-slate-400 text-xs font-semibold">Quantidade:</span>
                <NumStepper value={numBie} onChange={(n) => { setNumBie(n); setBielas((p) => adjustArr(p, n, EMPTY_BORE)); }} />
              </div>
              <BoreTable rows={bielas} update={updBor(setBielas)} />
            </Section>

            {/* Técnico e Observações */}
            <Section title="Técnico & Observações" open={open.fin} onToggle={() => toggle('fin')}>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div>
                  <label className="text-slate-400 text-xs font-semibold block mb-1.5">Técnico responsável</label>
                  <input value={tecnico} onChange={(e) => setTecnico(e.target.value)} placeholder="Nome do técnico"
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-semibold block mb-1.5">Observações técnicas</label>
                  <textarea value={obs} onChange={(e) => setObs(e.target.value)}
                    placeholder="Desgaste irregular, trincas, recomendações..." rows={2}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors resize-none" />
                </div>
              </div>
            </Section>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 shrink-0">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={saving || saved}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-black rounded-xl transition-all">
              {saved  ? <><CheckCircle2 size={15} /> Salvo!</> :
               saving ? <><Loader2 size={15} className="animate-spin" /> Salvando…</> :
                        <>Salvar e avançar para Metrologia</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
