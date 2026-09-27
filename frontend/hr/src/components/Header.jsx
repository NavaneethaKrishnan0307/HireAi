import React from 'react';
import { Users, User } from 'lucide-react';

export default function Header({ user }) {
  const displayName = user?.full_name || 'HR Recruiter';

  return (
    <header className="hr-header">
      <div className="hr-brand">
        <div className="hr-brand-icon">
          <Users size={28} strokeWidth={2.4} />
        </div>
        <h1 className="hr-brand-title">HR Dashboard</h1>
      </div>

      <div className="hr-header-user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
          {displayName}
        </span>
        <div className="hr-avatar" style={{ backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%' }}>
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
