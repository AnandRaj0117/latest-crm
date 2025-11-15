import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Auth components
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard components
import Dashboard from './pages/Dashboard';
import TenantDashboard from './pages/TenantDashboard';
import SaasDashboard from './pages/SaasDashboard';

// CRM pages
import Leads from './pages/Leads';
import Accounts from './pages/Accounts';
import Contacts from './pages/Contacts';
import Opportunities from './pages/Opportunities';

// User management (Settings)
import Users from './pages/Users';
import Roles from './pages/Roles';
import Groups from './pages/Groups';

// SAAS Owner pages
import Tenants from './pages/Tenants';
import Subscriptions from './pages/Subscriptions';
import Billings from './pages/Billings';

// Common components
import Loading from './components/common/Loading';

// Protected route wrapper
const ProtectedRoute = ({ children, requireSaas = false }) => {
  const { user, loading, isSaasOwner } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireSaas && !isSaasOwner()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public route wrapper (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    const defaultRoute = user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN'
      ? '/saas/dashboard'
      : '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* CRM Routes */}
      <Route path="/leads" element={
        <ProtectedRoute>
          <Leads />
        </ProtectedRoute>
      } />
      <Route path="/accounts" element={
        <ProtectedRoute>
          <Accounts />
        </ProtectedRoute>
      } />
      <Route path="/contacts" element={
        <ProtectedRoute>
          <Contacts />
        </ProtectedRoute>
      } />
      <Route path="/opportunities" element={
        <ProtectedRoute>
          <Opportunities />
        </ProtectedRoute>
      } />
      <Route path="/activities/*" element={
        <ProtectedRoute>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Activities</h2>
            <p>Coming in Phase 2...</p>
          </div>
        </ProtectedRoute>
      } />

      {/* Settings Routes (User management moved here) */}
      <Route path="/settings/users" element={
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/settings/roles" element={
        <ProtectedRoute>
          <Roles />
        </ProtectedRoute>
      } />
      <Route path="/settings/groups" element={
        <ProtectedRoute>
          <Groups />
        </ProtectedRoute>
      } />

      {/* SAAS Owner routes */}
      <Route path="/saas/dashboard" element={
        <ProtectedRoute requireSaas>
          <SaasDashboard />
        </ProtectedRoute>
      } />
      <Route path="/saas/tenants" element={
        <ProtectedRoute requireSaas>
          <Tenants />
        </ProtectedRoute>
      } />
      <Route path="/saas/subscriptions" element={
        <ProtectedRoute requireSaas>
          <Subscriptions />
        </ProtectedRoute>
      } />
      <Route path="/saas/billings" element={
        <ProtectedRoute requireSaas>
          <Billings />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={
        user ? (
          <Navigate to={
            user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN'
              ? '/saas/dashboard'
              : '/dashboard'
          } replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* 404 */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
