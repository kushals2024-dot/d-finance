import { useState } from 'react';
import { Plus, Trash2, PiggyBank, Pencil, History } from 'lucide-react';
import api, { errMsg, money, fmtDate } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorBox, PageHead, Empty, Modal, Field, ProgressBar } from '../components/ui';

const TYPES = ['Emergency Fund', "Children's Education", 'House Purchase', 'Vehicle Purchase', 'Family Vacation', 'Other'];
const today = () => new Date().toISOString().slice(0, 10);

export default function Goals() {
  const { data, loading, error, reload } = useFetch('/goals');
  const { isAdmin, user } = useAuth();
  const toast = useToast();
  const [goalForm, setGoalForm] = useState(null);
  const [contrib, setContrib] = useState(null);
  const [history, setHistory] = useState(null); // { goal, items }
  const [busy, setBusy] = useState(false);

  const run = async (fn, okMsg, after) => {
    setBusy(true);
    try { await fn(); toast.success(okMsg); after?.(); reload(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const saveGoal = (e) => { e.preventDefault(); const g = goalForm; const body = { ...g, targetAmount: Number(g.targetAmount) };
    run(() => (g._id ? api.put(`/goals/${g._id}`, body) : api.post('/goals', body)), g._id ? 'Goal updated' : 'Goal created', () => setGoalForm(null)); };
  const saveContribution = (e) => { e.preventDefault();
    run(() => api.post(`/goals/${contrib.goal._id}/contributions`, { amount: Number(contrib.amount), date: contrib.date, note: contrib.note }), 'Contribution added', () => setContrib(null)); };
  const removeGoal = (g) => window.confirm(`Delete "${g.name}" and all its contributions?`) && run(() => api.delete(`/goals/${g._id}`), 'Goal deleted');
  const openHistory = async (g) => { try { setHistory({ goal: g, items: (await api.get(`/goals/${g._id}/contributions`)).data }); } catch (e) { toast.error(errMsg(e)); } };
  const removeContribution = async (c) => { try { await api.delete(`/goals/contributions/${c._id}`); toast.success('Contribution removed'); setHistory(null); reload(); } catch (e) { toast.error(errMsg(e)); } };

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHead title="Savings goals" sub="Plan for what matters and track every contribution">
        <button className="btn primary" onClick={() => setGoalForm({ name: '', type: 'Emergency Fund', targetAmount: '', targetDate: '' })}><Plus size={16} />New goal</button>
      </PageHead>
      {!data.length ? <div className="card"><Empty title="No goals yet" hint="Create a goal like an emergency fund or a vacation." /></div> : (
        <div className="goal-grid">
          {data.map((g) => (
            <div key={g._id} className="card goal">
              <div className="row between"><div><h3>{g.name}</h3><small className="muted">{g.type} · by {fmtDate(g.targetDate)}</small></div>
                <div className="row"><button className="icon-btn" aria-label="Edit goal" onClick={() => setGoalForm({ ...g, targetDate: g.targetDate.slice(0, 10) })}><Pencil size={16} /></button>
                  <button className="icon-btn danger" aria-label="Delete goal" onClick={() => removeGoal(g)}><Trash2 size={16} /></button></div></div>
              <div className="goal-pct">{g.percent}%</div>
              <ProgressBar value={g.percent} tone={g.completed ? 'success' : 'blue'} />
              <div className="mini-stats"><div><small>Saved</small><b>{money(g.saved)}</b></div><div><small>Target</small><b>{money(g.targetAmount)}</b></div><div><small>Remaining</small><b>{money(g.remaining)}</b></div></div>
              {g.completed ? <p className="pos"><b>Goal reached.</b></p> : <p className="muted">Save about {money(g.monthlyNeeded)} a month to finish on time.</p>}
              <div className="row gap"><button className="btn primary sm" onClick={() => setContrib({ goal: g, amount: '', date: today(), note: '' })}><PiggyBank size={15} />Add savings</button>
                <button className="btn ghost sm" onClick={() => openHistory(g)}><History size={15} />History</button></div>
            </div>))}
        </div>)}

      {goalForm && (
        <Modal title={goalForm._id ? 'Edit goal' : 'New savings goal'} onClose={() => setGoalForm(null)}>
          <form className="form" onSubmit={saveGoal}>
            <Field label="Goal name"><input required value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} /></Field>
            <Field label="Type"><select value={goalForm.type} onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <div className="two-col">
              <Field label="Target amount (₹)"><input type="number" min="1" required value={goalForm.targetAmount} onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })} /></Field>
              <Field label="Target date"><input type="date" required value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} /></Field>
            </div>
            <div className="row end gap"><button type="button" className="btn ghost" onClick={() => setGoalForm(null)}>Cancel</button><button className="btn primary" disabled={busy}>{goalForm._id ? 'Save changes' : 'Create goal'}</button></div>
          </form>
        </Modal>)}

      {contrib && (
        <Modal title={`Add savings to ${contrib.goal.name}`} onClose={() => setContrib(null)}>
          <form className="form" onSubmit={saveContribution}>
            <div className="two-col">
              <Field label="Amount (₹)"><input type="number" min="1" required autoFocus value={contrib.amount} onChange={(e) => setContrib({ ...contrib, amount: e.target.value })} /></Field>
              <Field label="Date"><input type="date" required value={contrib.date} onChange={(e) => setContrib({ ...contrib, date: e.target.value })} /></Field>
            </div>
            <Field label="Note (optional)"><input value={contrib.note} onChange={(e) => setContrib({ ...contrib, note: e.target.value })} /></Field>
            <div className="row end gap"><button type="button" className="btn ghost" onClick={() => setContrib(null)}>Cancel</button><button className="btn primary" disabled={busy}>Add savings</button></div>
          </form>
        </Modal>)}

      {history && (
        <Modal title={`${history.goal.name}: contributions`} onClose={() => setHistory(null)}>
          {history.items.length ? <ul className="plain-list">{history.items.map((c) => (
            <li key={c._id}><span>{fmtDate(c.date)} · {c.userId?.name}{c.note && <small className="block muted">{c.note}</small>}</span>
              <span className="row"><b>{money(c.amount)}</b>{(isAdmin || c.userId?._id === user.id) && <button className="icon-btn danger" aria-label="Remove" onClick={() => removeContribution(c)}><Trash2 size={15} /></button>}</span></li>))}</ul>
            : <p className="muted">No contributions yet.</p>}
        </Modal>)}
    </>
  );
}
