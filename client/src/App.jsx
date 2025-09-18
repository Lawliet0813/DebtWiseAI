import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Debts = lazy(() => import('./pages/Debts'));
const DebtDetail = lazy(() => import('./pages/DebtDetail'));
const Strategies = lazy(() => import('./pages/Strategies'));
const Goals = lazy(() => import('./pages/Goals'));
const Calculators = lazy(() => import('./pages/Calculators'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner size="large" />}>
                      <Login />
                    </Suspense>
                  </PublicRoute>
                } />
                
                <Route path="/register" element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner size="large" />}>
                      <Register />
                    </Suspense>
                  </PublicRoute>
                } />

                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  
                  <Route path="dashboard" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Dashboard />
                    </Suspense>
                  } />
                  
                  <Route path="debts" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Debts />
                    </Suspense>
                  } />
                  
                  <Route path="debts/:id" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <DebtDetail />
                    </Suspense>
                  } />
                  
                  <Route path="strategies" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Strategies />
                    </Suspense>
                  } />
                  
                  <Route path="goals" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Goals />
                    </Suspense>
                  } />
                  
                  <Route path="calculators" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Calculators />
                    </Suspense>
                  } />
                  
                  <Route path="reports" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Reports />
                    </Suspense>
                  } />
                  
                  <Route path="settings" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Settings />
                    </Suspense>
                  } />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={
                  <Suspense fallback={<LoadingSpinner size="large" />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;