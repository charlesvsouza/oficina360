import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { serviceOrdersApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import {
  RefreshCw, Maximize2, Minimize2, Loader2,
  Car, User, Clock, AlertCircle, Tv2,
} from 'lucide-react';

// ─── Status visíveis no Kanban (exclui estados terminais) ────────────────────
const KANBAN_COLUMNS = [
  { status: 'ABERTA',               label: 'Abertas',              color: 'border-slate-500',  bg: 'bg-slate-500/10',  dot: 'bg-slate-400' },
  { status: 'EM_DIAGNOSTICO',       label: 'Diagnóstico',          color: 'border-indigo-500', bg: 'bg-indigo-500/10', dot: 'bg-indigo-400' },
  { status: 'ORCAMENTO_PRONTO',     label: 'Orçamento Pronto',     color: 'border-blue-500',   bg: 'bg-blue-500/10',   dot: 'bg-blue-400' },
  { status: 'AGUARDANDO_APROVACAO', label: 'Ag. Aprovação',        color: 'border-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-400' },
  { status: 'APROVADO',             label: 'Aprovado',             color: 'border-emerald-500',bg: 'bg-emerald-500/10',dot: 'bg-emerald-400' },
  { status: 'AGUARDANDO_PECAS',     label: 'Ag. Peças',            color: 'border-amber-500',  bg: 'bg-amber-500/10',  dot: 'bg-amber-400' },
  { status: 'EM_EXECUCAO',          label: 'Em Execução',          color: 'border-cyan-500',   bg: 'bg-cyan-500/10',   dot: 'bg-cyan-400' },
  { status: 'PRONTO_ENTREGA',       label: 'Pronto p/ Entrega',    color: 'border-violet-500', bg: 'bg-violet-500/10', dot: 'bg-violet-400' },
];

// Próximo status disponível por coluna (para avançar com 1 clique)
const NEXT_STATUS: Record<string, string> = {
  ABERTA:               'EM_DIAGNOSTICO',
  EM_DIAGNOSTICO:       'ORCAMENTO_PRONTO',
  ORCAMENTO_PRONTO:     'AGUARDANDO_APROVACAO',
  AGUARDANDO_APROVACAO: 'APROVADO',
  APROVADO:             'EM_EXECUCAO',
  AGUARDANDO_PECAS:     'EM_EXECUCAO',
  EM_EXECUCAO:          'PRONTO_ENTREGA',
  PRONTO_ENTREGA:       'FATURADO',
};

function elapsed(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h${m}m`;
  return `${m}m`;
}

function urgencyColor(date: string) {
  const h = (Date.now() - new Date(date).getTime()) / 3_600_000;
  if (h > 48) return 'text-red-400';
  if (h > 24) return 'text-amber-400';
  return 'text-slate-400';
}

// ─── Card de OS ──────────────────────────────────────────────────────────────
function KanbanCard({
  os,
  onAdvance,
  advancing,
  tvMode,
}: {
  os: any;
  onAdvance: (id: string, nextStatus: string) => void;
  advancing: string | null;
  tvMode: boolean;
}) {
  const next = NEXT_STATUS[os.status];
  const isAdv = advancing === os.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-slate-800/60 border border-white/10 rounded-xl p-3 space-y-2 hover:border-white/20 transition-all ${tvMode ? 'text-sm' : 'text-xs'}`}
    >
      {/* Número da OS + tempo */}
      <div className="flex items-center justify-between">
        <span className={`font-black text-white ${tvMode ? 'text-base' : 'text-sm'}`}>
          #{os.id.slice(-6).toUpperCase()}
        </span>
        <span className={`flex items-center gap-1 font-semibold ${urgencyColor(os.createdAt)}`}>
          <Clock size={tvMode ? 14 : 11} />
          {elapsed(os.createdAt)}
        </span>
      </div>

      {/* Veículo */}
      <div className="flex items-center gap-1.5 text-white/80">
        <Car size={tvMode ? 14 : 11} className="shrink-0 text-slate-400" />
        <span className="truncate font-semibold">
          {os.vehicle?.brand} {os.vehicle?.model}
        </span>
        <span className="text-slate-500 shrink-0">{os.vehicle?.plate}</span>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-1.5 text-slate-400">
        <User size={tvMode ? 13 : 10} className="shrink-0" />
        <span className="truncate">{os.customer?.name}</span>
      </div>

      {/* Queixa */}
      {os.complaint && (
        <p className="text-slate-500 truncate leading-tight">{os.complaint}</p>
      )}

      {/* Botão avançar */}
      {next && (
        <button
          onClick={() => onAdvance(os.id, next)}
          disabled={isAdv}
          className="w-full mt-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          {isAdv ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <>→ Avançar</>
          )}
        </button>
      )}
    </motion.div>
  );
}

// ─── Página Kanban ────────────────────────────────────────────────────────────
export function KanbanPage() {
  const navigate = useNavigate();
  const { tenant } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [tvMode, setTvMode] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await serviceOrdersApi.getAll();
      // Filtra apenas OS ativas (não terminais)
      const active = res.data.filter((o: any) =>
        KANBAN_COLUMNS.some((c) => c.status === o.status) ||
        o.status === 'ORCAMENTO' // legado → trata como ABERTA
      );
      setOrders(active);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh a cada 60s (ideal para TV)
    intervalRef.current = setInterval(() => load(true), 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleAdvance = async (id: string, nextStatus: string) => {
    setAdvancing(id);
    try {
      await serviceOrdersApi.updateStatus(id, { status: nextStatus });
      await load(true);
    } catch {
      setError('Erro ao avançar status');
    } finally {
      setAdvancing(null);
    }
  };

  const ordersForColumn = (status: string) =>
    orders.filter((o) =>
      o.status === status || (status === 'ABERTA' && o.status === 'ORCAMENTO')
    );

  const totalActive = orders.length;

  return (
    <div className={`min-h-screen flex flex-col ${tvMode ? 'bg-slate-950' : 'bg-slate-950'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 border-b border-white/10 ${tvMode ? 'py-3' : 'py-4'}`}>
        <div className="flex items-center gap-3">
          <Tv2 className="text-cyan-400 w-5 h-5" />
          <div>
            <h1 className={`font-black text-white ${tvMode ? 'text-2xl' : 'text-lg'}`}>
              Kanban de Pátio
            </h1>
            <p className="text-slate-500 text-xs">
              {tenant?.name} · {totalActive} OS ativas · atualizado {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => load(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button
            onClick={() => setTvMode((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${tvMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            {tvMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {tvMode ? 'Sair do modo TV' : 'Modo TV'}
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mx-6 mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">
            <AlertCircle size={15} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      {loading && orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-cyan-400" size={40} />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className={`flex gap-3 p-4 h-full min-w-max`} style={{ minHeight: 'calc(100vh - 80px)' }}>
            {KANBAN_COLUMNS.map((col) => {
              const colOrders = ordersForColumn(col.status);
              return (
                <div
                  key={col.status}
                  className={`flex flex-col ${tvMode ? 'w-72' : 'w-64'} shrink-0`}
                >
                  {/* Column header */}
                  <div className={`flex items-center gap-2 mb-3 px-1`}>
                    <span className={`w-2 h-2 rounded-full ${col.dot} shrink-0`} />
                    <span className={`font-bold text-white truncate ${tvMode ? 'text-base' : 'text-sm'}`}>
                      {col.label}
                    </span>
                    <span className={`ml-auto text-xs font-black px-2 py-0.5 rounded-full ${col.bg} ${col.dot.replace('bg-', 'text-')}`}>
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Column body */}
                  <div className={`flex-1 rounded-2xl border ${col.color}/30 ${col.bg} p-2 space-y-2 overflow-y-auto`}
                    style={{ minHeight: 120 }}>
                    <AnimatePresence>
                      {colOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-16 text-slate-600 text-xs">
                          vazio
                        </div>
                      ) : (
                        colOrders.map((os) => (
                          <KanbanCard
                            key={os.id}
                            os={os}
                            onAdvance={handleAdvance}
                            advancing={advancing}
                            tvMode={tvMode}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
