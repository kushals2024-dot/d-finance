import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { Field } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await login(f.email, f.password); nav('/'); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <div className="auth-side">
        <div className="brand big"><span className="logo">D</span><strong>D FINANCE</strong></div>
        <h2>Know where the family's money goes, before the month ends.</h2>
        <p>Track income and expenses, pay essentials first, and see exactly how much you can save each month.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h1>Log in</h1>
        <p className="muted">Use the email you registered with.</p>
        {error && <div className="alert danger">{error}</div>}
        <Field label="Email"><input type="email" required autoFocus value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <button className="btn primary block" disabled={busy}>{busy ? <><Loader2 className="spin" size={16} />Logging in…</> : 'Log in'}</button>
        <p className="muted center">New family? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
