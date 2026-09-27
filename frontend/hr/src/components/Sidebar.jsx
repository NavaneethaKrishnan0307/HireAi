import React from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Briefcase, Users, Folder, Settings, LogOut } from 'lucide-react';
import { HRAPI } from '../services/api';

export default function Sidebar() {
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
          <span>Create Job</span>
        </NavLink>

        <NavLink
          to="/job-find"
          className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={18} />
          <span>Job Find</span>
        </NavLink>

        <NavLink
          to="/matches"
          className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Candidate Matches</span>
        </NavLink>

        <NavLink
          to="/candidates"
          className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}
        >
          <Folder size={18} />
          <span>All Candidates</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="hr-sidebar-bottom">
        <div className="hr-nav-item logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  );
}
