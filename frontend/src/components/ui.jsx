import { useEffect } from 'react';
import { X, Loader2, Inbox } from 'lucide-react';
import { money } from '../services/api';

export const Loader = ({ label = 'Loading…' }) => (
  <div className="loader"><Loader2 className="spin" size={22} /><span>{label}</span></div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="alert danger"><span>{message}</span>{onRetry && <button className="btn sm ghost" onClick={onRetry}>Try again</button>}</div>
);

export const Empty = ({ title, hint, action }) => (
  <div className="empty"><Inbox size={32} /><strong>{title}</strong>{hint && <p>{hint}</p>}{action}</div>
);

export function Modal({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children, hint }) => (
  <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
);

export const PriorityBadge = ({ priority }) => <span className={`badge ${String(priority).toLowerCase()}`}>{priority}</span>;

export const ProgressBar = ({ value, tone }) => {
  const v = Math.max(0, Math.min(100, value));
  const auto = value > 100 ? 'danger' : value >= 80 ? 'warning' : 'success';
  return <div className="progress"><div className={`bar ${tone || auto}`} style={{ width: `${v}%` }} /></div>;
};

export const StatCard = ({ icon: Icon, label, value, tone = 'blue', sub }) => (
  <div className="stat">
    <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
    <div><p className="stat-label">{label}</p><p className="stat-value">{typeof value === 'number' ? money(value) : value}</p>{sub && <p className="stat-sub">{sub}</p>}</div>
  </div>
);

export const PageHead = ({ title, sub, children }) => (
  <div className="page-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="head-actions">{children}</div></div>
);

export const PRIORITY_COLORS = { High: '#DC2626', Medium: '#F59E0B', Low: '#16A34A' };
