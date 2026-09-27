import React from 'react';
import { FileText, User } from 'lucide-react';

export default function Header({ user }) {
  const displayName = user?.full_name || 'Candidate';

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon-wrapper">
          <FileText size={28} strokeWidth={2.2} />
        </div>
        <h1 className="brand-title">Resume Screener</h1>
      </div>

      <div className="header-user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
          {displayName}
        </span>
        <div className="user-avatar" style={{ backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%' }}>
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
