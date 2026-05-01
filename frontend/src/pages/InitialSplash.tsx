import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Shield, Zap, Database, Cpu } from 'lucide-react';

const steps = [
  { id: 1, text: 'Iniciando Kernel...', icon: Cpu },
  { id: 2, text: 'Carregando Módulos do Sistema...', icon: Wrench },
  { id: 3, text: 'Estabelecendo Conexão Segura...', icon: Shield },
  { id: 4, text: 'Sincronizando Banco de Dados...', icon: Database },
  { id: 5, text: 'Otimizando Interface Premium...', icon: Zap },
];

export function InitialSplash() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setComplete(true);
      const timer = setTimeout(() => {
        navigate('/login');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, navigate]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Cinematic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] z-20 opacity-20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center z-10"
      >
        {/* Animated Logo Container */}
        <div className="relative mb-12">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              borderRadius: ["2rem", "3rem", "2rem"]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.3)] relative z-10"
          >
            <Wrench className="text-white" size={56} />
          </motion.div>
          
          {/* Pulsing rings */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0, 0.2, 0], scale: 1.5 + (i * 0.2) }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              className="absolute inset-0 border-2 border-blue-500 rounded-[2rem] z-0"
            />
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-6xl font-black tracking-tighter text-white mb-2 flex items-center gap-2">
            SIGMA<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">AUTO</span>
          </h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em] ml-1">
            Enterprise Management System
          </p>
        </motion.div>

        {/* Loading Progress */}
        <div className="mt-16 w-80">
          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden mb-4 relative">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStep / steps.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
            />
          </div>
          
          <div className="h-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentStep < steps.length ? (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 text-slate-400"
                >
                  {steps[currentStep] && (() => {
                    const StepIcon = steps[currentStep].icon;
                    return (
                      <>
                        <StepIcon size={14} className="text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{steps[currentStep].text}</span>
                      </>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
                >
                  <Shield size={14} /> Sistema Pronto
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Version Tag */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2">
        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Version 3.0.1 Premium</p>
        </div>
        <p className="text-[8px] text-slate-700 font-bold uppercase tracking-tighter">© 2026 LEXGEN DIGITAL SYSTEMS</p>
      </div>
    </div>
  );
}
