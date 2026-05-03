import { useEffect, useMemo, useState } from 'react';
import { commissionsApi, usersApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Loader2, DollarSign, CheckCircle2 } from 'lucide-react';

const money = (value: number) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function CommissionsPage() {
  const { user } = useAuthStore();
  const canMarkAsPaid = ['MASTER', 'ADMIN', 'FINANCEIRO'].includes(user?.role ?? '');

  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ total: 0, pending: 0, paid: 0 });
  const [filters, setFilters] = useState({
    status: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  const canFilterByUser = ['MASTER', 'ADMIN', 'FINANCEIRO', 'CHEFE_OFICINA'].includes(user?.role ?? '');

  const load = async () => {
    setLoading(true);
    try {
      const [commRes, usersRes] = await Promise.all([
        commissionsApi.getAll({
          status: filters.status || undefined,
          userId: filters.userId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        }),
        usersApi.getAll(),
      ]);
      setData(Array.isArray(commRes.data?.data) ? commRes.data.data : []);
      setTotals(commRes.data?.totals || { total: 0, pending: 0, paid: 0 });
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (error) {
      console.error('Erro ao carregar comissões', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(
    () => users.filter((u) => u.isActive),
    [users],
  );

  const markAsPaid = async (id: string) => {
    if (!canMarkAsPaid) return;
    setPayingId(id);
    try {
      await commissionsApi.markAsPaid(id);
      await load();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Não foi possível marcar como paga.');
    } finally {
      setPayingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Comissões</h1>
          <p className="text-slate-500 font-medium">Controle por executor e por item de serviço.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{money(totals.total)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-5">
          <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Pendente</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{money(totals.pending)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200 p-5">
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Pago</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{money(totals.paid)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="input bg-slate-50 border-slate-200"
        >
          <option value="">Todos status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
        </select>

        <select
          value={filters.userId}
          onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          className="input bg-slate-50 border-slate-200"
          disabled={!canFilterByUser}
        >
          <option value="">Todos executores</option>
          {filteredUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="input bg-slate-50 border-slate-200"
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="input bg-slate-50 border-slate-200"
        />

        <button onClick={load} className="btn btn-primary">Filtrar</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-4 py-3 text-left">Executor</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">OS</th>
                <th className="px-4 py-3 text-right">Base</th>
                <th className="px-4 py-3 text-right">%</th>
                <th className="px-4 py-3 text-right">Comissão</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-bold text-slate-900">{row.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{row.serviceOrderItem?.description || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">#{String(row.serviceOrderId).slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-right">{money(row.baseValue)}</td>
                  <td className="px-4 py-3 text-right font-bold">{Number(row.commissionPercent).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">{money(row.commissionValue)}</td>
                  <td className="px-4 py-3">
                    {row.status === 'PAGO' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle2 size={12} /> Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                        <DollarSign size={12} /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canMarkAsPaid && row.status !== 'PAGO' ? (
                      <button
                        onClick={() => markAsPaid(row.id)}
                        disabled={payingId === row.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-60"
                      >
                        {payingId === row.id ? 'Salvando...' : 'Marcar pago'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">Nenhuma comissão encontrada no período.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
