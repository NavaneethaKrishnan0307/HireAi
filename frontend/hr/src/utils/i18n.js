// HireAI International Language System

export const LANGUAGES = [
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文 (简体)', flag: '🇨🇳' }
];

export const TRANSLATIONS = {
  en: {
    profile: 'My Profile',
    uploads: 'My Uploads & Docs',
    report: 'AI Resume Report',
    jobs: 'Available Jobs',
    pipeline: 'Hiring Pipeline',
    jobFind: 'Job Postings',
    candidates: 'Candidate Search',
    settings: 'Company Settings',
    switchPortal: 'Switch to HR Portal',
    switchCandidate: 'Switch to Candidate Portal',
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    soundChime: 'Sound Chimes',
    security: 'Account & Security',
    help: 'Help & Shortcuts',
    signOut: 'Sign Out',
    availHiring: 'Available for Hire',
    activeHiring: 'Actively Recruiting',
    busyStatus: 'In Interviews',
    awayStatus: 'Away'
  },
  es: {
    profile: 'Mi Perfil',
    uploads: 'Mis Documentos',
    report: 'Informe de CV IA',
    jobs: 'Empleos Disponibles',
    pipeline: 'Flujo de Contratación',
    jobFind: 'Publicaciones de Empleo',
    candidates: 'Búsqueda de Candidatos',
    settings: 'Configuración Empresa',
    switchPortal: 'Cambiar a Portal RRHH',
    switchCandidate: 'Cambiar a Portal Candidato',
    appearance: 'Apariencia',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    language: 'Idioma',
    soundChime: 'Alertas Sonoras',
    security: 'Cuenta y Seguridad',
    help: 'Ayuda y Accesos',
    signOut: 'Cerrar Sesión',
    availHiring: 'Disponible para Contratación',
    activeHiring: 'Reclutando Activamente',
    busyStatus: 'En Entrevistas',
    awayStatus: 'Ausente'
  },
  fr: {
    profile: 'Mon Profil',
    uploads: 'Mes Documents & CV',
    report: 'Rapport CV IA',
    jobs: 'Offres Disponibles',
    pipeline: 'Pipeline Recrutement',
    jobFind: 'Offres d\'Emploi',
    candidates: 'Recherche Candidats',
    settings: 'Paramètres Entreprise',
    switchPortal: 'Passer au Portail RH',
    switchCandidate: 'Passer au Portail Candidat',
    appearance: 'Apparence',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    language: 'Langue',
    soundChime: 'Alertes Sonores',
    security: 'Compte & Sécurité',
    help: 'Aide & Raccourcis',
    signOut: 'Se Déconnecter',
    availHiring: 'Disponible pour Recrutement',
    activeHiring: 'Recrutement Actif',
    busyStatus: 'En Entretien',
    awayStatus: 'Absent'
  },
  de: {
    profile: 'Mein Profil',
    uploads: 'Meine Dokumente',
    report: 'KI-Lebenslaufbericht',
    jobs: 'Verfügbare Stellen',
    pipeline: 'Bewerbungsprozess',
    jobFind: 'Stellenausschreibungen',
    candidates: 'Kandidatensuche',
    settings: 'Unternehmenseinstellungen',
    switchPortal: 'Zum HR-Portal wechseln',
    switchCandidate: 'Zum Kandidatenportal wechseln',
    appearance: 'Erscheinungsbild',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    language: 'Sprache',
    soundChime: 'Benachrichtigungstöne',
    security: 'Konto & Sicherheit',
    help: 'Hilfe & Tastenkürzel',
    signOut: 'Abmelden',
    availHiring: 'Verfügbar für Anstellung',
    activeHiring: 'Aktiv auf der Suche',
    busyStatus: 'In Vorstellungsgesprächen',
    awayStatus: 'Abwesend'
  },
  ja: {
    profile: 'マイプロフィール',
    uploads: '提出書類・履歴書',
    report: 'AI履歴書レポート',
    jobs: '募集中の求人',
    pipeline: '選考パイプライン',
    jobFind: '求人一覧',
    candidates: '候補者検索',
    settings: '企業設定',
    switchPortal: 'HRポータルへ切り替え',
    switchCandidate: '候補者ポータルへ切り替え',
    appearance: '表示モード',
    light: 'ライト',
    dark: 'ダーク',
    system: '端末に合わせる',
    language: '言語設定',
    soundChime: '通知サウンド',
    security: 'アカウントとセキュリティ',
    help: 'ヘルプとショートカット',
    signOut: 'ログアウト',
    availHiring: '転職活動中（即日可能）',
    activeHiring: '積極採用中',
    busyStatus: '面接選考中',
    awayStatus: '離席中'
  },
  zh: {
    profile: '个人资料',
    uploads: '我的文档与简历',
    report: 'AI 简历分析报告',
    jobs: '在招职位',
    pipeline: '招聘流程',
    jobFind: '职位发布',
    candidates: '候选人库',
    settings: '企业设置',
    switchPortal: '切换至 HR 端',
    switchCandidate: '切换至求职端',
    appearance: '外观主题',
    light: '明亮模式',
    dark: '深色模式',
    system: '跟随系统',
    language: '语言设置',
    soundChime: '提示音效',
    security: '账户与安全',
    help: '帮助与快捷键',
    signOut: '退出登录',
    availHiring: '随时可到岗',
    activeHiring: '正在招聘',
    busyStatus: '面试中',
    awayStatus: '暂离'
  }
};

export function getStoredLanguage() {
  const saved = localStorage.getItem('hireai_lang');
  if (saved && TRANSLATIONS[saved]) return saved;
  return 'en';
}

export function setStoredLanguage(code) {
  if (TRANSLATIONS[code]) {
    localStorage.setItem('hireai_lang', code);
    window.dispatchEvent(new Event('hireai_language_changed'));
  }
}

export function t(key) {
  const lang = getStoredLanguage();
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}
