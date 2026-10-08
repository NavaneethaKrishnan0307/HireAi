import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import UploadResumePage from './pages/UploadResumePage';
import MyProfilePage from './pages/MyProfilePage';
import MyUploadsPage from './pages/MyUploadsPage';
import AvailableJobsPage from './pages/AvailableJobsPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { CandidateAPI } from './services/api';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import './App.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '480px', background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/upload';
              }}
              style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} /> Return to Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedLayout({ children }) {
  const user = CandidateAPI.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Header user={user} />
      <div className="main-wrapper">
        <Sidebar />
        <main style={{ flex: 1, backgroundColor: 'var(--bg-page)', overflowY: 'auto' }}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/upload" element={
            <ProtectedLayout>
              <UploadResumePage />
            </ProtectedLayout>
          } />
          
          <Route path="/profile" element={
            <ProtectedLayout>
              <MyProfilePage />
            </ProtectedLayout>
          } />
          
          <Route path="/analyzer" element={
            <ProtectedLayout>
              <ResumeAnalyzerPage />
            </ProtectedLayout>
          } />

          <Route path="/report" element={
            <ProtectedLayout>
              <ResumeAnalyzerPage />
            </ProtectedLayout>
          } />

          <Route path="/uploads" element={
            <ProtectedLayout>
              <MyUploadsPage />
            </ProtectedLayout>
          } />
          
          <Route path="/jobs" element={
            <ProtectedLayout>
              <AvailableJobsPage />
            </ProtectedLayout>
          } />
          
          <Route path="/applications" element={
            <ProtectedLayout>
              <MyApplicationsPage />
            </ProtectedLayout>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
