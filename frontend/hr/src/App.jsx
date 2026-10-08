import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import JobFindPage from './pages/JobFindPage';
import CreateJobPage from './pages/CreateJobPage';
import CandidateMatchesPage from './pages/CandidateMatchesPage';
import AllCandidatesPage from './pages/AllCandidatesPage';
import KanbanPipelinePage from './pages/KanbanPipelinePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import { HRAPI } from './services/api';
import './App.css';

function ProtectedLayout({ children }) {
  const [currentUser, setCurrentUser] = React.useState(HRAPI.getCurrentUser());

  React.useEffect(() => {
    async function loadFreshUser() {
      const refreshed = await HRAPI.syncUser();
      if (refreshed) {
        setCurrentUser(refreshed);
      }
    }
    loadFreshUser();
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="hr-app-container">
      <Header user={currentUser} />
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
        
        <Route path="/pipeline" element={
          <ProtectedLayout>
            <KanbanPipelinePage />
          </ProtectedLayout>
        } />

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
            <SettingsPage />
          </ProtectedLayout>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
