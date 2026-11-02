import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { Field } from '../components/ui';

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', familyName: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await register(f); nav('/'); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <div className="auth-side">
        <div className="brand big"><span className="logo">D</span><strong>D FINANCE</strong></div>
        <h2>Set up your family in a minute.</h2>
        <p>You become the family admin. Add other members later from the Family Members page.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h1>Create family account</h1>
        {error && <div className="alert danger">{error}</div>}
        <Field label="Your name"><input required value={f.name} onChange={set('name')} /></Field>
        <Field label="Family name"><input required placeholder="e.g. Kumar Family" value={f.familyName} onChange={set('familyName')} /></Field>
        <Field label="Email"><input type="email" required value={f.email} onChange={set('email')} /></Field>
        <Field label="Password" hint="At least 6 characters"><input type="password" required minLength={6} value={f.password} onChange={set('password')} /></Field>
        <button className="btn primary block" disabled={busy}>{busy ? <><Loader2 className="spin" size={16} />Creating…</> : 'Create account'}</button>
        <p className="muted center">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
