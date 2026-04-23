import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeePanelPage from './pages/EmployeePanelPage';
import AdminPanelPage from './pages/AdminPanelPage';
import ReportsPage from './pages/ReportsPage';
import Layout from './components/Layout';
import './index.css';

function App() {
  return (
    console.log("App loaded");
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: 'Cairo, sans-serif',
                direction: 'rtl',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { style: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' } },
              error: { style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="attendance" element={<EmployeePanelPage />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPanelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute adminOnly>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
