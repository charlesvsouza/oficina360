import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Gauge, ShieldCheck, Zap,
  Menu, X, Wrench, BarChart3, Package, DollarSign,
  Users, ClipboardList, Star, Mail, Phone, MessageCircle,
  BookOpen, Newspaper, HeartHandshake, Trophy, Clock, Lock,
  ChevronRight, Send, Instagram, Facebook, Youtube, Linkedin, Twitter,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

type Plan = {
  name: 'START' | 'PRO' | 'REDE';
  label: string;
  price: string;
  period: string;
  description: string;
  highlights: string[];
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: 'START',
    label: 'Start',
    price: 'R$ 149',
    period: '/mes',
    description: 'Para oficinas iniciando com controle total da operacao.',
    highlights: ['Ordens de servico ilimitadas', 'Cadastro de clientes e veiculos', 'Relatorios basicos'],
  },
  {
    name: 'PRO',
    label: 'Pro',
    price: 'R$ 299',
    period: '/mes',
    description: 'Aceleracao com financeiro, estoque e produtividade em tempo real.',
    highlights: ['Financeiro completo', 'Controle de estoque', 'Indicadores operacionais', 'Multi-usuario'],
    featured: true,
  },
  {
    name: 'REDE',
    label: 'Rede',
    price: 'R$ 599',
    period: '/mes',
    description: 'Para grupos de oficinas com governanca, escala e padronizacao.',
    highlights: ['Multiplas unidades', 'Dashboard consolidado', 'Permissoes avancadas', 'Suporte prioritario'],
  },
];

const features = [
  { icon: Gauge, title: 'Dashboard em tempo real', desc: 'Metas, indicadores e performance da equipe num unico painel.' },
  { icon: ShieldCheck, title: 'Permissoes por papel', desc: 'Controle total de acesso: admin, produtor e financeiro.' },
  { icon: CheckCircle2, title: 'O.S. digital completa', desc: 'Abertura, execucao, aprovacao e fechamento sem papel.' },
  { icon: Zap, title: 'Estoque inteligente', desc: 'Alertas de reposicao e rastreio de pecas por ordem.' },
];

const navLinks = [
  { label: 'Notícias', href: '#noticias' },
  { label: 'Soluções', href: '#solucoes' },
  { label: 'Quem Somos', href: '#quem-somos' },
  { label: 'Diferenciais', href: '#diferenciais' },
  { label: 'Contato', href: '#contato' },
  { label: 'Suporte', href: '#suporte' },
];

const news = [
  {
    tag: 'Produto',
    date: 'Mai 2026',
    title: 'SigmaAuto lança bloqueio inteligente de downgrade de plano',
    excerpt: 'A plataforma agora protege o cliente de rebaixamentos acidentais de plano, garantindo continuidade operacional até o vencimento da assinatura atual.',
  },
  {
    tag: 'SEO',
    date: 'Mai 2026',
    title: 'Presença digital: SigmaAuto no ar com domínio próprio e sitemap',
    excerpt: 'Com o domínio sigmaauto.com.br configurado, sitemap.xml e robots.txt publicados, a plataforma está pronta para ser encontrada no Google.',
  },
  {
    tag: 'Experiência',
    date: 'Mai 2026',
    title: 'Nova tela de boas-vindas com identidade visual reforçada',
    excerpt: 'A WelcomePage foi redesenhada com a tagline "Sistema para Oficina Mecânica | ERP Automotivo" e visual alinhado à landing page.',
  },
];

const solutions = [
  { icon: ClipboardList, title: 'Ordens de Serviço', desc: 'Gerencie todo o ciclo da OS: abertura, diagnóstico, aprovação do cliente, execução, entrega e pagamento. Tudo digital, sem papel.' },
  { icon: Users, title: 'CRM de Clientes', desc: 'Histórico completo de cada cliente: veículos, OS anteriores, preferências e dados de contato. Relacionamento que fideliza.' },
  { icon: Package, title: 'Controle de Estoque', desc: 'Peças, insumos e materiais com alertas de reposição automáticos. Nunca mais perca uma venda por falta de peça.' },
  { icon: DollarSign, title: 'Financeiro Completo', desc: 'Receitas, despesas, fluxo de caixa e relatórios mensais. Saiba exatamente quanto sua oficina lucra.' },
  { icon: BarChart3, title: 'Relatórios e Indicadores', desc: 'Dashboard com KPIs em tempo real: faturamento, OS por período, tempo médio de execução e produtividade da equipe.' },
  { icon: Wrench, title: 'Catálogo de Serviços', desc: 'Monte seu catálogo de mão de obra com preços, tempo médio de operação e categoria. Padronize e profissionalize seu atendimento.' },
];

const diferenciais = [
  { icon: Trophy, title: 'Feito para oficinas', desc: 'Desenvolvido com dono de oficina, para dono de oficina. Cada funcionalidade resolve um problema real do dia a dia.' },
  { icon: Clock, title: 'Implementação em minutos', desc: 'Sem instalação, sem servidor próprio. Acesse do navegador, cadastre sua empresa e já comece a criar OS.' },
  { icon: Lock, title: 'Segurança multi-tenant', desc: 'Cada oficina tem seus dados completamente isolados. Nunca um cliente vê dados de outro. Criptografia em toda a comunicação.' },
  { icon: HeartHandshake, title: 'Suporte humano', desc: 'Nossas equipes de suporte respondem por e-mail e chat. Sem robôs, sem fila infinita. Pessoas reais ajudando de verdade.' },
  { icon: Star, title: 'Atualizações constantes', desc: 'O sistema evolui toda semana com novas funcionalidades sugeridas pelos próprios clientes. Você cresce junto com a plataforma.' },
  { icon: Gauge, title: 'Alta disponibilidade', desc: '99,95% de uptime garantido. Infraestrutura em nuvem com redundância automática para sua operação nunca parar.' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const startPlanCheckout = (planName: Plan['name']) => {
    navigate(`/planos?plan=${planName}`);
  };

  const handleAccess = () => {
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/splash');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#090e17] text-white overflow-x-hidden"
      style={{ fontFamily: '"Space Grotesk", "Manrope", sans-serif' }}
    >
      {/* ── Glow ambiente ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10rem] left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] rounded-full bg-[#ff7b2f]/10 blur-[120px]" />
        <div className="absolute top-[30%] left-[-8rem] w-[30rem] h-[30rem] rounded-full bg-[#ff7b2f]/6 blur-[100px]" />
        <div className="absolute top-[60%] right-[-6rem] w-[26rem] h-[26rem] rounded-full bg-[#2855d6]/8 blur-[100px]" />
      </div>

      {/* ── Nav ── */}
      <header className="relative z-10 max-w-5xl mx-auto px-6 pt-7 flex items-center justify-between">
        <span className="text-sm font-bold tracking-[0.18em] text-white/40 uppercase">sigmaauto.com.br</span>
        <button
          onClick={handleAccess}
          className="h-9 px-5 rounded-xl border border-white/15 text-sm font-bold text-white/80 hover:border-[#ff7b2f]/60 hover:text-white transition-all"
        >
          Acessar sistema
        </button>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#ff7b2f]/30 bg-[#ff7b2f]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#ff7b2f] mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff7b2f] animate-pulse" />
          Plataforma para oficinas mecânicas
        </motion.div>

        {/* Marca com glow pulsante */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            textShadow: [
              '0 0 40px rgba(255,123,47,0.55), 0 0 80px rgba(255,123,47,0.25), 0 0 160px rgba(255,123,47,0.12)',
              '0 0 60px rgba(255,123,47,0.80), 0 0 120px rgba(255,123,47,0.45), 0 0 220px rgba(255,123,47,0.22)',
              '0 0 40px rgba(255,123,47,0.55), 0 0 80px rgba(255,123,47,0.25), 0 0 160px rgba(255,123,47,0.12)',
            ],
          }}
          transition={{
            opacity: { duration: 0.6, delay: 0.1 },
            y: { duration: 0.6, delay: 0.1 },
            textShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
          }}
          className="text-[clamp(3.5rem,10vw,7rem)] font-black leading-none tracking-[0.12em] uppercase"
          style={{ letterSpacing: '0.14em' }}
        >
          <span className="text-white">Sygma</span>
          <span className="text-[#ff7b2f]"> Auto</span>
        </motion.h1>

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          className="mt-7 text-[clamp(1.1rem,2.5vw,1.5rem)] font-bold text-white/80 max-w-2xl leading-snug"
        >
          Do primeiro parafuso ao lucro no bolso —{' '}
          <span className="text-white">gestao completa da sua oficina.</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-3 text-base text-white/45 max-w-xl"
        >
          Ordens de servico, financeiro, estoque e equipe em uma unica plataforma. Sem planilhas. Sem friccao.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-10 flex flex-wrap gap-3 justify-center"
        >
          <button
            onClick={handleAccess}
            className="h-13 px-8 rounded-2xl bg-[#ff7b2f] text-white font-black text-base tracking-wide hover:bg-[#f06820] transition-all shadow-[0_0_30px_rgba(255,123,47,0.4)] hover:shadow-[0_0_50px_rgba(255,123,47,0.6)] inline-flex items-center gap-2"
            style={{ height: '52px' }}
          >
            Entrar no sistema
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
            className="h-13 px-8 rounded-2xl border border-white/15 text-white font-bold text-base hover:border-white/40 hover:bg-white/5 transition-all"
            style={{ height: '52px' }}
          >
            Ver planos
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 flex flex-wrap justify-center gap-8 text-center"
        >
          {[
            { value: '99.95%', label: 'Disponibilidade' },
            { value: '-34%', label: 'Tempo medio de O.S.' },
            { value: '+52%', label: 'Produtividade da equipe' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-xs text-white/45 mt-1 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Divisor ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 hover:border-[#ff7b2f]/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ff7b2f]/15 flex items-center justify-center mb-4">
                <Icon size={20} className="text-[#ff7b2f]" />
              </div>
              <p className="font-bold text-sm text-white">{title}</p>
              <p className="mt-1 text-xs text-white/50 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Planos ── */}
      <section id="planos" className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#ff7b2f]/70 font-bold mb-3">Planos</p>
          <h2 className="text-3xl md:text-4xl font-black">Escolha e inicie sua assinatura</h2>
          <p className="mt-3 text-white/45 text-sm">Sem conta? voce conclui o pagamento e recebe convite de ativacao no email.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative rounded-3xl border p-6 flex flex-col ${
                plan.featured
                  ? 'bg-[#ff7b2f]/10 border-[#ff7b2f]/40 shadow-[0_0_60px_rgba(255,123,47,0.15)]'
                  : 'bg-white/4 border-white/10'
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest bg-[#ff7b2f] text-white px-3 py-1 rounded-full">
                  Mais popular
                </span>
              )}
              <p className="text-xs uppercase tracking-widest text-white/40">{plan.label}</p>
              <div className="mt-2 flex items-end gap-1">
                <p className="text-4xl font-black text-white">{plan.price}</p>
                <p className="text-sm text-white/40 mb-1">{plan.period}</p>
              </div>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">{plan.description}</p>

              <ul className="mt-5 space-y-2.5 text-sm flex-1">
                {plan.highlights.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-[#ff7b2f] flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => startPlanCheckout(plan.name)}
                className={`mt-6 h-11 w-full rounded-xl text-sm font-black transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait ${
                  plan.featured
                    ? 'bg-[#ff7b2f] text-white hover:bg-[#f06820] shadow-[0_0_20px_rgba(255,123,47,0.4)]'
                    : 'bg-white/8 text-white border border-white/15 hover:bg-white/14'
                }`}
              >
                {`Ver modalidades ${plan.label}`}
              </button>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/8 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Marca */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-base font-black tracking-tight text-white">
              Sigma<span className="text-[#ff7b2f]">Auto</span>
            </span>
            <span className="text-[11px] text-white/30">Sistema para Oficina Mecânica · ERP Automotivo</span>
          </div>

          {/* Redes sociais */}
          <div className="flex items-center gap-3">
            {[
              { icon: Instagram, href: 'https://instagram.com/sigmaauto', label: 'Instagram' },
              { icon: Facebook,  href: 'https://facebook.com/sigmaauto',  label: 'Facebook' },
              { icon: Youtube,   href: 'https://youtube.com/@sigmaauto',  label: 'YouTube' },
              { icon: Linkedin,  href: 'https://linkedin.com/company/sigmaauto', label: 'LinkedIn' },
              { icon: Twitter,   href: 'https://x.com/sigmaauto',         label: 'X / Twitter' },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-[#ff7b2f] hover:border-[#ff7b2f]/40 hover:bg-[#ff7b2f]/10 transition-all"
              >
                <Icon size={16} />
              </a>
            ))}

            {/* WhatsApp — SVG manual pois lucide não tem */}
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-[#ff7b2f] hover:border-[#ff7b2f]/40 hover:bg-[#ff7b2f]/10 transition-all"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-white/25 text-center md:text-right">
            © {new Date().getFullYear()} SigmaAuto · sigmaauto.com.br<br />
            Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
