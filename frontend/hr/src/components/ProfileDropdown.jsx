import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  ChevronDown, 
  Moon, 
  Sun, 
  Monitor, 
  Globe, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  HelpCircle, 
  LogOut, 
  ArrowRightLeft, 
  Briefcase, 
  Users, 
  Check, 
  X, 
  Lock, 
  Building, 
  Clock, 
  Kanban,
  FileCheck2
} from 'lucide-react';
import { THEMES, getStoredTheme, applyTheme } from '../utils/themeManager';
import { LANGUAGES, getStoredLanguage, setStoredLanguage, t } from '../utils/i18n';
import { isSoundEnabled, setSoundEnabled, playChime, playToggle } from '../utils/soundEffects';

export default function ProfileDropdown({ user, companyName, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme());
  const [currentLang, setCurrentLang] = useState(getStoredLanguage());
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [userStatus, setUserStatus] = useState(() => localStorage.getItem('hireai_hr_status') || 'active');
  
  // Modals
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const dropdownRef = useRef(null);

  const displayName = user?.full_name || 'HR Recruiter';
  const displayEmail = user?.email || 'hr@techcorp.com';
  const effectiveCompany = companyName || user?.company_name || 'TechCorp Solutions';

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'HR';

  // Listen for clicks outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (showSecurityModal) setShowSecurityModal(false);
        else if (showHelpModal) setShowHelpModal(false);
        else if (isOpen) {
          setIsOpen(false);
          setShowLangMenu(false);
        }
      }
      // Keyboard shortcut Alt + T to toggle theme
      if (event.altKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        handleThemeChange(nextTheme);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showSecurityModal, showHelpModal, currentTheme]);

  // Listen for language changes
  useEffect(() => {
    function onLangChange() {
      setCurrentLang(getStoredLanguage());
    }
    window.addEventListener('hireai_language_changed', onLangChange);
    return () => window.removeEventListener('hireai_language_changed', onLangChange);
  }, []);

  const handleThemeChange = (theme) => {
    playToggle();
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const handleLangChange = (code) => {
    playToggle();
    setCurrentLang(code);
    setStoredLanguage(code);
    setShowLangMenu(false);
  };

  const handleSoundToggle = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    setSoundEnabled(nextState);
  };

  const cycleStatus = () => {
    playToggle();
    const statuses = ['active', 'interviewing', 'away'];
    const nextIdx = (statuses.indexOf(userStatus) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];
    setUserStatus(nextStatus);
    localStorage.setItem('hireai_hr_status', nextStatus);
  };

  const getStatusLabel = () => {
    if (userStatus === 'active') return { label: t('activeHiring'), color: '#10b981', dot: '🟢' };
    if (userStatus === 'interviewing') return { label: t('busyStatus'), color: '#f59e0b', dot: '🟡' };
    return { label: t('awayStatus'), color: '#64748b', dot: '⚪' };
  };

  const statusInfo = getStatusLabel();

  return (
    <div className="profile-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => {
          playToggle();
          setIsOpen(!isOpen);
        }}
        className="hr-profile-trigger-btn"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="HR Profile & Settings"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: isOpen ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
          border: '1px solid',
          borderColor: isOpen ? '#6ee7b7' : 'transparent',
          padding: '4px 10px 4px 6px',
          borderRadius: '24px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'rgba(241, 245, 249, 0.8)';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
      >
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
          }}>
            {initials}
          </div>
          <span style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: statusInfo.color,
            border: '2px solid #ffffff'
          }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #0f172a)', lineHeight: 1.2 }}>
            {displayName}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', lineHeight: 1.2 }}>
            HR Lead
          </span>
        </div>

        <ChevronDown 
          size={16} 
          color="#64748b" 
          style={{ 
            transition: 'transform 0.2s ease', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
          }} 
        />
      </button>

      {/* GitHub-Style Dropdown Menu */}
      {isOpen && (
        <div 
          className="profile-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '300px',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: '14px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.18), 0 0 1px 1px rgba(0,0,0,0.06)',
            padding: '8px 0',
            zIndex: 1000,
            animation: 'fadeInSlide 0.18s ease-out',
            color: 'var(--text-main, #0f172a)'
          }}
        >
          {/* Section 1: User Header & Status */}
          <div style={{ padding: '12px 18px 10px 18px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                fontWeight: '700'
              }}>
                {initials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main, #0f172a)', truncate: 'ellipsis' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                  🏢 {effectiveCompany}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', wordBreak: 'break-all' }}>
                  {displayEmail}
                </div>
              </div>
            </div>

            {/* Interactive Status Pill */}
            <button
              type="button"
              onClick={cycleStatus}
              title="Click to toggle your recruiting status"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #e2e8f0)',
                backgroundColor: 'rgba(241, 245, 249, 0.5)',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-main, #334155)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{statusInfo.dot}</span>
                <span>{statusInfo.label}</span>
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Change</span>
            </button>
          </div>

          {/* Section 2: Quick Navigation */}
          <div style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <Link 
              to="/pipeline" 
              onClick={() => setIsOpen(false)}
              className="dropdown-item"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #334155)', textDecoration: 'none' }}
            >
              <Kanban size={16} color="#059669" />
              <span>{t('pipeline')}</span>
            </Link>

            <Link 
              to="/job-find" 
              onClick={() => setIsOpen(false)}
              className="dropdown-item"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #334155)', textDecoration: 'none' }}
            >
              <Briefcase size={16} color="#2563eb" />
              <span>{t('jobFind')}</span>
            </Link>

            <Link 
              to="/candidates" 
              onClick={() => setIsOpen(false)}
              className="dropdown-item"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #334155)', textDecoration: 'none' }}
            >
              <Users size={16} color="#8b5cf6" />
              <span>{t('candidates')}</span>
            </Link>

            <Link 
              to="/settings" 
              onClick={() => setIsOpen(false)}
              className="dropdown-item"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #334155)', textDecoration: 'none' }}
            >
              <Building size={16} color="#f59e0b" />
              <span>{t('settings')}</span>
            </Link>
          </div>

          {/* Section 3: Switch Portal */}
          <div style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="dropdown-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-main, #334155)',
                textDecoration: 'none'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ArrowRightLeft size={16} color="#059669" />
                <span>{t('switchCandidate')}</span>
              </span>
              <span style={{ fontSize: '10px', backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                PORT 5173
              </span>
            </a>
          </div>

          {/* Section 4: Preferences (Appearance, Language, Sound) */}
          <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            {/* Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {currentTheme === 'dark' ? <Moon size={14} color="#38bdf8" /> : <Sun size={14} color="#f59e0b" />}
                {t('appearance')}
              </span>
              <div style={{ display: 'flex', background: 'rgba(241, 245, 249, 0.8)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <button
                  type="button"
                  onClick={() => handleThemeChange(THEMES.LIGHT)}
                  style={{
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: currentTheme === 'light' ? '#ffffff' : 'transparent',
                    color: currentTheme === 'light' ? '#0f172a' : '#64748b',
                    boxShadow: currentTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                  title="Light Theme"
                >
                  <Sun size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange(THEMES.DARK)}
                  style={{
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: currentTheme === 'dark' ? '#0f172a' : 'transparent',
                    color: currentTheme === 'dark' ? '#38bdf8' : '#64748b',
                    boxShadow: currentTheme === 'dark' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                  }}
                  title="Dark Theme"
                >
                  <Moon size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange(THEMES.SYSTEM)}
                  style={{
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: currentTheme === 'system' ? '#ffffff' : 'transparent',
                    color: currentTheme === 'system' ? '#0f172a' : '#64748b',
                    boxShadow: currentTheme === 'system' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                  title="System Theme"
                >
                  <Monitor size={12} />
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', position: 'relative' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} color="#10b981" />
                {t('language')}
              </span>
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  backgroundColor: 'rgba(241, 245, 249, 0.8)',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-main, #334155)',
                  cursor: 'pointer'
                }}
              >
                <span>{LANGUAGES.find(l => l.code === currentLang)?.flag}</span>
                <span>{LANGUAGES.find(l => l.code === currentLang)?.label.split(' ')[0]}</span>
                <ChevronDown size={12} />
              </button>

              {/* Language Submenu */}
              {showLangMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  zIndex: 1100,
                  minWidth: '160px',
                  padding: '4px 0'
                }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLangChange(lang.code)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        border: 'none',
                        background: currentLang === lang.code ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                        color: currentLang === lang.code ? '#059669' : 'var(--text-main, #334155)',
                        fontWeight: currentLang === lang.code ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {currentLang === lang.code && <Check size={14} color="#059669" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Chime */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {soundActive ? <Volume2 size={14} color="#10b981" /> : <VolumeX size={14} color="#94a3b8" />}
                {t('soundChime')}
              </span>
              <button
                type="button"
                onClick={handleSoundToggle}
                style={{
                  width: '38px',
                  height: '20px',
                  borderRadius: '10px',
                  backgroundColor: soundActive ? '#10b981' : '#cbd5e1',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                  padding: '2px'
                }}
                title={soundActive ? 'Mute sound chimes' : 'Enable sound chimes'}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: soundActive ? '20px' : '2px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>

          {/* Section 5: Modals (Security & Help) */}
          <div style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowSecurityModal(true);
              }}
              className="dropdown-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-main, #334155)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <ShieldCheck size={16} color="#059669" />
              <span>{t('security')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowHelpModal(true);
              }}
              className="dropdown-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-main, #334155)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <HelpCircle size={16} color="#64748b" />
              <span>{t('help')}</span>
            </button>
          </div>

          {/* Section 6: Sign Out */}
          <div style={{ padding: '6px 0 0 0' }}>
            <button
              type="button"
              onClick={() => {
                playChime();
                setIsOpen(false);
                onLogout();
              }}
              className="dropdown-item signout-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#ef4444',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <LogOut size={16} color="#ef4444" />
              <span>{t('signOut')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Account & Security Modal */}
      {showSecurityModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowSecurityModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color, #e2e8f0)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Account & Security</h3>
              </div>
              <button type="button" onClick={() => setShowSecurityModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-main, #334155)', marginBottom: '18px' }}>
              <div style={{ padding: '12px', backgroundColor: 'rgba(241, 245, 249, 0.6)', borderRadius: '10px', marginBottom: '12px' }}>
                <div><strong>Email:</strong> {displayEmail}</div>
                <div><strong>Company:</strong> {effectiveCompany}</div>
                <div><strong>Role:</strong> HR Recruiter (Enterprise Admin)</div>
                <div><strong>Vault Status:</strong> Enforced Multi-Tenant Isolation</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '600', fontSize: '12px' }}>
                <FileCheck2 size={16} /> 11-Factor Enterprise Integrity Active
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSecurityModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Help & Shortcuts Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowHelpModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color, #e2e8f0)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Help & Keyboard Shortcuts</h3>
              </div>
              <button type="button" onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-main, #334155)', marginBottom: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <span>Toggle Dark / Light Theme</span>
                <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Alt + T</kbd>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <span>Close Modals / Menus</span>
                <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Esc</kbd>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', padding: '10px 0' }}>
                <span>Switch Portal (HR &lt;-&gt; Candidate)</span>
                <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Header Link</kbd>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
