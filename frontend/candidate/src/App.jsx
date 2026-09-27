import React, { useState, useEffect } from 'react';
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
import './App.css';

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
  );
}
