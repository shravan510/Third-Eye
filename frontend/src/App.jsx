import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Violations from './pages/Violations';
import Challans from './pages/Challans';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard',  icon: '⚡', end: true },
  { to: '/violations', label: 'Violations', icon: '🚨' },
  { to: '/challans',   label: 'Challans',   icon: '📋' },
];

const DashboardLayout = ({ children }) => {
  const { logout, user } = useAuth();

  return (
    <div className="dashboard-container">
      <aside className="sidebar">

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">🚦</div>
          <div>
            <div>Third Eye</div>
            <div className="sidebar-subtitle">Traffic AI System</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="user-info-box">
            <div className="user-avatar">
              {user?.name?.charAt(0) ?? 'A'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name ?? 'Officer'}</div>
              <div className="user-role">RTO Officer</div>
            </div>
          </div>
          <button onClick={logout} className="btn-logout">
            <span>⏻</span> Logout
          </button>
        </div>

      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/violations" element={<ProtectedRoute><DashboardLayout><Violations /></DashboardLayout></ProtectedRoute>} />
      <Route path="/challans" element={<ProtectedRoute><DashboardLayout><Challans /></DashboardLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
