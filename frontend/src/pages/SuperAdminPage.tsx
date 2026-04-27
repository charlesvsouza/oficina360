import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { managementApi } from '../api/client';
import { Building, User, Mail, Lock, Plus, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function SuperAdminPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await managementApi.listTenants();
      setTenants(response.data);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    try {
      await managementApi.setup({
        name,
        email,
        password,
        tenantName,
      });
      setMessage({ type: 'success', text: 'Tenant e Usuário criados com sucesso!' });
      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setTenantName('');
      fetchTenants();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erro ao criar tenant' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-blue-500" />
            Gestão Global de Tenants
          </h1>
          <p className="text-slate-400 mt-2">Área administrativa para criação manual de usuários e oficinas.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          Novo Tenant / Usuário
        </button>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl mb-8 flex items-center gap-3 border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <motion.div 
              key={tenant.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/40 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <Building className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{tenant.name}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{tenant.id.split('-')[0]}...</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Plano</span>
                  <span className="text-blue-400 font-bold">{tenant.subscription?.plan?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Usuários</span>
                  <span className="text-white font-semibold">{tenant._count?.users || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Criado em</span>
                  <span className="text-slate-300">{new Date(tenant.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-2">
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-xl transition-all">
                  Ver Detalhes
                </button>
                <button className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold py-2 rounded-xl transition-all">
                  Suspender
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal for Creation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-2">Criar Nova Instância</h2>
              <p className="text-slate-400 text-sm mb-8">Configure uma nova oficina e seu administrador principal.</p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest ml-1">Nome da Oficina</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500/40 transition-all"
                      placeholder="Oficina do Zé"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest ml-1">Admin Nome</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500/40 transition-all"
                        placeholder="João"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest ml-1">Admin Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500/40 transition-all"
                        placeholder="admin@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest ml-1">Senha Padrão</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500/40 transition-all"
                      placeholder="Mínimo 6 chars"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Criação'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
