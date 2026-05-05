/**
 * SigmaAuto Logo Component
 *
 * Ícone: Σ estilizado com seta curva na extremidade inferior direita
 * Paleta: âmbar/laranja (#f59e0b → #ff7b2f) sobre fundo grafite
 *
 * Variantes:
 *   "icon"     → só o ícone Σ (favicon, avatar)
 *   "full"     → ícone + wordmark "Sigma Auto"
 *   "compact"  → ícone + wordmark em linha compacta (sidebar)
 */

type LogoVariant = 'icon' | 'full' | 'compact';

interface SigmaAutoLogoProps {
  variant?: LogoVariant;
  size?: number;       // tamanho do ícone em px
  className?: string;
}

export function SigmaAutoLogo({ variant = 'compact', size = 36, className = '' }: SigmaAutoLogoProps) {
  const Icon = (
    <img
      src="/logo.png"
      alt="SigmaAuto"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  );

  if (variant === 'icon') {
    return <span className={className}>{Icon}</span>;
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {Icon}
        <div className="leading-none">
          <span className="block font-black text-white text-[15px] tracking-tight">
            Sigma<span style={{ color: '#f59e0b' }}>Auto</span>
          </span>
        </div>
      </div>
    );
  }

  // full
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {Icon}
      <div className="leading-none">
        <span className="block font-black text-white text-xl tracking-tight">
          Sigma<span style={{ color: '#f59e0b' }}>Auto</span>
        </span>
        <span className="block text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">
          Gestão de Oficina
        </span>
      </div>
    </div>
  );
}

/**
 * Favicon / ícone standalone (SVG puro — use para exportar como .svg)
 */
export function SigmaAutoIcon({ size = 40 }: { size?: number }) {
  return <SigmaAutoLogo variant="icon" size={size} />;
}
