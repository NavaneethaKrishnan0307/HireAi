import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import JobFindPage from './pages/JobFindPage';
import CreateJobPage from './pages/CreateJobPage';
import CandidateMatchesPage from './pages/CandidateMatchesPage';
import AllCandidatesPage from './pages/AllCandidatesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { HRAPI } from './services/api';
import './App.css';

function ProtectedLayout({ children }) {
  const user = HRAPI.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="hr-app-container">
      <Header user={user} />
      <div className="hr-main-wrapper">
        <Sidebar />
        <main style={{ flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/job-find" element={
          <ProtectedLayout>
            <JobFindPage />
          </ProtectedLayout>
        } />

        <Route path="/create-job" element={
          <ProtectedLayout>
            <CreateJobPage />
          </ProtectedLayout>
        } />

        <Route path="/matches" element={
          <ProtectedLayout>
            <CandidateMatchesPage />
          </ProtectedLayout>
        } />

        <Route path="/candidates" element={
          <ProtectedLayout>
            <AllCandidatesPage />
          </ProtectedLayout>
        } />

        <Route path="/settings" element={
          <ProtectedLayout>
            <div className="hr-content-area">
              <h2 className="hr-page-title">Settings</h2>
              <p className="hr-page-subtitle">Recruitment pipeline preferences and organization profile.</p>
              <div className="job-find-card">
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>Organization Profile</h3>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Company: TechCorp Solutions</p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Department: Talent Acquisition</p>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>AI Engine: Deterministic Multi-Criteria Rule Ranker (Active)</p>
              </div>
            </div>
          </ProtectedLayout>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
