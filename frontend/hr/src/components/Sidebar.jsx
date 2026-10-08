import React from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Briefcase, Users, Folder, Settings, LogOut, Columns } from 'lucide-react';
import { HRAPI } from '../services/api';
import { useLanguage } from '../utils/i18n';

export default function Sidebar() {
  const { t } = useLanguage();

  const handleLogout = () => {
    HRAPI.logout();
    window.location.href = '/login';
  };

  return (
    <aside className="hr-sidebar">
      <nav className="hr-sidebar-nav">
        <NavLink
          to="/create-job"
          className={({ isActive }) => `hr-nav-item create-job ${isActive ? 'active' : ''}`}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>{t('navCreateJob')}</span>
        </NavLink>

        <NavLink
          to="/pipeline"
          className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}
        >
          <Columns size={18} />
          <span>{t('navHiringPipeline')}</span>
        </NavLink>

        <NavLink
          to="/job-find"
          className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={18} />
          <span>{t('navJobFind')}</span>
        </NavLink>

        <NavLink
          to="/matches"
          className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>{t('navCandidateMatches')}</span>
        </NavLink>

        <NavLink
          to="/candidates"
          className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}
        >
          <Folder size={18} />
          <span>{t('navAllCandidates')}</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>{t('navSettings')}</span>
        </NavLink>
      </nav>

      <div className="hr-sidebar-bottom">
        <div className="hr-nav-item logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>{t('navLogout')}</span>
        </div>
      </div>
    </aside>
  );
}
