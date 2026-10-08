import React from 'react';
import { Users, User } from 'lucide-react';

export default function Header({ user }) {
  const displayName = user?.full_name || 'HR Recruiter';
  const companyName = user?.company_name || 
    (user?.email?.toLowerCase().includes('ghr@') || user?.email?.toLowerCase().includes('google') ? 'Google' :
     user?.email?.toLowerCase().includes('azhr@') || user?.email?.toLowerCase().includes('azenture') ? 'AZENTURE' :
     user?.email?.toLowerCase().includes('techcorp') || user?.email?.toLowerCase().includes('sarah') ? 'TechCorp Solutions' :
     'Google');

  return (
    <header className="hr-header">
      <div className="hr-brand">
        <div className="hr-brand-icon">
          <Users size={28} strokeWidth={2.4} />
        </div>
        <h1 className="hr-brand-title">HR Dashboard</h1>
      </div>

      <div className="hr-header-user" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid #334155',
          padding: '6px 14px',
          borderRadius: '9999px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            🏢 {companyName}
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: '700',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            padding: '2px 8px',
            borderRadius: '9999px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            SECURE VAULT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
            {displayName}
          </span>
          <div className="hr-avatar" style={{ backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%' }}>
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
