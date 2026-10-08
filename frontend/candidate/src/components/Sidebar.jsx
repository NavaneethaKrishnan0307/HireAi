import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, FileText, Briefcase, CheckCircle2, LogOut, Sparkles } from 'lucide-react';
import { CandidateAPI } from '../services/api';
import { useLanguage } from '../utils/i18n';

export default function Sidebar() {
  const { t } = useLanguage();

  const handleLogout = () => {
    CandidateAPI.logout();
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink
          to="/upload"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={18} />
          <span>{t('navUploadResume')}</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={18} />
          <span>{t('navMyProfile')}</span>
        </NavLink>

        <NavLink
          to="/analyzer"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Sparkles size={18} color="#2563eb" />
          <span>{t('navAnalyzerReport')}</span>
        </NavLink>

        <NavLink
          to="/uploads"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>{t('navMyUploads')}</span>
        </NavLink>

        <NavLink
          to="/jobs"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={18} />
          <span>{t('navAvailableJobs')}</span>
        </NavLink>

        <NavLink
          to="/applications"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <CheckCircle2 size={18} />
          <span>{t('navMyApplications')}</span>
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="nav-item logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>{t('navLogout')}</span>
        </div>
      </div>
    </aside>
  );
}
