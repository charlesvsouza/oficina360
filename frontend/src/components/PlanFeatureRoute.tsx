import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { canAccessFeature, featureLabel, getFeatureMinPlan, type PlanFeatureKey } from '../lib/planAccess';

type PlanFeatureRouteProps = {
  feature: PlanFeatureKey;
  children: JSX.Element;
};

export function PlanFeatureRoute({ feature, children }: PlanFeatureRouteProps) {
  const { tenant } = useAuthStore();
  const planName = tenant?.subscription?.plan?.name || 'START';

  if (!canAccessFeature(planName, feature)) {
    const requiredPlan = getFeatureMinPlan(feature);
    const message = encodeURIComponent(`${featureLabel(feature)} disponível a partir do plano ${requiredPlan}.`);
    return <Navigate to={`/settings?upgrade=${feature}&msg=${message}`} replace />;
  }

  return children;
}
