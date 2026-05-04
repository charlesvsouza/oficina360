import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Loader2, Ruler, CheckCircle2 } from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface CylMeasure {
  diametroNominal: string;   // mm
  diametroMedido:  string;   // mm
  ovalização:      string;   // mm
  conicidade:      string;   // mm
  folga:           string;   // mm (folga pistão)
}

export interface MetrologiaData {
  numeroCilindros: number;
  cilindros:       CylMeasure[];
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

const EMPTY_CYL: CylMeasure = {
  diametroNominal: '',
  diametroMedido:  '',
  ovalização:      '',
  conicidade:      '',
  folga:           '',
};

function defaultCylinders(n: number): CylMeasure[] {
  return Array.from({ length: n }, () => ({ ...EMPTY_CYL }));
}

export function MetrologiaModal({ osId, osNumber, onSave, onCancel, initialData }: Props) {
  const [numCyl, setNumCyl]     = useState(initialData?.numeroCilindros ?? 4);
  const [cilindros, setCilindros] = useState<CylMeasure[]>(
    initialData?.cilindros ?? defaultCylinders(4)
  );
  const [observacoes, setObservacoes] = useState(initialData?.observacoes ?? '');
  const [tecnico, setTecnico]         = useState(initialData?.tecnico ?? '');
  const [saving, setSaving]           = useState(false);
  const [saved,  setSaved]            = useState(false);

  // Ajusta quantidade de cilindros
  const changeNumCyl = (n: number) => {
    const clamped = Math.min(Math.max(n, 1), 16);
    setNumCyl(clamped);
    setCilindros((prev) => {
      if (clamped > prev.length) {
        return [...prev, ...defaultCylinders(clamped - prev.length)];
      }
      return prev.slice(0, clamped);
    });
  };

  const updateCyl = (i: number, field: keyof CylMeasure, val: string) => {
    setCilindros((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        numeroCilindros: numCyl,
        cilindros,
        observacoes,
        tecnico,
        dataLeitura: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => onCancel(), 900);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Ruler className="text-blue-400 w-5 h-5" />
              <div>
                <h2 className="text-white font-black text-lg">Ficha de Metrologia</h2>
                <p className="text-slate-500 text-xs">OS #{osNumber} — preencha antes de avançar</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Qtd cilindros */}
            <div className="flex items-center gap-4">
              <span className="text-slate-300 text-sm font-semibold w-48">Número de cilindros</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeNumCyl(numCyl - 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-white font-black text-lg">{numCyl}</span>
                <button
                  onClick={() => changeNumCyl(numCyl + 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Tabela de medições */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 text-left">
                    <th className="py-2 pr-3 font-semibold w-14">Cil.</th>
                    <th className="py-2 pr-2 font-semibold">Ø Nominal (mm)</th>
                    <th className="py-2 pr-2 font-semibold">Ø Medido (mm)</th>
                    <th className="py-2 pr-2 font-semibold">Ovalização (mm)</th>
                    <th className="py-2 pr-2 font-semibold">Conicidade (mm)</th>
                    <th className="py-2 font-semibold">Folga Pistão (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {cilindros.map((cyl, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/15 text-blue-400 font-black text-xs">
                          {i + 1}
                        </span>
                      </td>
                      {(['diametroNominal', 'diametroMedido', 'ovalização', 'conicidade', 'folga'] as const).map((field) => (
                        <td key={field} className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={cyl[field]}
                            onChange={(e) => updateCyl(i, field, e.target.value)}
                            placeholder="—"
                            className="w-28 bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500/60 transition-colors placeholder:text-slate-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Campos extras */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold block mb-1.5">Técnico responsável</label>
                <input
                  value={tecnico}
                  onChange={(e) => setTecnico(e.target.value)}
                  placeholder="Nome do técnico"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold block mb-1.5">Observações técnicas</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Desgaste irregular, trincas, etc."
                  rows={2}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-black rounded-xl transition-all"
            >
              {saved ? (
                <><CheckCircle2 size={15} /> Salvo!</>
              ) : saving ? (
                <><Loader2 size={15} className="animate-spin" /> Salvando…</>
              ) : (
                <>Salvar e avançar para Metrologia</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
