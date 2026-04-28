import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { serviceOrdersApi, customersApi, vehiclesApi, inventoryApi, financialApi } from '../api/client';
import {
  Users, Car, ClipboardList, DollarSign, TrendingUp,
  Clock, CheckCircle, Loader2, Zap, ArrowRight, Plus,
  Package, Activity, Calendar, AlertTriangle, Wrench,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { cn } from '../lib/utils';

const PENDING_STATUSES = ['ABERTA', 'EM_DIAGNOSTICO', 'ORCAMENTO_PRONTO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'EM_EXECUCAO', 'AGUARDANDO_PECAS'];
const COMPLETED_STATUSES = ['PRONTO_ENTREGA', 'FATURADO', 'ENTREGUE'];

const STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta', EM_DIAGNOSTICO: 'Diagnóstico', ORCAMENTO_PRONTO: 'Orçamento',
  AGUARDANDO_APROVACAO: 'Ag. Aprovação', APROVADO: 'Aprovado', AGUARDANDO_PECAS: 'Ag. Peças',
  EM_EXECUCAO: 'Execução', PRONTO_ENTREGA: 'Pronto', FATURADO: 'Faturado', ENTREGUE: 'Entregue',
};

const STATUS_COLORS: Record<string, string> = {
  ABERTA: '#94a3b8', EM_DIAGNOSTICO: '#818cf8', ORCAMENTO_PRONTO: '#60a5fa',
  AGUARDANDO_APROVACAO: '#fb923c', APROVADO: '#34d399', AGUARDANDO_PECAS: '#fbbf24',
  EM_EXECUCAO: '#22d3ee', PRONTO_ENTREGA: '#a78bfa', FATURADO: '#4ade80', ENTREGUE: '#1e293b',
};

function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleDateString('pt-BR', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() });
  }
  return months;
}

export function DashboardPage() {
  const { user, tenant } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, completedOrders: 0,
    totalCustomers: 0, totalVehicles: 0, revenue: 0,
    lowStockCount: 0, activeServices: 0, waitingParts: 0,
    scheduledToday: 0, canceledOrders: 0,
  });

  const planName = tenant?.subscription?.plan?.name || 'START';
  const userName = user?.name || 'Usuário';
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }, []);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [ordersRes, customersRes, vehiclesRes, inventoryRes, finRes] = await Promise.all([
        serviceOrdersApi.getAll(),
        customersApi.getAll(),
        vehiclesApi.getAll(),
        inventoryApi.getAllParts(),
        financialApi.getAll(),
      ]);
      const allOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
      const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
      const parts = Array.isArray(inventoryRes.data) ? inventoryRes.data : [];
      const financial = Array.isArray(finRes.data) ? finRes.data : [];
      const todayStr = new Date().toDateString();
      setOrders(allOrders);
      setFinancialData(financial);
      setStats({
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter((o: any) => PENDING_STATUSES.includes(o.status)).length,
        completedOrders: allOrders.filter((o: any) => COMPLETED_STATUSES.includes(o.status)).length,
        canceledOrders: allOrders.filter((o: any) => o.status === 'CANCELADO').length,
        totalCustomers: customers.length,
        totalVehicles: vehicles.length,
        activeServices: allOrders.filter((o: any) => o.status === 'EM_EXECUCAO').length,
        waitingParts: allOrders.filter((o: any) => o.status === 'AGUARDANDO_PECAS').length,
        scheduledToday: allOrders.filter((o: any) => o.scheduledDate && new Date(o.scheduledDate).toDateString() === todayStr).length,
        lowStockCount: parts.filter((p: any) => (p.currentStock || 0) <= (p.minStock || 0)).length,
        revenue: allOrders.filter((o: any) => COMPLETED_STATUSES.includes(o.status)).reduce((s: number, o: any) => s + Number(o.totalCost || 0), 0),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Gráfico 1: OS por status
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, count]) => ({ name: STATUS_LABELS[status] || status, count, status }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  // Gráfico 2: Faturamento últimos 6 meses
  const revenueChartData = useMemo(() => {
    const months = getLast6Months();
    return months.map(({ label, month, year }) => {
      const revenue = orders
        .filter((o) => {
          if (!COMPLETED_STATUSES.includes(o.status)) return false;
          const d = new Date(o.updatedAt || o.createdAt);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((s, o) => s + Number(o.totalCost || 0), 0);
      return { name: label, faturamento: revenue };
    });
  }, [orders]);

  // Gráfico 3: Distribuição tipo de OS (concluída vs em aberto vs cancelada)
  const pieData = [
    { name: 'Concluídas', value: stats.completedOrders, fill: '#34d399' },
    { name: 'Em Aberto', value: stats.pendingOrders, fill: '#fb923c' },
    { name: 'Canceladas', value: stats.canceledOrders, fill: '#f87171' },
  ].filter((d) => d.value > 0);

  const insightMessage = useMemo(() => {
    if (stats.waitingParts > 0) return `${stats.waitingParts} OS aguardando peças. Verifique os fornecedores.`;
    if (stats.lowStockCount > 0) return `${stats.lowStockCount} ${stats.lowStockCount === 1 ? 'peça está' : 'peças estão'} abaixo do mínimo.`;
    if (stats.activeServices > 0) return `${stats.activeServices} OS em execução agora. Tudo dentro do esperado.`;
    return 'Nenhum alerta crítico. Sua oficina está operando bem!';
  }, [stats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
        <p className="text-slate-500 font-medium animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  const kpiCards = [
    { title: 'Faturamento', value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-emerald-500', trend: `${stats.completedOrders} OS concluídas`, to: '/financial' },
    { title: 'OS em Aberto', value: stats.pendingOrders, icon: ClipboardList, color: 'bg-orange-500', trend: `${stats.activeServices} em execução`, to: '/service-orders' },
    { title: 'Clientes', value: stats.totalCustomers, icon: Users, color: 'bg-blue-500', trend: `${stats.totalVehicles} veículos`, to: '/customers' },
    { title: 'Alerta Estoque', value: stats.lowStockCount, icon: Package, color: stats.lowStockCount > 0 ? 'bg-red-500' : 'bg-slate-400', trend: stats.lowStockCount > 0 ? 'Reposição necessária' : 'Estoque em dia', to: '/inventory' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-8 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Activity size={14} /> Painel de Inteligência
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {greeting}, <span className="text-primary-600">{userName.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate('/service-orders?new=true')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 self-start md:self-auto">
          <Plus size={18} /> Nova OS
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => navigate(kpi.to)}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
            <div className="relative z-10">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform', kpi.color)}>
                <kpi.icon size={22} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{kpi.value}</h3>
              <p className="mt-3 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full inline-block">{kpi.trend}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-slate-50 rounded-full opacity-60 group-hover:scale-[3] transition-transform duration-700" />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Faturamento últimos 6 meses */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Faturamento — Últimos 6 Meses</h3>
            <p className="text-sm text-slate-400 font-medium">Receita de OS concluídas por período</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 700 }}
                formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
              />
              <Bar dataKey="faturamento" radius={[8, 8, 0, 0]} fill="#1e293b" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pizza / Distribuição OS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Distribuição de OS</h3>
            <p className="text-sm text-slate-400 font-medium">{stats.totalOrders} ordens no total</p>
          </div>
          {stats.totalOrders === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-slate-300">
              <div className="text-center">
                <ClipboardList className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-bold">Nenhuma OS ainda</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 700 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* OS por Status (Bar) + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* OS por Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Volume por Status</h3>
            <p className="text-sm text-slate-400 font-medium">Ordens de serviço distribuídas pelo funil</p>
          </div>
          {statusChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-slate-300">
              <div className="text-center">
                <ClipboardList className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-bold">Crie sua primeira OS</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusChartData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 700 }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} label={{ position: 'right', fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Alertas e Insights */}
        <div className="space-y-4">
          {/* Insight Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-7 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="text-amber-400" size={20} fill="currentColor" />
              </div>
              <h3 className="text-base font-black mb-2 tracking-tight">Insight</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-5">{insightMessage}</p>
              <button onClick={() => navigate('/service-orders')}
                className="w-full py-3 bg-white text-slate-900 font-black rounded-xl hover:bg-slate-100 transition-all active:scale-95 text-sm">
                Ver Ordens
              </button>
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
          </motion.div>

          {/* Alertas */}
          <div className="space-y-3">
            {stats.lowStockCount > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => navigate('/inventory')}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-red-200 transition-colors">
                <div className="w-9 h-9 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-900">Estoque Crítico</p>
                  <p className="text-xs text-red-600">{stats.lowStockCount} itens abaixo do mínimo</p>
                </div>
                <ArrowRight size={14} className="text-red-400 shrink-0" />
              </motion.div>
            )}
            {stats.waitingParts > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => navigate('/service-orders')}
                className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-amber-200 transition-colors">
                <div className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <Wrench size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-900">Aguardando Peças</p>
                  <p className="text-xs text-amber-600">{stats.waitingParts} OS bloqueadas</p>
                </div>
                <ArrowRight size={14} className="text-amber-400 shrink-0" />
              </motion.div>
            )}
            {stats.scheduledToday > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => navigate('/service-orders')}
                className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-blue-200 transition-colors">
                <div className="w-9 h-9 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-900">Agendamentos Hoje</p>
                  <p className="text-xs text-blue-600">{stats.scheduledToday} OS agendadas</p>
                </div>
                <ArrowRight size={14} className="text-blue-400 shrink-0" />
              </motion.div>
            )}
            {stats.lowStockCount === 0 && stats.waitingParts === 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Tudo em ordem</p>
                  <p className="text-xs text-emerald-600">Sem alertas críticos no momento</p>
                </div>
              </div>
            )}
          </div>

          {planName === 'START' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col items-center text-center">
              <TrendingUp className="text-slate-400 mb-3" size={28} />
              <h4 className="font-bold text-slate-900 text-sm">Potencialize com PRO</h4>
              <p className="text-xs text-slate-500 mt-1.5 mb-4 leading-relaxed">
                WhatsApp automático, Kanban de pátio e muito mais.
              </p>
              <button onClick={() => navigate('/settings')} className="text-xs font-black text-primary-600 hover:underline">
                Ver planos →
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
