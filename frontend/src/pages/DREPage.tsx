import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { financialApi } from '../api/client';
import {
  TrendingUp,
  TrendingDown,
  BarChart4,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Printer,
  Info,
} from 'lucide-react';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

const DRE_PRINT_STYLE = `
@media screen { #dre-print { display: none; } }
@media print {
  body * { visibility: hidden; }
  #dre-print, #dre-print * { visibility: visible; }
  #dre-print { position: absolute; left: 0; top: 0; width: 100%; background: white; padding: 20px; }
  @page { size: A4; margin: 12mm 14mm; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #ccc; padding: 6px 10px; font-size: 10pt; }
  .hdr { background: #1e293b !important; color: #fff !important; font-weight: bold; }
  .pos { color: #16a34a; font-weight: bold; }
  .neg { color: #dc2626; font-weight: bold; }
}
`;

function DRERow({ label, value, indent = 0, highlight = false, positive = true, note }: {
  label: string; value: number; indent?: number; highlight?: boolean; positive?: boolean; note?: string;
}) {
  const color = value >= 0 ? 'text-emerald-600' : 'text-red-600';
  return (
    <tr className={highlight ? 'bg-slate-50 font-bold' : ''}>
      <td className={`py-3 px-4 text-sm text-slate-700 border-b border-slate-100 ${indent > 0 ? 'pl-' + (4 + indent * 4) : ''}`}>
        <span style={{ paddingLeft: `${indent * 16}px` }} className="flex items-center gap-1">
          {label}
          {note && <span title={note} className="text-slate-400 cursor-help"><Info className="w-3 h-3 inline" /></span>}
        </span>
      </td>
      <td className={`py-3 px-4 text-sm text-right font-mono border-b border-slate-100 ${highlight ? color : value < 0 ? 'text-red-600' : 'text-slate-900'}`}>
        {fmt(value)}
      </td>
    </tr>
  );
}

function BarMini({ label, receita, despesa, resultado }: { label: string; receita: number; despesa: number; resultado: number }) {
  const max = Math.max(receita, despesa, 1);
  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      <div className="flex items-end gap-1 h-20">
        <div
          className="w-5 bg-emerald-400 rounded-t transition-all"
          style={{ height: `${(receita / max) * 80}px` }}
          title={`Receita: ${fmt(receita)}`}
        />
        <div
          className="w-5 bg-red-300 rounded-t transition-all"
          style={{ height: `${(despesa / max) * 80}px` }}
          title={`Despesa: ${fmt(despesa)}`}
        />
      </div>
      <span className="text-[10px] text-slate-500 font-medium">{label}</span>
      <span className={`text-[10px] font-bold ${resultado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {resultado >= 0 ? '+' : ''}{fmt(resultado)}
      </span>
    </div>
  );
}

export function DREPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (y: number, m: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await financialApi.getDRE(y, m);
      setData(res.data);
    } catch {
      setError('Não foi possível carregar o DRE. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(year, month); }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const max = year === now.getFullYear() && month === now.getMonth() + 1;
    if (max) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.textContent = DRE_PRINT_STYLE;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const dre = data?.dre;
  const historico = data?.historico ?? [];
  const detalhes = data?.detalhes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">DRE</h1>
          <p className="text-slate-500 font-medium">Demonstrativo de Resultado do Exercício</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-2 py-1.5 shadow-sm">
            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-sm font-bold text-slate-800 min-w-[130px] text-center capitalize">
              {new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextMonth}
              disabled={year === now.getFullYear() && month === now.getMonth() + 1}
              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
          <p className="text-slate-500 font-medium animate-pulse">Calculando DRE...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 text-red-600 font-medium">{error}</div>
      ) : dre && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Receita Bruta', value: dre.receitaBruta, icon: TrendingUp, color: 'emerald' },
              { label: 'Receita Líquida', value: dre.receitaLiquida, icon: BarChart4, color: 'blue' },
              { label: 'Margem Bruta', value: dre.margemBruta, icon: TrendingUp, color: dre.margemBruta >= 0 ? 'emerald' : 'red' },
              { label: 'EBITDA', value: dre.ebitda, icon: dre.ebitda >= 0 ? TrendingUp : TrendingDown, color: dre.ebitda >= 0 ? 'emerald' : 'red' },
            ].map((card) => (
              <div key={card.label} className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-5`}>
                <div className={`flex items-center gap-2 text-${card.color}-600 mb-2`}>
                  <card.icon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{card.label}</span>
                </div>
                <p className={`text-2xl font-black ${card.value >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  {fmt(card.value)}
                </p>
                {card.label === 'Margem Bruta' && (
                  <p className="text-xs text-slate-500 mt-1">{pct(dre.margemBrutaPerc)} da receita líquida</p>
                )}
                {card.label === 'EBITDA' && (
                  <p className="text-xs text-slate-500 mt-1">{pct(dre.ebitdaPerc)} da receita líquida</p>
                )}
                {card.label === 'Receita Bruta' && (
                  <p className="text-xs text-slate-500 mt-1">{detalhes?.osEntregues} OS entregues</p>
                )}
              </div>
            ))}
          </div>

          {/* Tabela DRE + Gráfico */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabela DRE */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Estrutura do DRE</h2>
                <span className="text-xs text-slate-500 font-medium capitalize">
                  {new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {/* Receita */}
                    <tr className="bg-slate-900 text-white">
                      <td colSpan={2} className="py-2 px-4 text-xs font-bold uppercase tracking-wider">Receita</td>
                    </tr>
                    <DRERow label="(+) Receita Bruta" value={dre.receitaBruta} />
                    <DRERow label="Receita de OS (serviços)" value={detalhes.receitaBrutaOS} indent={1} />
                    <DRERow label="Receita Manual (lançamentos)" value={detalhes.receitaManual} indent={1} />
                    <DRERow
                      label="(-) Deduções (impostos estimados ~8%)"
                      value={-dre.deducoes}
                      note="Estimativa simplificada. Configure sua alíquota real em Configurações."
                    />
                    <DRERow label="(=) Receita Líquida" value={dre.receitaLiquida} highlight />

                    {/* CMV */}
                    <tr className="bg-slate-900 text-white">
                      <td colSpan={2} className="py-2 px-4 text-xs font-bold uppercase tracking-wider">Custo dos Produtos</td>
                    </tr>
                    <DRERow label="(-) CMV — Custo das Peças Utilizadas" value={-dre.cmv} note="Custo de compra das peças usadas nas OS entregues." />
                    <DRERow label="(=) Margem Bruta" value={dre.margemBruta} highlight />

                    {/* Despesas */}
                    <tr className="bg-slate-900 text-white">
                      <td colSpan={2} className="py-2 px-4 text-xs font-bold uppercase tracking-wider">Despesas Operacionais</td>
                    </tr>
                    <DRERow label="(-) Total de Despesas" value={-dre.despesasOperacionais} />
                    {Object.entries(detalhes.despesasPorCategoria as Record<string, number>).map(([cat, val]) => (
                      <DRERow key={cat} label={cat} value={-(val as number)} indent={1} />
                    ))}
                    <DRERow label="(=) EBITDA" value={dre.ebitda} highlight />

                    {/* Resultado */}
                    <tr className="bg-slate-900 text-white">
                      <td colSpan={2} className="py-2 px-4 text-xs font-bold uppercase tracking-wider">Resultado</td>
                    </tr>
                    <DRERow label="(=) Resultado Líquido do Período" value={dre.resultadoLiquido} highlight />
                  </tbody>
                </table>
              </div>
              <p className="px-6 py-3 text-xs text-slate-400 border-t border-slate-100">
                * Deduções fiscais e CMV são estimativas. Consulte seu contador para o DRE oficial.
              </p>
            </div>

            {/* Gráfico de histórico + breakdown despesas */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-4">Histórico 6 meses</h3>
                <div className="flex items-end justify-between gap-1 px-2">
                  {historico.map((h: any) => (
                    <BarMini key={h.mes} label={h.mes} receita={h.receita} despesa={h.despesa} resultado={h.resultado} />
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 justify-center text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Receita</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 inline-block" /> Despesa</span>
                </div>
              </div>

              {Object.keys(detalhes.despesasPorCategoria).length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                  <h3 className="font-bold text-slate-900 text-sm mb-3">Despesas por Categoria</h3>
                  <div className="space-y-2">
                    {Object.entries(detalhes.despesasPorCategoria as Record<string, number>)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([cat, val]) => {
                        const pctVal = dre.despesasOperacionais > 0 ? ((val as number) / dre.despesasOperacionais) * 100 : 0;
                        return (
                          <div key={cat}>
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="text-slate-700 font-medium">{cat}</span>
                              <span className="text-slate-500">{fmt(val as number)} ({pctVal.toFixed(0)}%)</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-400 rounded-full" style={{ width: `${pctVal}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Print version */}
      <div id="dre-print" style={{ display: 'none' }}>
        <h2 style={{ textAlign: 'center', fontSize: '16pt', marginBottom: 4 }}>
          Demonstrativo de Resultado do Exercício — DRE
        </h2>
        <p style={{ textAlign: 'center', marginBottom: 16, color: '#555', fontSize: '11pt' }}>
          {new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
        {dre && (
          <table>
            <thead>
              <tr className="hdr">
                <th style={{ textAlign: 'left' }}>Descrição</th>
                <th style={{ textAlign: 'right' }}>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['(+) Receita Bruta', dre.receitaBruta],
                ['   Receita de OS', detalhes.receitaBrutaOS],
                ['   Receita Manual', detalhes.receitaManual],
                ['(-) Deduções (~8%)', -dre.deducoes],
                ['(=) Receita Líquida', dre.receitaLiquida],
                ['(-) CMV — Custo das Peças', -dre.cmv],
                ['(=) Margem Bruta', dre.margemBruta],
                ['(-) Despesas Operacionais', -dre.despesasOperacionais],
                ['(=) EBITDA', dre.ebitda],
                ['(=) Resultado Líquido', dre.resultadoLiquido],
              ].map(([label, val]) => (
                <tr key={label as string}>
                  <td>{label}</td>
                  <td style={{ textAlign: 'right' }} className={(val as number) >= 0 ? 'pos' : 'neg'}>
                    {fmt(val as number)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: '8pt', color: '#888', marginTop: 12 }}>
          * Estimativas para fins gerenciais. Consulte seu contador para o DRE oficial.
        </p>
      </div>
    </div>
  );
}
