import { useState } from 'react';
import { UserPlus, Trash2, Shield, User } from 'lucide-react';
import api, { errMsg } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/AppContext';
import { Loader, ErrorBox, PageHead, Modal, Field } from '../components/ui';

export default function Family() {
  const { data, loading, error, reload } = useFetch('/family');
  const { isAdmin, user, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [famName, setFamName] = useState('');
  const [busy, setBusy] = useState(false);

  const addMember = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api.post('/family/members', form); toast.success('Member added'); setForm(null); reload(); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const removeMember = async (m) => {
    if (!window.confirm(`Remove ${m.name} from the family?`)) return;
    try { await api.delete(`/family/members/${m.id || m._id}`); toast.success('Member removed'); reload(); } catch (err) { toast.error(errMsg(err)); }
  };
  const rename = async (e) => {
    e.preventDefault();
    try { await api.put('/family', { name: famName }); toast.success('Family renamed'); setFamName(''); reload(); refresh(); } catch (err) { toast.error(errMsg(err)); }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHead title="Family members" sub={data.family.name}>
        {isAdmin && <button className="btn primary" onClick={() => setForm({ name: '', email: '', password: '' })}><UserPlus size={16} />Add member</button>}
      </PageHead>
      <div className="card">
        <ul className="plain-list">
          {data.members.map((m) => (
            <li key={m._id}>
              <span className="row gap"><span className="avatar">{m.name[0].toUpperCase()}</span><span>{m.name}{m._id === user.id && ' (you)'}<small className="block muted">{m.email}</small></span></span>
              <span className="row gap"><span className={`badge ${m.role === 'Admin' ? 'admin' : 'member'}`}>{m.role === 'Admin' ? <Shield size={12} /> : <User size={12} />} {m.role}</span>
                {isAdmin && m.role !== 'Admin' && <button className="icon-btn danger" aria-label={`Remove ${m.name}`} onClick={() => removeMember(m)}><Trash2 size={16} /></button>}</span>
            </li>))}
        </ul>
      </div>
      <div className="card"><h3>Roles</h3><p className="muted"><b>Admin</b> can add or remove members, edit any record and set budgets. <b>Member</b> can add records and edit only their own.</p></div>
      {isAdmin && <form className="card form inline" onSubmit={rename}><Field label="Rename family"><input required placeholder={data.family.name} value={famName} onChange={(e) => setFamName(e.target.value)} /></Field><button className="btn ghost">Save name</button></form>}

      {form && (
        <Modal title="Add family member" onClose={() => setForm(null)}>
          <form className="form" onSubmit={addMember}>
            <Field label="Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Temporary password" hint="Share this with them. They can change it in Profile & Settings."><input type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <div className="row end gap"><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Adding…' : 'Add member'}</button></div>
          </form>
        </Modal>)}
    </>
  );
}
