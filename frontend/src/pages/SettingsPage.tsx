import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { tenantsApi, subscriptionsApi, usersApi } from '../api/client';
import {
  Settings,
  Building,
  Mail,
  Phone,
  MapPin,
  Users,
  Shield,
  CreditCard,
  Loader2,
  CheckCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export function SettingsPage() {
  const { tenant, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantData, setTenantData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        subscriptionsApi.getCurrent(),
        subscriptionsApi.getPlans(),
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data);

      const tenantRes = await tenantsApi.getMe();
      setTenantData({
        name: tenantRes.data.name,
        email: tenantRes.data.email || '',
        phone: tenantRes.data.phone || '',
        address: tenantRes.data.address || '',
      });

      const usersRes = await usersApi.getAll();
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Falha ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsApi.update(tenantData);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Falha ao salvar oficina:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePlan = async (planName: string) => {
    if (confirm(`Deseja migrar para o plano ${planName}?`)) {
      try {
        await subscriptionsApi.changePlan(planName);
        loadData();
      } catch (error) {
        console.error('Falha ao trocar plano:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
        <p className="text-slate-500 font-medium">Carregando painel de controle...</p>
      </div>
    );
  }

  const currentPlan = subscription?.plan?.name || 'START';

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Configurações</h1>
        <p className="text-slate-500 font-medium">Gestão da oficina, equipe e planos de assinatura</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <Building className="w-6 h-6" />
                Perfil da Oficina
              </h2>
            </div>
            <form onSubmit={handleSaveTenant} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia / Razão</label>
                  <input
                    type="text"
                    value={tenantData.name}
                    onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone de Contato</label>
                  <input
                    type="text"
                    value={tenantData.phone}
                    onChange={(e) => setTenantData({ ...tenantData, phone: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-bold"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Público / Cobrança</label>
                  <input
                    type="email"
                    value={tenantData.email}
                    onChange={(e) => setTenantData({ ...tenantData, email: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-bold"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={tenantData.address}
                    onChange={(e) => setTenantData({ ...tenantData, address: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="btn btn-primary h-14 px-10 rounded-2xl font-black shadow-xl shadow-primary-500/20 active:scale-95 transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Configurações'}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <Users className="w-6 h-6" />
                Sua Equipe
              </h2>
            </div>
            <div className="p-8 space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                    </div>
                  </div>
                  <span className="inline-flex px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight mb-8">
                <Shield className="w-6 h-6 text-primary-400" />
                Assinatura
              </h2>
              
              <div className="mb-8 p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-md">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Plano Atual</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-white">{currentPlan}</h3>
                  <div className="px-2 py-0.5 bg-primary-500 rounded-md text-[9px] font-black uppercase">Ativo</div>
                </div>
                <p className="text-sm text-slate-400 mt-2 font-medium">
                  Renovação automática em breve.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mudar de Plano</p>
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => currentPlan !== plan.name && handleChangePlan(plan.name)}
                    className={cn(
                      "w-full p-6 rounded-3xl border-2 transition-all text-left relative group",
                      currentPlan === plan.name
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-white/10 hover:border-white/30 bg-white/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="font-black text-lg uppercase tracking-tight">{plan.name}</p>
                           {plan.name === 'PRO' && <Zap size={14} className="text-primary-400 fill-primary-400" />}
                        </div>
                        <p className="text-2xl font-black mt-1">
                          R$ {Number(plan.price).toLocaleString('pt-BR')}
                          <span className="text-xs font-bold text-slate-400 ml-1">/mês</span>
                        </p>
                      </div>
                      {currentPlan === plan.name ? (
                        <CheckCircle className="text-primary-400" size={24} />
                      ) : (
                        <ArrowRight className="text-slate-600 group-hover:text-white transition-colors" size={24} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px]" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}