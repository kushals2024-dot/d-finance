import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import useFetch from '../hooks/useFetch';
import { usePeriod } from '../context/AppContext';
import { Loader, ErrorBox, StatCard, PageHead, PriorityBadge, ProgressBar, Empty, PRIORITY_COLORS } from '../components/ui';
import { money, fmtDate, MONTHS } from '../services/api';

const PIE = ['#2563EB', '#14213D', '#16A34A', '#F59E0B', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#475569', '#0D9488', '#9333EA'];
const inr = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const { year, month } = usePeriod();
  const { data: d, loading, error, reload } = useFetch('/dashboard', { year, month });
  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const b = d.budget;
  const empty = !d.totalIncome && !d.totalExpenses;

  return (
    <>
      <PageHead title="Dashboard" sub={`${MONTHS[month - 1]} ${year} overview`} />
      {b?.exceeded && <div className="alert danger"><AlertTriangle size={18} /><span>You have spent {money(b.spent - b.totalBudget)} more than this month's budget.</span></div>}
      {!b && <div className="alert info"><span>No budget set for this month. </span><Link to="/budget">Set a budget</Link></div>}

      <div className="stats">
        <StatCard icon={TrendingUp} tone="green" label="Monthly income" value={d.totalIncome} />
        <StatCard icon={TrendingDown} tone="red" label="Monthly expenses" value={d.totalExpenses} />
        <StatCard icon={Wallet} tone="blue" label="Remaining balance" value={d.remainingBalance} sub={d.remainingBalance < 0 ? 'Spending exceeds income' : undefined} />
        <StatCard icon={PiggyBank} tone="navy" label="Total savings" value={d.totalSavings} sub={`${money(d.monthlySavings)} saved this month`} />
        <StatCard icon={Target} tone="orange" label="Monthly budget" value={b ? b.totalBudget : '—'} sub={b ? `${b.utilization}% used, ${money(b.remaining)} left` : 'Not set'} />
      </div>
      {b && <div className="card slim"><div className="row between"><strong>Budget used</strong><span>{b.utilization}%</span></div><ProgressBar value={b.utilization} /></div>}

      {empty ? (
        <div className="card"><Empty title="No transactions this month" hint="Add income and expenses to see your charts." action={<div className="row gap"><Link className="btn primary" to="/income">Add income</Link><Link className="btn ghost" to="/expenses">Add expense</Link></div>} /></div>
      ) : (
        <div className="grid two">
          <div className="card">
            <h3>Income vs expenses</h3><p className="muted">Last 6 months</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={d.series}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" fontSize={12} /><YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={inr} /><Legend /><Bar dataKey="income" name="Income" fill="#16A34A" radius={[4, 4, 0, 0]} /><Bar dataKey="expense" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3>Monthly savings progress</h3><p className="muted">Contributions to goals</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={d.series}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" fontSize={12} /><YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={inr} /><Line type="monotone" dataKey="savings" name="Savings" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} /></LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3>Expense summary</h3><p className="muted">By category</p>
            {d.categories.length ? (
              <div className="pie-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={d.categories} dataKey="total" nameKey="category" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {d.categories.map((c, i) => <Cell key={c.category} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip formatter={inr} /></PieChart>
                </ResponsiveContainer>
                <ul className="legend">{d.categories.slice(0, 6).map((c, i) => <li key={c.category}><i style={{ background: PIE[i % PIE.length] }} />{c.category}<b>{money(c.total)}</b></li>)}</ul>
              </div>
            ) : <p className="muted">No expenses yet.</p>}
          </div>
          <div className="card">
            <h3>Spending by priority</h3><p className="muted">Pay high priority first</p>
            {d.priorities.map((p) => {
              const pct = d.totalExpenses ? Math.round((p.total / d.totalExpenses) * 100) : 0;
              return <div key={p.priority} className="prio-row"><div className="row between"><PriorityBadge priority={p.priority} /><span>{money(p.total)} · {pct}%</span></div>
                <div className="progress"><div className="bar" style={{ width: `${pct}%`, background: PRIORITY_COLORS[p.priority] }} /></div></div>;
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div className="row between"><h3>Recent transactions</h3></div>
        {d.recent.length ? (
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>By</th><th className="r">Amount</th></tr></thead>
            <tbody>{d.recent.map((t) => (
              <tr key={t.type + t.id}><td>{fmtDate(t.date)}</td><td>{t.title}</td>
                <td>{t.category} {t.priority && <PriorityBadge priority={t.priority} />}</td><td>{t.by}</td>
                <td className={`r ${t.type === 'income' ? 'pos' : 'neg'}`}>{t.type === 'income' ? '+' : '−'}{money(t.amount)}</td></tr>
            ))}</tbody></table></div>
        ) : <p className="muted">Nothing recorded yet.</p>}
      </div>
    </>
  );
}
