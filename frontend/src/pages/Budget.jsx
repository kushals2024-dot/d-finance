import { useEffect, useState } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import api, { errMsg, money, MONTHS } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { usePeriod, useToast } from '../context/AppContext';
import { Loader, ErrorBox, PageHead, ProgressBar, Field, PriorityBadge } from '../components/ui';

export default function Budget() {
  const { year, month } = usePeriod();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/budgets/current', { year, month });
  const { data: meta } = useFetch('/meta');
  const [total, setTotal] = useState('');
  const [limits, setLimits] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTotal(data.budget?.totalBudget || '');
    setLimits(Object.fromEntries((data.budget?.categoryLimits || []).map((l) => [l.category, l.limit])));
  }, [data]);

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api.put('/budgets', { year, month, totalBudget: Number(total), categoryLimits: Object.entries(limits).map(([category, limit]) => ({ category, limit: Number(limit) })) });
      toast.success('Budget saved'); reload();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm('Delete this month\'s budget?')) return;
    try { await api.delete(`/budgets/${data.budget._id}`); toast.success('Budget deleted'); reload(); } catch (err) { toast.error(errMsg(err)); }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const b = data.budget;

  return (
    <>
      <PageHead title="Monthly budget" sub={`${MONTHS[month - 1]} ${year}`}>{isAdmin && b && <button className="btn ghost danger-text" onClick={remove}>Delete budget</button>}</PageHead>
      {!isAdmin && <div className="alert info">Only the family admin can change the budget.</div>}

      {b && (
        <div className="card">
          <div className="row between"><h3>Budget usage</h3><strong>{b.utilization}% used</strong></div>
          <ProgressBar value={b.utilization} />
          <div className="mini-stats"><div><small>Budget</small><b>{money(b.totalBudget)}</b></div><div><small>Spent</small><b>{money(b.spent)}</b></div><div><small>{b.remaining < 0 ? 'Over by' : 'Remaining'}</small><b className={b.remaining < 0 ? 'neg' : 'pos'}>{money(Math.abs(b.remaining))}</b></div></div>
          {b.exceeded && <div className="alert danger"><AlertTriangle size={18} /><span>Total spending is over budget.</span></div>}
          {b.categories.filter((c) => c.exceeded).map((c) => <div key={c.category} className="alert warning"><AlertTriangle size={18} /><span>{c.category}: {money(c.spent)} spent, limit {money(c.limit)}.</span></div>)}
          {!!b.categories.length && <div className="cat-usage">{b.categories.map((c) => (
            <div key={c.category}><div className="row between"><span>{c.category}</span><span>{money(c.spent)} / {money(c.limit)} ({c.utilization}%)</span></div><ProgressBar value={c.utilization} /></div>))}</div>}
        </div>
      )}

      {isAdmin && (
        <form className="card form" onSubmit={save}>
          <h3>{b ? 'Update budget' : 'Set budget'}</h3>
          <Field label="Total monthly budget (₹)"><input type="number" min="1" required value={total} onChange={(e) => setTotal(e.target.value)} /></Field>
          <h4>Category limits <small className="muted">(optional, leave blank for no limit)</small></h4>
          <div className="limit-grid">
            {meta?.expenseCategories.map((c) => (
              <Field key={c} label={<>{c} <PriorityBadge priority={meta.priorityMap[c]} /></>}>
                <input type="number" min="0" placeholder="No limit" value={limits[c] ?? ''} onChange={(e) => setLimits({ ...limits, [c]: e.target.value })} /></Field>))}
          </div>
          <div className="row end"><button className="btn primary" disabled={busy}><Save size={16} />{busy ? 'Saving…' : 'Save budget'}</button></div>
        </form>
      )}
    </>
  );
}
