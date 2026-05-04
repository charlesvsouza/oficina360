import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { canAccessRetificaMode, getPlanLabel } from '../lib/planAccess';

type RetificaModeRouteProps = {
  children: JSX.Element;
};

export function RetificaModeRoute({ children }: RetificaModeRouteProps) {
  const { tenant } = useAuthStore();
  const planName = tenant?.subscription?.plan?.name || 'START';

  if (!canAccessRetificaMode(planName)) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Modo bloqueado</p>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Modo Retífica de Motores</h2>
          <p className="text-sm text-slate-600 mt-3">
            Seu plano atual é {getPlanLabel(planName)}. Para usar entrada de motor avulso, fluxo técnico de retífica e operação híbrida oficina + retífica,
            faça upgrade para Modo Retífica Pro ou Modo Retífica Rede.
          </p>
          <div className="mt-5 flex gap-3">
            <Link to="/dashboard" className="btn bg-slate-100 text-slate-700 hover:bg-slate-200">
              Voltar ao Painel
            </Link>
            <Link to="/settings" className="btn btn-primary">
              Ver Planos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}