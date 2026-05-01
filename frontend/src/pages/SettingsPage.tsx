import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { tenantsApi, subscriptionsApi, usersApi } from '../api/client';
import {
  Building,
  Users,
  Shield,
  Loader2,
  CheckCircle,
  Zap,
  ArrowRight,
  Wrench,
  Lock,
  Search,
  AlertCircle,
  Plus,
  X,
  Eye,
  EyeOff,
  Trash2,
  UserCheck,
  UserX,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  formatCpfCnpj,
  formatPhone,
  formatCep,
  lookupCnpj,
  onlyDigits,
} from '../lib/masks';

type TenantForm = {
  taxId: string;
  legalNature: string;
  name: string;
  legalName: string;
  tradeName: string;
  stateRegistration: string;
  municipalRegistration: string;
  phone: string;
  email: string;
  address: string;
};

export function SettingsPage() {
  const { user, updateTenant } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingOps, setSavingOps] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lookingUpDoc, setLookingUpDoc] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [tenantData, setTenantData] = useState<TenantForm>({
    taxId: '',
    legalNature: 'PJ',
    name: '',
    legalName: '',
    tradeName: '',
    stateRegistration: '',
    municipalRegistration: '',
    phone: '',
    email: '',
    address: '',
  });
  const [opsData, setOpsData] = useState({ laborHourlyRate: 120, diagnosticHours: 0.5 });
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const isMaster = user?.role === 'MASTER';
  const canManageUsers = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const ROLE_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
    MASTER:     { label: 'Master',     color: 'bg-slate-900 text-white',          desc: 'Proprietário — acesso total' },
    ADMIN:      { label: 'Admin',      color: 'bg-violet-100 text-violet-700',    desc: 'Gerência administrativa' },
    GERENTE:    { label: 'Gerente',    color: 'bg-blue-100 text-blue-700',        desc: 'Gerência operacional' },
    FINANCEIRO: { label: 'Financeiro', color: 'bg-emerald-100 text-emerald-700',  desc: 'Fechamento e pagamentos' },
    SECRETARIA: { label: 'Secretaria', color: 'bg-cyan-100 text-cyan-700',        desc: 'Recepção e cadastros' },
    MECANICO:   { label: 'Mecânico',   color: 'bg-amber-100 text-amber-700',      desc: 'Execução de serviços' },
    PRODUTIVO:  { label: 'Produtivo',  color: 'bg-amber-100 text-amber-800',      desc: 'Técnico (legado)' },
  };

  const assignableRoles = isMaster
    ? ['ADMIN', 'GERENTE', 'FINANCEIRO', 'SECRETARIA', 'MECANICO']
    : ['GERENTE', 'FINANCEIRO', 'SECRETARIA', 'MECANICO'];

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ name: '', email: '', password: '', role: 'MECANICO' });
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    setAddUserError(null);
    try {
      await usersApi.create(addUserForm);
      setShowAddUserModal(false);
      setAddUserForm({ name: '', email: '', password: '', role: 'MECANICO' });
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch (err: any) {
      setAddUserError(err.response?.data?.message || 'Erro ao criar usuário');
    } finally {
      setAddingUser(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    setUpdatingUser(userId);
    try {
      await usersApi.update(userId, { role });
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao alterar perfil');
    } finally {
      setUpdatingUser(null);
      setEditingRole(null);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setUpdatingUser(userId);
    try {
      await usersApi.update(userId, { isActive: !isActive });
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao atualizar usuário');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Remover ${userName} da equipe? Esta ação não pode ser desfeita.`)) return;
    setUpdatingUser(userId);
    try {
      await usersApi.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao remover usuário');
    } finally {
      setUpdatingUser(null);
    }
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tenantResult, subResult, plansResult, usersResult] = await Promise.allSettled([
        tenantsApi.getMe(),
        subscriptionsApi.getCurrent(),
        subscriptionsApi.getPlans(),
        usersApi.getAll(),
      ]);

      if (tenantResult.status === 'fulfilled') {
        const t = tenantResult.value.data;
        setTenantData({
          taxId: t.taxId || '',
          legalNature: t.legalNature || 'PJ',
          name: t.name || '',
          legalName: t.legalName || '',
          tradeName: t.tradeName || '',
          stateRegistration: t.stateRegistration || '',
          municipalRegistration: t.municipalRegistration || '',
          phone: t.phone || '',
          email: t.email || '',
          address: t.address || '',
        });
        setOpsData({ laborHourlyRate: t.laborHourlyRate ?? 120, diagnosticHours: t.diagnosticHours ?? 0.5 });
      } else {
        console.error('Falha ao carregar dados da oficina:', tenantResult.reason);
      }

      if (subResult.status === 'fulfilled') setSubscription(subResult.value.data);
      else console.warn('Assinatura indisponível:', subResult.reason);

      if (plansResult.status === 'fulfilled') setPlans(plansResult.value.data);
      else console.warn('Planos indisponíveis:', plansResult.reason);

      if (usersResult.status === 'fulfilled') setUsers(usersResult.value.data);
      else console.warn('Usuários indisponíveis:', usersResult.reason);
    } finally {
      setLoading(false);
    }
  };

  const handleDocChange = async (raw: string) => {
    const formatted = formatCpfCnpj(raw);
    const digits = onlyDigits(formatted);
    setTenantData(prev => ({ ...prev, taxId: formatted }));
    setLookupError(null);

    if (digits.length === 14) {
      setLookingUpDoc(true);
      const result = await lookupCnpj(digits);
      setLookingUpDoc(false);
      if (result) {
        setTenantData(prev => ({
          ...prev,
          taxId: formatted,
          legalName: result.razaoSocial || prev.legalName,
          name: result.nomeFantasia || prev.name,
          tradeName: result.nomeFantasia || prev.tradeName,
          phone: result.telefone || prev.phone,
          email: result.email || prev.email,
          address: result.logradouro || prev.address,
        }));
      } else {
        setLookupError('CNPJ não encontrado na Receita Federal. Preencha manualmente.');
      }
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await tenantsApi.update(tenantData);
      // Recarrega dados atualizados e sincroniza o authStore (atualiza nome na sidebar)
      const freshRes = await tenantsApi.getMe();
      const fresh = freshRes.data;
      updateTenant({
        id: fresh.id,
        name: fresh.name,
        subscription: fresh.subscription,
      });
      // Atualiza também o estado local para refletir os dados salvos
      setTenantData(prev => ({ ...prev, ...tenantData }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Falha ao salvar oficina:', error);
      setSaveError(error?.response?.data?.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOps = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOps(true);
    try {
      await tenantsApi.update({ laborHourlyRate: Number(opsData.laborHourlyRate), diagnosticHours: Number(opsData.diagnosticHours) });
    } catch (error) {
      console.error('Falha ao salvar configurações operacionais:', error);
    } finally {
      setSavingOps(false);
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

  const handleCheckoutPlan = async (planName: string) => {
    setCheckoutLoadingPlan(planName);
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/settings?checkout=success&plan=${planName}`;
      const cancelUrl = `${origin}/settings?checkout=cancel`;
      const response = await subscriptionsApi.createCheckout(planName, successUrl, cancelUrl);
      const checkoutUrl = response.data?.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error('Checkout indisponível para este plano');
      }

      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Falha ao iniciar checkout online';
      alert(message);
    } finally {
      setCheckoutLoadingPlan(null);
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
        <p className="text-slate-500 font-medium">Gestão da oficina, operações, equipe e assinatura</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Perfil da Oficina */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5" /> Cadastro da Oficina
              </h2>
            </div>
            <form onSubmit={handleSaveTenant} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* 1º campo: CPF / CNPJ com lookup automático */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    CPF / CNPJ
                    <span className="ml-2 text-xs text-slate-400 font-normal">(preencha primeiro — CNPJ busca dados automaticamente)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={tenantData.legalNature === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                      value={tenantData.taxId}
                      onChange={(e) => handleDocChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {lookingUpDoc
                        ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        : <Search className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  {lookupError && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                      <AlertCircle className="w-3.5 h-3.5" /> {lookupError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Natureza Jurídica</label>
                  <select
                    value={tenantData.legalNature}
                    onChange={(e) => setTenantData({ ...tenantData, legalNature: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="PF">Pessoa Física (PF)</option>
                    <option value="PJ">Pessoa Jurídica (PJ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={tenantData.name}
                    onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social / Nome Civil</label>
                  <input
                    type="text"
                    value={tenantData.legalName}
                    onChange={(e) => setTenantData({ ...tenantData, legalName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={tenantData.stateRegistration}
                    onChange={(e) => setTenantData({ ...tenantData, stateRegistration: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Municipal</label>
                  <input
                    type="text"
                    value={tenantData.municipalRegistration}
                    onChange={(e) => setTenantData({ ...tenantData, municipalRegistration: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="(00) 00000-0000"
                    value={tenantData.phone}
                    onChange={(e) => setTenantData({ ...tenantData, phone: formatPhone(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    inputMode="email"
                    placeholder="contato@suaoficina.com.br"
                    value={tenantData.email}
                    onChange={(e) => setTenantData({ ...tenantData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    value={tenantData.address}
                    onChange={(e) => setTenantData({ ...tenantData, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {saveError && (
                <p className="mt-4 flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {saveError}
                </p>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4" /> Perfil salvo com sucesso!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar Perfil'}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Configurações Operacionais */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <Wrench className="w-6 h-6" /> Configurações Operacionais
              </h2>
              {!isMaster && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                  <Lock className="w-3.5 h-3.5" /> Somente Administrador
                </div>
              )}
            </div>
            <form onSubmit={handleSaveOps} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Valor de Mão de Obra (R$/hora)
                  </label>
                  <p className="text-xs text-slate-400 ml-1 mb-2">
                    Base de cálculo para toda mão de obra nas ordens de serviço. Editável apenas pelo administrador.
                  </p>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={opsData.laborHourlyRate}
                      onChange={(e) => isMaster && setOpsData({ ...opsData, laborHourlyRate: Number(e.target.value) })}
                      disabled={!isMaster}
                      className={cn(
                        "w-full pl-12 pr-5 py-4 rounded-2xl border text-xl font-black transition-all",
                        isMaster
                          ? "border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
                          : "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                      )}
                    />
                  </div>
                </div>

                {/* Preview do cálculo */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Exemplo de Cálculo — Mão de Obra</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[0.5, 1.0, 2.0].map((h) => (
                      <div key={h} className="bg-white rounded-xl p-3 border border-slate-200">
                        <p className="text-xs text-slate-400 font-bold">{h === 0.5 ? '30 min' : h === 1.0 ? '1 hora' : '2 horas'}</p>
                        <p className="text-sm font-black text-slate-900 mt-1">
                          R$ {(opsData.laborHourlyRate * h).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Tempo mínimo: 30 min • Incremento: 30 em 30 min</p>
                </div>

                {/* Campo: Horas de Diagnóstico */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tempo Padrão de Diagnóstico (horas)</label>
                  <p className="text-xs text-slate-400 ml-1 mb-2">
                    Usado para gerar automaticamente a taxa de diagnóstico em orçamentos reprovados.
                  </p>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">h</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={opsData.diagnosticHours}
                      onChange={(e) => isMaster && setOpsData({ ...opsData, diagnosticHours: Number(e.target.value) })}
                      disabled={!isMaster}
                      className={cn(
                        "w-full pl-12 pr-5 py-4 rounded-2xl border text-xl font-black transition-all",
                        isMaster
                          ? "border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
                          : "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                      )}
                    />
                  </div>
                  <p className="text-xs text-slate-400 ml-1 mt-1">
                    ≈ R$ {(opsData.laborHourlyRate * opsData.diagnosticHours).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por diagnóstico
                    ({opsData.diagnosticHours}h × R$ {opsData.laborHourlyRate}/h)
                  </p>
                </div>
              </div>

              {isMaster && (
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={savingOps} className="btn btn-primary h-14 px-10 rounded-2xl font-black shadow-xl shadow-primary-500/20 active:scale-95 transition-all">
                    {savingOps ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Operações'}
                  </button>
                </div>
              )}
            </form>
          </motion.div>

          {/* Equipe */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                  <Users className="w-6 h-6" /> Sua Equipe
                </h2>
                <p className="text-xs text-slate-500 mt-1">{users.length} membro{users.length !== 1 ? 's' : ''}</p>
              </div>
              {canManageUsers && (
                <button
                  onClick={() => { setShowAddUserModal(true); setAddUserError(null); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all"
                >
                  <Plus size={14} /> Adicionar Membro
                </button>
              )}
            </div>

            {/* Legenda de perfis */}
            <div className="px-8 pt-6 pb-2 flex flex-wrap gap-2">
              {Object.entries(ROLE_CONFIG).filter(([k]) => k !== 'PRODUTIVO').map(([key, cfg]) => (
                <span key={key} className={cn('text-[9px] px-2 py-0.5 rounded-md font-black', cfg.color)}>
                  {cfg.label} — {cfg.desc}
                </span>
              ))}
            </div>

            <div className="p-8 pt-4 space-y-2">
              {users.map((u) => {
                const roleCfg = ROLE_CONFIG[u.role] ?? { label: u.role, color: 'bg-slate-100 text-slate-700', desc: '' };
                const isMe = u.id === user?.userId;
                const isMasterUser = u.role === 'MASTER';
                const canAct = canManageUsers && !isMe && !isMasterUser;
                const isUpdating = updatingUser === u.id;

                return (
                  <div
                    key={u.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-2xl border transition-all',
                      u.isActive ? 'bg-slate-50 border-slate-100 hover:border-slate-300' : 'bg-slate-50/50 border-slate-100 opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0', roleCfg.color)}>
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                          {isMe && <span className="text-[9px] px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded font-black">Você</span>}
                          {!u.isActive && <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-black">Inativo</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {/* Badge / seletor de role */}
                      {canAct ? (
                        <div className="relative">
                          <button
                            onClick={() => setEditingRole(editingRole === u.id ? null : u.id)}
                            className={cn('flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-lg font-black transition-all hover:ring-2 hover:ring-offset-1 hover:ring-slate-300', roleCfg.color)}
                          >
                            {roleCfg.label}
                            <ChevronDown size={9} className={cn('transition-transform', editingRole === u.id && 'rotate-180')} />
                          </button>
                          {editingRole === u.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 min-w-[170px]">
                              {assignableRoles.map((role) => (
                                <button
                                  key={role}
                                  onClick={() => handleUpdateRole(u.id, role)}
                                  disabled={isUpdating}
                                  className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-slate-50 text-left',
                                    u.role === role ? 'bg-slate-100' : ''
                                  )}
                                >
                                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', ROLE_CONFIG[role]?.color.split(' ')[0])} />
                                  <span>{ROLE_CONFIG[role]?.label ?? role}</span>
                                  <span className="text-slate-400 text-[9px] ml-auto">{ROLE_CONFIG[role]?.desc}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={cn('text-[9px] px-2.5 py-1 rounded-lg font-black', roleCfg.color)}>
                          {roleCfg.label}
                        </span>
                      )}

                      {/* Ativar/Desativar */}
                      {canAct && (
                        <button
                          onClick={() => handleToggleActive(u.id, u.isActive)}
                          disabled={isUpdating}
                          title={u.isActive ? 'Desativar usuário' : 'Reativar usuário'}
                          className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                            u.isActive
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          )}
                        >
                          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : u.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
                        </button>
                      )}

                      {/* Deletar (apenas MASTER) */}
                      {isMaster && !isMe && !isMasterUser && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={isUpdating}
                          title="Remover da equipe"
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {users.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">Nenhum membro cadastrado.</p>
              )}
            </div>
          </motion.div>

          {/* Modal: Adicionar Membro */}
          {showAddUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md mx-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Adicionar Membro</h3>
                  <button onClick={() => setShowAddUserModal(false)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Nome</label>
                    <input
                      type="text"
                      required
                      value={addUserForm.name}
                      onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                      placeholder="Nome completo"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">E-mail</label>
                    <input
                      type="email"
                      required
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Senha Provisória</label>
                    <div className="relative">
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={addUserForm.password}
                        onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                        className="w-full px-4 py-3 pr-12 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showAddPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Perfil de Acesso</label>
                    <div className="grid grid-cols-2 gap-2">
                      {assignableRoles.map((role) => {
                        const cfg = ROLE_CONFIG[role];
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setAddUserForm({ ...addUserForm, role })}
                            className={cn(
                              'p-3 rounded-2xl border-2 text-left transition-all',
                              addUserForm.role === role
                                ? 'border-slate-900 bg-slate-50 shadow-sm'
                                : 'border-slate-100 hover:border-slate-300'
                            )}
                          >
                            <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-black block mb-1 w-fit', cfg.color)}>{cfg.label}</span>
                            <p className="text-[10px] text-slate-500 font-medium">{cfg.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {addUserError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold">
                      {addUserError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={addingUser}
                    className="w-full h-12 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {addingUser ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {addingUser ? 'Criando...' : 'Adicionar à Equipe'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </div>

        {/* Sidebar — Assinatura */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight mb-8">
                <Shield className="w-6 h-6 text-primary-400" /> Assinatura
              </h2>

              <div className="mb-8 p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-md">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Plano Atual</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-white">{currentPlan}</h3>
                  <div className="px-2 py-0.5 bg-primary-500 rounded-md text-[9px] font-black uppercase">Ativo</div>
                </div>
                <p className="text-sm text-slate-400 mt-2 font-medium">Renovação automática em breve.</p>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mudar de Plano</p>
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      'w-full p-5 rounded-3xl border-2 transition-all text-left relative',
                      currentPlan === plan.name
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-white/10 bg-white/5'
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
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
                      {currentPlan === plan.name
                        ? <CheckCircle className="text-primary-400" size={24} />
                        : <ArrowRight className="text-slate-600" size={24} />
                      }
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => currentPlan !== plan.name && handleChangePlan(plan.name)}
                        disabled={currentPlan === plan.name}
                        className="h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wide transition-all"
                      >
                        Troca interna
                      </button>
                      <button
                        onClick={() => currentPlan !== plan.name && handleCheckoutPlan(plan.name)}
                        disabled={currentPlan === plan.name || checkoutLoadingPlan === plan.name}
                        className="h-10 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wide transition-all flex items-center justify-center gap-2"
                      >
                        {checkoutLoadingPlan === plan.name ? <Loader2 size={14} className="animate-spin" /> : null}
                        Comprar online
                      </button>
                    </div>
                  </div>
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
