import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

// ---- Toasts (success / error messages) ----
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);
  const dismiss = (i) => setToasts((t) => t.filter((x) => x.id !== i));
  const push = useCallback((type, message) => {
    const i = ++id.current;
    setToasts((t) => [...t, { id: i, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== i)), 4000);
  }, []);
  const api = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{t.message}</span>
            <button className="icon-btn" onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---- Selected month/year shared by all pages ----
const PeriodCtx = createContext(null);
export const usePeriod = () => useContext(PeriodCtx);

export function PeriodProvider({ children }) {
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  return <PeriodCtx.Provider value={{ ...period, setPeriod }}>{children}</PeriodCtx.Provider>;
}
