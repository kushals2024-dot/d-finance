import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Priority from './pages/Priority';
import Budget from './pages/Budget';
import Savings from './pages/Savings';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import Family from './pages/Family';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="income" element={<Income />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="priority" element={<Priority />} />
          <Route path="budget" element={<Budget />} />
          <Route path="savings" element={<Savings />} />
          <Route path="goals" element={<Goals />} />
          <Route path="reports" element={<Reports />} />
          <Route path="family" element={<Family />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
