import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const LAST_ACTIVITY_KEY = 'oficina360-last-activity-at';
const SESSION_STARTED_AT_KEY = 'oficina360-session-started-at';

// Encerra a sessao em 30 min sem atividade do usuario.
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
// Limite maximo de sessao ativa mesmo com uso continuo.
const ABSOLUTE_SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export function SessionSecurity() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const lastTouchRef = useRef<number>(0);

  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);
      sessionStorage.removeItem(SESSION_STARTED_AT_KEY);
      return;
    }

    const now = Date.now();
    const startedAtRaw = sessionStorage.getItem(SESSION_STARTED_AT_KEY);
    if (!startedAtRaw) {
      sessionStorage.setItem(SESSION_STARTED_AT_KEY, String(now));
    }
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));

    const touchActivity = () => {
      const current = Date.now();
      if (current - lastTouchRef.current < 10000) {
        return;
      }
      lastTouchRef.current = current;
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(current));
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        touchActivity();
      }
    };

    const eventNames: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    for (const eventName of eventNames) {
      window.addEventListener(eventName, touchActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    const interval = window.setInterval(() => {
      const current = Date.now();
      const startedAt = Number(sessionStorage.getItem(SESSION_STARTED_AT_KEY) || 0);
      const lastActivityAt = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY) || 0);

      const inactive = lastActivityAt > 0 && current - lastActivityAt > INACTIVITY_TIMEOUT_MS;
      const expired = startedAt > 0 && current - startedAt > ABSOLUTE_SESSION_TIMEOUT_MS;

      if (inactive || expired) {
        logout();
        sessionStorage.removeItem(LAST_ACTIVITY_KEY);
        sessionStorage.removeItem(SESSION_STARTED_AT_KEY);
        navigate('/login?reason=session-expired', { replace: true });
      }
    }, 30000);

    return () => {
      window.clearInterval(interval);
      for (const eventName of eventNames) {
        window.removeEventListener(eventName, touchActivity);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, logout, navigate]);

  return null;
}
