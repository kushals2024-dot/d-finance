import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import api, { errMsg, money, fmtDate } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { usePeriod, useToast } from '../context/AppContext';
import { Loader, ErrorBox, Empty, Modal, Field, PageHead, PriorityBadge } from './ui';

const today = () => new Date().toISOString().slice(0, 10);

// Shared page for Income and Expenses: list + filters + add/edit/delete.
export default function TransactionManager({ kind }) {
  const isExp = kind === 'expense';
  const url = isExp ? '/expenses' : '/income';
  const catKey = isExp ? 'category' : 'source';
  const { year, month } = usePeriod();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const { data: meta } = useFetch('/meta');
  const cats = meta ? (isExp ? meta.expenseCategories : meta.incomeCategories) : [];

  const [scope, setScope] = useState('period');
  const [filters, setFilters] = useState({ category: '', search: '', from: '', to: '' });
  const params = { ...(scope === 'period' && !filters.from && !filters.to ? { year, month } : {}), ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
  const { data, loading, error, reload } = useFetch(url, params);
  const [editing, setEditing] = useState(null); // null | {} (new) | record
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const blank = isExp ? { title: '', amount: '', category: 'Groceries', paymentMethod: 'Cash', date: today(), description: '' } : { source: 'Salary', amount: '', date: today(), description: '' };
  const openNew = () => { setForm(blank); setEditing({}); };
  const openEdit = (r) => { setForm({ ...r, date: r.date.slice(0, 10) }); setEditing(r); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { ...form, amount: Number(form.amount) };
      if (editing._id) await api.put(`${url}/${editing._id}`, body); else await api.post(url, body);
      toast.success(editing._id ? 'Changes saved' : `${isExp ? 'Expense' : 'Income'} added`);
      setEditing(null); reload();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const remove = async (r) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try { await api.delete(`${url}/${r._id}`); toast.success('Record deleted'); reload(); } catch (err) { toast.error(errMsg(err)); }
  };

  const canEdit = (r) => isAdmin || r.userId?._id === user.id;

  return (
    <>
      <PageHead title={isExp ? 'Expenses' : 'Income'} sub={isExp ? 'Record and review everything the family spends' : 'Record every source of family income'}>
        <button className="btn primary" onClick={openNew}><Plus size={16} />{isExp ? 'Add expense' : 'Add income'}</button>
      </PageHead>

      <div className="card filters">
        <div className="search"><Search size={16} /><input placeholder="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
        <select aria-label="Category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="date" aria-label="From date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" aria-label="To date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <select aria-label="Scope" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="period">Selected month</option><option value="all">All time</option>
        </select>
        {(filters.category || filters.search || filters.from || filters.to) && <button className="btn ghost sm" onClick={() => setFilters({ category: '', search: '', from: '', to: '' })}>Clear</button>}
      </div>

      <div className="card">
        {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.items.length ? (
          <Empty title="No records found" hint="Change the filters or add a new record." action={<button className="btn primary" onClick={openNew}><Plus size={16} />Add one</button>} />
        ) : (
          <>
            <div className="row between"><strong>{data.count} records</strong><strong>Total: {money(data.total)}</strong></div>
            <div className="table-wrap"><table>
              <thead><tr><th>Date</th><th>{isExp ? 'Title' : 'Source'}</th>{isExp && <th>Category</th>}{isExp && <th>Priority</th>}{isExp && <th>Paid by</th>}<th>Added by</th><th className="r">Amount</th><th /></tr></thead>
              <tbody>{data.items.map((r) => (
                <tr key={r._id}>
                  <td>{fmtDate(r.date)}</td>
                  <td>{isExp ? r.title : r.source}{r.description && <small className="block muted">{r.description}</small>}</td>
                  {isExp && <td>{r.category}</td>}{isExp && <td><PriorityBadge priority={r.priority} /></td>}{isExp && <td>{r.paymentMethod}</td>}
                  <td>{r.userId?.name}</td>
                  <td className={`r ${isExp ? 'neg' : 'pos'}`}>{money(r.amount)}</td>
                  <td className="actions">{canEdit(r) && <><button className="icon-btn" aria-label="Edit" onClick={() => openEdit(r)}><Pencil size={16} /></button><button className="icon-btn danger" aria-label="Delete" onClick={() => remove(r)}><Trash2 size={16} /></button></>}</td>
                </tr>))}</tbody>
            </table></div>
          </>
        )}
      </div>

      {editing && (
        <Modal title={`${editing._id ? 'Edit' : 'Add'} ${isExp ? 'expense' : 'income'}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form">
            {isExp && <Field label="Title"><input required value={form.title} onChange={set('title')} placeholder="e.g. Monthly rent" /></Field>}
            <div className="two-col">
              <Field label={isExp ? 'Category' : 'Source'}><select value={form[catKey]} onChange={set(catKey)}>{cats.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Amount (₹)"><input type="number" min="1" step="any" required value={form.amount} onChange={set('amount')} /></Field>
            </div>
            {isExp && meta && <p className="muted">Priority: <PriorityBadge priority={meta.priorityMap[form.category]} /> (set automatically)</p>}
            <div className="two-col">
              <Field label="Date"><input type="date" required value={form.date} onChange={set('date')} /></Field>
              {isExp && <Field label="Payment method"><select value={form.paymentMethod} onChange={set('paymentMethod')}>{['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'].map((m) => <option key={m}>{m}</option>)}</select></Field>}
            </div>
            <Field label="Notes (optional)"><textarea rows={2} value={form.description || ''} onChange={set('description')} /></Field>
            <div className="row end gap"><button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : editing._id ? 'Save changes' : 'Add'}</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
