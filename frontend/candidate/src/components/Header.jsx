import React from 'react';
import { FileText } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import { CandidateAPI } from '../services/api';
import { useLanguage } from '../utils/i18n';

export default function Header({ user }) {
  const { t } = useLanguage();

  const handleLogout = () => {
    CandidateAPI.logout();
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon-wrapper">
          <FileText size={28} strokeWidth={2.2} />
        </div>
        <h1 className="brand-title">{t('appNameCandidate')}</h1>
      </div>

      <div className="header-user">
        <ProfileDropdown user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
}
