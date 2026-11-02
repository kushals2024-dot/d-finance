import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { usePeriod } from '../context/AppContext';
import { Loader, ErrorBox, PageHead, Empty, PRIORITY_COLORS } from '../components/ui';
import { money, fmtDate, MONTHS } from '../services/api';

const INFO = {
  High: { icon: AlertOctagon, text: 'Pay these first: rent, food, health, education, utility bills and loan EMIs.' },
  Medium: { icon: AlertTriangle, text: 'Pay after essentials: transport, internet and mobile, home maintenance.' },
  Low: { icon: CheckCircle2, text: 'Pay last, and cut these first if money is short.' },
};

export default function Priority() {
  const { year, month } = usePeriod();
  const { data, loading, error, reload } = useFetch('/expenses/priority', { year, month });
  const { data: meta } = useFetch('/meta');
  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHead title="Expense priority" sub={`${MONTHS[month - 1]} ${year}: what to pay first`} />
      {!data.total && <div className="card"><Empty title="No expenses this month" hint="Add expenses and they are sorted by priority automatically." /></div>}
      <div className="prio-grid">
        {data.groups.map((g) => {
          const { icon: Icon, text } = INFO[g.priority];
          return (
            <section key={g.priority} className="card prio-card" style={{ borderTopColor: PRIORITY_COLORS[g.priority] }}>
              <div className="row between"><h3 style={{ color: PRIORITY_COLORS[g.priority] }}><Icon size={18} /> {g.priority} priority</h3><strong>{money(g.total)}</strong></div>
              <p className="muted">{text}</p>
              <div className="progress"><div className="bar" style={{ width: `${g.share}%`, background: PRIORITY_COLORS[g.priority] }} /></div>
              <small className="muted">{g.share}% of spending · {g.count} expenses</small>
              <ul className="plain-list">
                {g.items.map((i) => <li key={i._id}><span>{i.title}<small className="block muted">{i.category} · {fmtDate(i.date)}</small></span><b>{money(i.amount)}</b></li>)}
                {!g.items.length && <li className="muted">None this month</li>}
              </ul>
            </section>
          );
        })}
      </div>
      {meta && (
        <div className="card">
          <h3>How categories are classified</h3>
          <div className="prio-map">
            {['High', 'Medium', 'Low'].map((p) => (
              <div key={p}><strong style={{ color: PRIORITY_COLORS[p] }}>{p}</strong>
                <ul className="plain-list">{Object.entries(meta.priorityMap).filter(([, v]) => v === p).map(([k]) => <li key={k}>{k}</li>)}</ul></div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
