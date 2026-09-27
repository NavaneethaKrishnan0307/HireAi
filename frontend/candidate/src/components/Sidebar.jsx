import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, FileText, Briefcase, CheckCircle2, LogOut, Sparkles } from 'lucide-react';
import { CandidateAPI } from '../services/api';

export default function Sidebar() {
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
          <span>Upload Resume</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={18} />
          <span>My Profile</span>
        </NavLink>

        <NavLink
          to="/analyzer"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Sparkles size={18} color="#2563eb" />
          <span>Resume Analyzer & Report</span>
        </NavLink>

        <NavLink
          to="/uploads"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>My Uploads</span>
        </NavLink>

        <NavLink
          to="/jobs"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={18} />
          <span>Available Jobs</span>
        </NavLink>

        <NavLink
          to="/applications"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <CheckCircle2 size={18} />
          <span>My Applications</span>
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="nav-item logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  );
}
