import { useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { usePeriod, useToast } from '../context/AppContext';
import { Loader, ErrorBox, PageHead, PriorityBadge, StatCard, ProgressBar } from '../components/ui';
import { money, fmtDate, download, errMsg, MONTHS } from '../services/api';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';

export default function Reports() {
  const now = usePeriod();
  const toast = useToast();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month); // 0 = whole year
  const [busy, setBusy] = useState('');
  const { data: r, loading, error, reload } = useFetch('/reports', { year, month });
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i);

  const exportAs = async (type) => {
    setBusy(type);
    try { await download(`/reports/${type}`, { year, month }, `d-finance-${month ? MONTHS[month - 1] : 'Year'}-${year}.${type}`); toast.success(`${type.toUpperCase()} downloaded`); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };

  return (
    <>
      <PageHead title="Financial reports" sub="Monthly and yearly summaries">
        <button className="btn ghost" disabled={!!busy} onClick={() => exportAs('csv')}><FileSpreadsheet size={16} />{busy === 'csv' ? 'Preparing…' : 'Export CSV'}</button>
        <button className="btn primary" disabled={!!busy} onClick={() => exportAs('pdf')}><FileDown size={16} />{busy === 'pdf' ? 'Preparing…' : 'Export PDF'}</button>
      </PageHead>
      <div className="card filters">
        <select aria-label="Report period" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          <option value={0}>Whole year</option>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>{years.map((y) => <option key={y}>{y}</option>)}</select>
      </div>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <>
          <div className="stats">
            <StatCard icon={TrendingUp} tone="green" label="Income" value={r.summary.income} />
            <StatCard icon={TrendingDown} tone="red" label="Expenses" value={r.summary.expenses} />
            <StatCard icon={Wallet} tone="blue" label="Balance" value={r.summary.balance} />
            <StatCard icon={PiggyBank} tone="navy" label="Savings contributed" value={r.summary.savings} />
          </div>
          <div className="grid two">
            <div className="card"><h3>Income report</h3>
              {r.incomeBySource.length ? <ul className="plain-list">{r.incomeBySource.map((x) => <li key={x.source}><span>{x.source}<small className="block muted">{x.count} entries</small></span><b>{money(x.total)}</b></li>)}</ul> : <p className="muted">No income in this period.</p>}</div>
            <div className="card"><h3>Priority-wise expenses</h3>
              <ul className="plain-list">{r.priorities.map((x) => <li key={x.priority}><span><PriorityBadge priority={x.priority} /> <small className="muted">{x.count} entries</small></span><b>{money(x.total)}</b></li>)}</ul></div>
            <div className="card"><h3>Category-wise expense report</h3>
              {r.categories.length ? <ul className="plain-list">{r.categories.map((x) => <li key={x.category}><span>{x.category} <PriorityBadge priority={x.priority} /></span><b>{money(x.total)}</b></li>)}</ul> : <p className="muted">No expenses in this period.</p>}</div>
            <div className="card"><h3>Savings report</h3>
              {r.savings.length ? <ul className="plain-list">{r.savings.map((x, i) => <li key={i}><span>{x.goal}<small className="block muted">{fmtDate(x.date)}</small></span><b>{money(x.amount)}</b></li>)}</ul> : <p className="muted">No savings contributions in this period.</p>}</div>
          </div>
          <div className="card"><h3>Budget utilization</h3>
            {r.budgets.length ? r.budgets.map((b) => <div key={b.period} className="cat-usage"><div className="row between"><span>{b.period}</span><span>{money(b.spent)} / {money(b.budget)} ({b.utilization}%)</span></div><ProgressBar value={b.utilization} /></div>) : <p className="muted">No budget was set for this period.</p>}</div>
        </>
      )}
    </>
  );
}
