import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { serviceOrdersApi, customersApi, vehiclesApi, inventoryApi } from '../api/client';
import {
  Users,
  Car,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  ArrowRight,
  Plus,
  Package,
  Activity,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function DashboardPage() {
  const { user, tenant } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    totalVehicles: 0,
    revenue: 0,
    lowStockCount: 0,
    activeServices: 0,
  });

  const planName = tenant?.subscription?.plan?.name || 'BASIC';
  const userName = user?.name || 'Usuário';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [ordersRes, customersRes, vehiclesRes, inventoryRes] = await Promise.all([
        serviceOrdersApi.getAll(),
        customersApi.getAll(),
        vehiclesApi.getAll(),
        inventoryApi.getAllParts(),
      ]);

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
      const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
      const parts = Array.isArray(inventoryRes.data) ? inventoryRes.data : [];

      const pendingStatuses = ['ORCAMENTO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'EM_EXECUCAO', 'AGUARDANDO_PECAS'];
      const completedStatuses = ['PRONTO', 'FINALIZADO', 'PAGO_PENDENTE', 'PAGO'];
      const activeStatuses = ['EM_EXECUCAO'];

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: any) => pendingStatuses.includes(o.status)).length,
        completedOrders: orders.filter((o: any) => completedStatuses.includes(o.status)).length,
        totalCustomers: customers.length,
        totalVehicles: vehicles.length,
        activeServices: orders.filter((o: any) => activeStatuses.includes(o.status)).length,
        lowStockCount: parts.filter((p: any) => (p.currentStock || 0) <= (p.minStock || 0)).length,
        revenue: orders.reduce(
          (sum: number, o: any) => sum + Number(o.totalCost || 0),
          0
        ),
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'Faturamento Total',
      value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      trend: '+12.5%',
      to: '/financial',
    },
    {
      title: 'OS Ativas',
      value: stats.pendingOrders,
      icon: ClipboardList,
      color: 'bg-orange-500',
      trend: `${stats.activeServices} em execução`,
      to: '/service-orders',
    },
    {
      title: 'Base de Clientes',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+4 novos hoje',
      to: '/customers',
    },
    {
      title: 'Peças em Alerta',
      value: stats.lowStockCount,
      icon: Package,
      color: stats.lowStockCount > 0 ? 'bg-red-500' : 'bg-slate-400',
      trend: stats.lowStockCount > 0 ? 'Reposição necessária' : 'Estoque em dia',
      to: '/inventory',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <p className="text-slate-500 font-medium animate-pulse">Carregando painel de controle...</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-10"
    >
      {/* Header com BI Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 text-primary-600 font-bold text-sm uppercase tracking-widest mb-1">
            <Activity size={16} /> Painel de Inteligência
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {greeting}, <span className="text-primary-600">{userName.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Visão geral da sua oficina para <span className="text-slate-900 font-bold">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex gap-2">
          <button onClick={() => navigate('/service-orders?new=true')} className="btn btn-primary shadow-lg shadow-primary-500/20">
            <Plus size={18} /> Nova Ordem de Serviço
          </button>
        </motion.div>
      </div>

      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
            onClick={() => navigate(kpi.to)}
          >
            <div className="relative z-10">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform", kpi.color)}>
                <kpi.icon size={24} />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{kpi.value}</h3>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <span className={cn(
                  "px-2 py-0.5 rounded-full",
                  kpi.color === 'bg-red-500' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"
                )}>
                  {kpi.trend}
                </span>
              </div>
            </div>
            {/* Background Decor */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
          </motion.div>
        ))}
      </div>

      {/* BI Visualizations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Production Efficiency */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Eficiência de Produção</h3>
                <p className="text-sm text-slate-500">Fluxo de trabalho e conclusões</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                   <div className="w-2 h-2 rounded-full bg-primary-500" /> Concluídas
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                   <div className="w-2 h-2 rounded-full bg-orange-500" /> Pendentes
                 </div>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Progress Concluded */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700">Taxa de Sucesso (OS Finalizadas)</span>
                  </div>
                  <span className="text-lg font-black text-slate-900">
                    {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0}%` }}
                     transition={{ duration: 1, ease: "circOut" }}
                     className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                   />
                </div>
              </div>

              {/* Progress Pending */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-orange-500" />
                    <span className="text-sm font-bold text-slate-700">Carga de Trabalho (OS em Aberto)</span>
                  </div>
                  <span className="text-lg font-black text-slate-900">
                    {stats.pendingOrders} <span className="text-slate-400 text-sm font-medium">unidades</span>
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%` }}
                     transition={{ duration: 1, ease: "circOut", delay: 0.2 }}
                     className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                   />
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase mb-1">Média Mensal</p>
                 <p className="text-lg font-black text-slate-900">12.4 OS/dia</p>
               </div>
               <div className="border-x border-slate-100">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tempo Médio</p>
                 <p className="text-lg font-black text-slate-900">4.2 horas</p>
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase mb-1">Retorno (Garantia)</p>
                 <p className="text-lg font-black text-slate-900 text-emerald-500">1.2%</p>
               </div>
            </div>
          </motion.div>

          {/* Quick Shortcuts */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div 
               onClick={() => navigate('/inventory')}
               className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-all"
             >
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                   <Package size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold">Reposição de Estoque</h4>
                   <p className="text-xs text-slate-400">Ver itens com baixo estoque</p>
                 </div>
               </div>
               <ArrowRight className="text-slate-600 group-hover:text-white transition-colors" />
             </div>

             <div 
               onClick={() => navigate('/customers')}
               className="p-6 bg-white rounded-[2rem] border border-slate-200 flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-all"
             >
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                   <Users size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-900">CRM Clientes</h4>
                   <p className="text-xs text-slate-500">Fidelização e comunicações</p>
                 </div>
               </div>
               <ArrowRight className="text-slate-300 group-hover:text-primary-600 transition-colors" />
             </div>
          </motion.div>
        </div>

        {/* Right: Insights & Alerts */}
        <div className="space-y-8">
          {/* AI Insights Card */}
          <motion.div 
            variants={itemVariants} 
            className="bg-gradient-to-br from-midnight-950 to-midnight-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
                <Zap className="text-amber-400" size={24} fill="currentColor" />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">IA Insights</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                Detectamos que <span className="text-white font-bold">4 veículos</span> estão aguardando peças há mais de 48h. Acelere a compra para liberar box.
              </p>
              <button className="w-full py-4 bg-white text-midnight-950 font-black rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-lg">
                Ver Plano de Ação
              </button>
            </div>
            
            {/* Shapes */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
          </motion.div>

          {/* Urgent Alerts */}
          <motion.div variants={itemVariants} className="space-y-4">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Alertas Críticos</h4>
             
             {stats.lowStockCount > 0 && (
               <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4">
                 <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                   <AlertTriangle size={20} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-red-900">Estoque Crítico</p>
                   <p className="text-xs text-red-600 truncate">{stats.lowStockCount} itens abaixo do mínimo</p>
                 </div>
                 <button onClick={() => navigate('/inventory')} className="text-red-900 hover:bg-red-200/50 p-2 rounded-lg transition-colors">
                   <ArrowRight size={16} />
                 </button>
               </div>
             )}

             <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4">
               <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                 <Calendar size={20} />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-amber-900">Agendamentos</p>
                 <p className="text-xs text-amber-600 truncate">8 revisões para amanhã</p>
               </div>
               <button className="text-amber-900 hover:bg-amber-200/50 p-2 rounded-lg transition-colors">
                 <ArrowRight size={16} />
               </button>
             </div>
          </motion.div>

          {/* Plan Summary */}
          {planName === 'BASIC' && (
            <motion.div variants={itemVariants} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 flex flex-col items-center text-center">
              <TrendingUp className="text-slate-400 mb-4" size={32} />
              <h4 className="font-bold text-slate-900">Potencialize sua Oficina</h4>
              <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
                O plano <span className="font-bold text-primary-600">PREMIUM</span> inclui BI avançado e gestão automática de margem de lucro.
              </p>
              <button onClick={() => navigate('/settings')} className="text-sm font-black text-primary-600 hover:underline">
                Conhecer Recursos PRO
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}