import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Violations from './pages/Violations';
import Challans from './pages/Challans';
import Heatmap from './pages/Heatmap';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

const DashboardLayout = ({ children }) => {
  const { logout, user } = useAuth();
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand">🚦 Third Eye Traffic</div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} end>Dashboard</NavLink>
          <NavLink to="/violations" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Violations</NavLink>
          <NavLink to="/challans" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Challans</NavLink>
          <NavLink to="/heatmap" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Heatmap</NavLink>
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid #30363d' }}>
           <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#8b949e' }}>Logged in as:<br/><strong>{user?.name}</strong></div>
           <button onClick={logout} style={{ width: '100%', padding: '8px', background: '#f85149', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
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
      <Route path="/heatmap" element={<ProtectedRoute><DashboardLayout><Heatmap /></DashboardLayout></ProtectedRoute>} />
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
