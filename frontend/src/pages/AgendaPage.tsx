import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { serviceOrdersApi } from '../api/client';
import { Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw, Loader2 } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  ABERTA: 'bg-slate-200 text-slate-700',
  EM_DIAGNOSTICO: 'bg-indigo-100 text-indigo-700',
  ORCAMENTO_PRONTO: 'bg-blue-100 text-blue-700',
  AGUARDANDO_APROVACAO: 'bg-amber-100 text-amber-700',
  APROVADO: 'bg-emerald-100 text-emerald-700',
  EM_EXECUCAO: 'bg-cyan-100 text-cyan-700',
  AGUARDANDO_PECAS: 'bg-yellow-100 text-yellow-700',
  PRONTO_ENTREGA: 'bg-violet-100 text-violet-700',
  FATURADO: 'bg-green-100 text-green-700',
  ENTREGUE: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_DIAGNOSTICO: 'Diagnóstico',
  ORCAMENTO_PRONTO: 'Orçamento',
  AGUARDANDO_APROVACAO: 'Ag. Aprovação',
  APROVADO: 'Aprovado',
  EM_EXECUCAO: 'Em Execução',
  AGUARDANDO_PECAS: 'Ag. Peças',
  PRONTO_ENTREGA: 'Pronto p/ Entrega',
  FATURADO: 'Faturado',
  ENTREGUE: 'Entregue',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getWeekDays(referenceDate: Date): Date[] {
  const day = referenceDate.getDay(); // 0=dom
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - day); // começa no domingo
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function AgendaPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana atual

  const referenceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(referenceDate), [referenceDate]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await serviceOrdersApi.getAll();
      const all: any[] = Array.isArray(res.data) ? res.data : [];
      setOrders(all.filter((o) => o.scheduledDate));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const ordersForDay = (day: Date) =>
    orders
      .filter((o) => isSameDay(new Date(o.scheduledDate), day))
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const today = new Date();
  const weekLabel = `${weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const totalSemana = useMemo(
    () => weekDays.reduce((acc, d) => acc + ordersForDay(d).length, 0),
    [orders, weekDays],
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="text-blue-500" size={22} />
            Agenda da Semana
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{weekLabel} · {totalSemana} OS agendada{totalSemana !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(0)} className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            Hoje
          </button>
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
            <ChevronRight size={16} />
          </button>
          <button onClick={load} disabled={loading} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button
            onClick={() => navigate('/service-orders')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg"
          >
            <Plus size={14} />
            Nova OS
          </button>
        </div>
      </div>

      {/* Grade semanal */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const dayOrders = ordersForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={`rounded-2xl border flex flex-col min-h-[220px] ${
                isToday
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Cabeçalho do dia */}
              <div className={`px-3 py-2 rounded-t-2xl border-b ${isToday ? 'border-blue-200 bg-blue-100' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                  {WEEKDAYS[day.getDay()]}
                </p>
                <p className={`text-xl font-black leading-tight ${isToday ? 'text-blue-700' : 'text-slate-800'}`}>
                  {day.getDate()}
                </p>
                {dayOrders.length > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isToday ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {dayOrders.length}
                  </span>
                )}
              </div>

              {/* Itens do dia */}
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                {dayOrders.length === 0 && (
                  <p className="text-[10px] text-slate-300 text-center mt-4">—</p>
                )}
                {dayOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate('/service-orders')}
                    className="w-full text-left rounded-xl p-2 bg-white border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-[10px] font-black text-slate-500 mb-0.5">{fmtTime(o.scheduledDate)}</p>
                    <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{o.customer?.name || 'Cliente'}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {o.vehicle ? `${o.vehicle.brand} ${o.vehicle.model}` : (o.equipmentBrand || 'Sem veículo')}
                    </p>
                    <span className={`mt-1 inline-block text-[8px] font-black px-1.5 py-0.5 rounded-full ${STATUS_COLOR[o.status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista consolidada */}
      {totalSemana > 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Lista da Semana</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {weekDays.flatMap((day) =>
              ordersForDay(day).map((o) => (
                <div
                  key={o.id}
                  onClick={() => navigate('/service-orders')}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="w-20 shrink-0 text-right">
                    <p className="text-xs font-black text-slate-700">
                      {WEEKDAYS[day.getDay()]}, {day.getDate()}/{day.getMonth() + 1}
                    </p>
                    <p className="text-[11px] text-blue-600 font-bold">{fmtTime(o.scheduledDate)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{o.customer?.name || 'Cliente'}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {o.vehicle ? `${o.vehicle.brand} ${o.vehicle.model} — ${o.vehicle.plate}` : (o.equipmentBrand || 'Sem veículo')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                    <span className="text-[10px] font-mono font-black text-slate-400">#{o.id.slice(-5).toUpperCase()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!loading && totalSemana === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">Nenhum agendamento nesta semana</p>
          <p className="text-sm mt-1">Crie uma OS e defina uma data/hora de agendamento</p>
        </div>
      )}
    </motion.div>
  );
}
