import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Wrench, ArrowRight, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

const AUTO_ENTER_DURATION_MS = 60000;

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.ceil(AUTO_ENTER_DURATION_MS / 1000)
  );
  const hasNavigatedRef = useRef(false);

  const enterDashboard = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const highlights = useMemo(
    () => [
      {
        title: 'Gestão de O.S.',
        icon: Wrench,
        description: 'Fluxo completo desde o orçamento até a finalização.',
      },
      {
        title: 'Segurança',
        icon: ShieldCheck,
        description: 'Seus dados e de seus clientes protegidos e organizados.',
      },
      {
        title: 'Performance',
        icon: BarChart3,
        description: 'Indicadores financeiros e de produção em tempo real.',
      },
    ],
    []
  );

  useEffect(() => {
    const autoEnterTimer = window.setTimeout(() => {
      enterDashboard();
    }, AUTO_ENTER_DURATION_MS);

    const countdownTimer = window.setInterval(() => {
      setRemainingSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      window.clearTimeout(autoEnterTimer);
      window.clearInterval(countdownTimer);
    };
  }, [enterDashboard]);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center overflow-hidden relative">
      {/* Pulse Glow Effect in Center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]"
        />
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-4xl px-6"
      >
        <div className="glass-card bg-slate-900/40 p-8 md:p-12 rounded-[2.5rem] border border-white/10 relative overflow-hidden backdrop-blur-3xl">
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wrench className="text-white" size={24} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Sigma Auto</span>
              <p className="text-[11px] text-slate-400 mt-0.5 tracking-wide">Sistema para Oficina Mecânica | ERP Automotivo</p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-bold leading-tight mb-6 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent"
              >
                Bem-vindo ao seu <br />
                <span className="text-blue-400">Novo Escritório.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-slate-300 text-lg mb-8 leading-relaxed"
              >
                {user?.name
                  ? `Olá, ${user.name.split(' ')[0]}. Tudo pronto para levar sua oficina ao próximo nível com a Sigma Auto.`
                  : 'Sua plataforma de gestão automotiva completa está pronta.'}
              </motion.p>

               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.8 }}
               >
                 <button
                   onClick={enterDashboard}
                   className="group flex items-center gap-3 px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl hover:bg-blue-50 transition-all hover:scale-105 shadow-xl shadow-white/10"
                 >
                   Entrar
                   <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                 </button>
               </motion.div>
            </div>

            <div className="grid gap-4">
              {highlights.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (idx * 0.1) }}
                  className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-start gap-4 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-snug">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Sigma Auto Cloud Online</span>
            </div>
            
            <div className="flex flex-col md:items-end gap-2">
              <p className="text-xs text-slate-400">
                Iniciando em <span className="text-white font-bold">{remainingSeconds}s</span>
              </p>
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: AUTO_ENTER_DURATION_MS / 1000, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomePage;