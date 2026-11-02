import { Lightbulb, TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import useFetch from '../hooks/useFetch';
import { usePeriod } from '../context/AppContext';
import { Loader, ErrorBox, PageHead, StatCard, Empty, PriorityBadge } from '../components/ui';
import { money, MONTHS } from '../services/api';
import { Wallet, PiggyBank, Scissors } from 'lucide-react';

const inr = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

export default function Savings() {
  const { year, month } = usePeriod();
  const rec = useFetch('/recommendations', { year, month });
  const an = useFetch('/analysis', { year, month });
  if (rec.loading || an.loading) return <Loader label="Analysing your spending…" />;
  if (rec.error || an.error) return <ErrorBox message={rec.error || an.error} onRetry={() => { rec.reload(); an.reload(); }} />;
  const r = rec.data, a = an.data;

  return (
    <>
      <PageHead title="Savings recommendations" sub={`${MONTHS[month - 1]} ${year}: calculated from your actual records`} />
      <div className="stats">
        <StatCard icon={TrendingUp} tone="green" label="Monthly income" value={r.income} />
        <StatCard icon={TrendingDown} tone="red" label="Monthly expenses" value={r.expenses} />
        <StatCard icon={Wallet} tone="blue" label="Remaining balance" value={r.remaining} />
        <StatCard icon={Scissors} tone="orange" label="Potential extra savings" value={r.potentialSavings} />
        <StatCard icon={PiggyBank} tone="navy" label="Suggested monthly savings" value={r.suggestedSavings} sub={`Target: ${money(r.targetAmount)} (${r.targetRate}% of income)`} />
      </div>

      <div className="card">
        <h3><Lightbulb size={18} /> Suggested reductions</h3>
        {r.reductions.length ? (
          <div className="table-wrap"><table><thead><tr><th>Category</th><th className="r">Spent</th><th className="r">Reduce by</th><th className="r">New amount</th></tr></thead>
            <tbody>{r.reductions.map((x) => <tr key={x.category}><td>{x.category} <PriorityBadge priority="Low" /></td><td className="r">{money(x.current)}</td><td className="r pos">−{money(x.reduceBy)}</td><td className="r">{money(x.newAmount)}</td></tr>)}</tbody></table></div>
        ) : <p className="muted">No low-priority spending to reduce this month.</p>}
        <div className="callout">
          <div><small>Remaining balance</small><b>{money(Math.max(r.remaining, 0))}</b></div><span>+</span>
          <div><small>Potential additional savings</small><b>{money(r.potentialSavings)}</b></div><span>=</span>
          <div className="big"><small>Suggested monthly savings</small><b>{money(r.suggestedSavings)}</b></div>
        </div>
        {r.notes.map((n, i) => <p key={i} className="muted">{n}</p>)}
      </div>

      <h2 className="section-title">Smart expense analysis</h2>
      <div className="grid two">
        <div className="card">
          <h3><Flame size={18} /> Highlights</h3>
          <ul className="plain-list">
            <li><span>Highest spending category</span><b>{a.highestCategory ? `${a.highestCategory.category} (${money(a.highestCategory.total)})` : '—'}</b></li>
            <li><span>Compared with last month</span><b className={a.changePct > 0 ? 'neg' : 'pos'}>{a.changePct === null ? 'No data last month' : `${a.changePct > 0 ? '+' : ''}${a.changePct}% (${money(a.previousTotal)} → ${money(a.currentTotal)})`}</b></li>
            <li><span>Unnecessary (low priority) spending</span><b>{money(a.unnecessary.total)} ({a.unnecessary.share}%)</b></li>
            <li><span>Average monthly expenses</span><b>{money(a.avgMonthlyExpense)}</b></li>
          </ul>
          <h4>Overspending alerts</h4>
          {a.overspending.length ? a.overspending.map((o, i) => <div key={i} className="alert danger"><span>{o.message}</span></div>) : <p className="muted">No overspending detected.</p>}
        </div>
        <div className="card">
          <h3>Expense trend</h3><p className="muted">Last 6 months</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={a.trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" fontSize={12} /><YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={inr} /><Line type="monotone" dataKey="expense" name="Expenses" stroke="#DC2626" strokeWidth={3} /></LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <h3>Category comparison</h3><p className="muted">This month vs last month</p>
        {a.comparison.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={a.comparison}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="category" fontSize={11} interval={0} angle={-25} textAnchor="end" height={70} /><YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={inr} /><Legend verticalAlign="top" /><Bar dataKey="previous" name="Last month" fill="#94A3B8" radius={[4, 4, 0, 0]} /><Bar dataKey="current" name="This month" fill="#2563EB" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        ) : <Empty title="No expense data" hint="Add expenses to compare months." />}
      </div>
    </>
  );
}
