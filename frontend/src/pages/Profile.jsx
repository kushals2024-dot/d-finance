import { useState } from 'react';
import api, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/AppContext';
import { PageHead, Field } from '../components/ui';

export default function Profile() {
  const { user, family, refresh } = useAuth();
  const toast = useToast();
  const [p, setP] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault(); setBusy('p');
    try { await api.put('/auth/profile', p); await refresh(); toast.success('Profile updated'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(''); }
  };
  const savePassword = async (e) => {
    e.preventDefault(); setBusy('w');
    try { await api.put('/auth/password', pw); setPw({ currentPassword: '', newPassword: '' }); toast.success('Password changed'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(''); }
  };

  return (
    <>
      <PageHead title="Profile & settings" sub={`${family?.name} · ${user.role === 'Admin' ? 'Family Admin' : 'Family Member'}`} />
      <div className="grid two">
        <form className="card form" onSubmit={saveProfile}>
          <h3>Your details</h3>
          <Field label="Name"><input required value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
          <Field label="Email" hint="Email cannot be changed"><input value={user.email} disabled /></Field>
          <Field label="Phone"><input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
          <button className="btn primary" disabled={busy === 'p'}>{busy === 'p' ? 'Saving…' : 'Save changes'}</button>
        </form>
        <form className="card form" onSubmit={savePassword}>
          <h3>Change password</h3>
          <Field label="Current password"><input type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password" hint="At least 6 characters"><input type="password" required minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <button className="btn primary" disabled={busy === 'w'}>{busy === 'w' ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
    </>
  );
}
