import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Receipt, ListOrdered, Wallet, Lightbulb, Target, FileText, Users, UserCog, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePeriod } from '../context/AppContext';
import { MONTHS } from '../services/api';

const NAV = [
  ['/', 'Dashboard', LayoutDashboard], ['/income', 'Income', TrendingUp], ['/expenses', 'Expenses', Receipt],
  ['/priority', 'Expense Priority', ListOrdered], ['/budget', 'Monthly Budget', Wallet],
  ['/savings', 'Savings Recommendations', Lightbulb], ['/goals', 'Savings Goals', Target],
  ['/reports', 'Financial Reports', FileText], ['/family', 'Family Members', Users], ['/profile', 'Profile & Settings', UserCog],
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, family, logout } = useAuth();
  const { year, month, setPeriod } = usePeriod();
  const nav = useNavigate();
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i);

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><span className="logo">D</span><div><strong>D FINANCE</strong><small>{family?.name || 'Family'}</small></div></div>
        <nav>
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <button className="logout" onClick={() => { logout(); nav('/login'); }}><LogOut size={18} />Log out</button>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div className="period">
            <select aria-label="Month" value={month} onChange={(e) => setPeriod({ year, month: Number(e.target.value) })}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select aria-label="Year" value={year} onChange={(e) => setPeriod({ month, year: Number(e.target.value) })}>
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="whoami"><span className="avatar">{user.name[0].toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.role === 'Admin' ? 'Family Admin' : 'Family Member'}</small></div></div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
