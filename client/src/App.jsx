import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/ui/Toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import QuickAdd from './pages/QuickAdd';
import NewConnection from './pages/NewConnection';
import EditConnection from './pages/EditConnection';
import ConnectionList from './pages/ConnectionList';
import ConnectionDetail from './pages/ConnectionDetail';
import FollowUps from './pages/FollowUps';
import ImportData from './pages/ImportData';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';


import Settings from './pages/Settings';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is not onboarded and tries to access a restricted page
  if (requireOnboarding && user?.is_onboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user IS onboarded and tries to access onboarding page
  if (!requireOnboarding && user?.is_onboarded === true) {
    return <Navigate to="/" replace />;
  }

  return requireOnboarding ? <Layout>{children}</Layout> : children;
};


function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DataProvider>
          <Router>
            <div className="app">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Register />} />
                <Route path="/register" element={<Register />} />


                {/* Protected Routes */}
                <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                <Route path="/connections" element={<ProtectedRoute><ConnectionList /></ProtectedRoute>} />
                <Route path="/connections/:id" element={<ProtectedRoute><ConnectionDetail /></ProtectedRoute>} />
                <Route path="/connections/:id/edit" element={<ProtectedRoute><EditConnection /></ProtectedRoute>} />
                <Route path="/connections/new" element={<ProtectedRoute><NewConnection /></ProtectedRoute>} />
                <Route path="/add" element={<ProtectedRoute><NewConnection /></ProtectedRoute>} />
                <Route path="/follow-ups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
                <Route path="/import" element={<ProtectedRoute><ImportData /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Toast />
          </Router>
        </DataProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
