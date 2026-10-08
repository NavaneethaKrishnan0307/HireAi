import React, { useState, useEffect } from 'react';

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
    // Branding & Header
    appNameCandidate: 'Resume Screener',
    appNameHR: 'HR Dashboard',
    
    // Candidate Navigation & Sidebar
    navUploadResume: 'Upload Resume',
    navMyProfile: 'My Profile',
    navAnalyzerReport: 'Resume Analyzer & Report',
    navMyUploads: 'My Uploads',
    navAvailableJobs: 'Available Jobs',
    navMyApplications: 'My Applications',
    navLogout: 'Logout',

    // HR Navigation & Sidebar
    navCreateJob: 'Create Job',
    navHiringPipeline: 'Hiring Pipeline',
    navJobFind: 'Job Find',
    navCandidateMatches: 'Candidate Matches',
    navAllCandidates: 'All Candidates',
    navSettings: 'Settings',

    // Candidate Upload Page
    uploadYourResume: 'Upload Your Resume',
    uploadSubtitle: 'Upload your resume in PDF or DOCX format and get matched with suitable job opportunities.',
    modifyProfile: 'Modify Profile',
    aiReportBtn: 'AI Resume Report',
    recentUploads: 'Recent Uploads',
    processedReady: 'Processed & Ready for Matching',
    previewUploaded: 'Preview',
    yourDataIsSafe: 'Your Data is Safe',
    safeSubtitle: 'We ensure the security and privacy of your data.',
    howItWorks: 'How It Works',
    step1Title: '1. Upload Resume',
    step1Desc: 'Upload your resume in PDF or DOCX',
    step2Title: '2. AI Parsing',
    step2Desc: 'Our AI extracts skills & experience',
    step3Title: '3. Store Securely',
    step3Desc: 'Your data is stored in our database',
    step4Title: '4. Get Matched',
    step4Desc: 'We match you with relevant jobs',

    // Profile Dropdown
    profile: 'My Profile',
    uploads: 'My Uploads & Docs',
    report: 'AI Resume Report',
    jobs: 'Available Jobs',
    pipeline: 'Hiring Pipeline',
    jobFind: 'Job Postings',
    candidates: 'Candidate Search',
    settings: 'Company Settings',
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
    appNameCandidate: 'Filtro de CV',
    appNameHR: 'Panel de RRHH',
    navUploadResume: 'Subir Currículum',
    navMyProfile: 'Mi Perfil',
    navAnalyzerReport: 'Analizador y Reporte de CV',
    navMyUploads: 'Mis Documentos',
    navAvailableJobs: 'Empleos Disponibles',
    navMyApplications: 'Mis Postulaciones',
    navLogout: 'Cerrar Sesión',

    navCreateJob: 'Crear Empleo',
    navHiringPipeline: 'Flujo de Contratación',
    navJobFind: 'Buscar Empleos',
    navCandidateMatches: 'Coincidencias',
    navAllCandidates: 'Todos los Candidatos',
    navSettings: 'Configuración',

    uploadYourResume: 'Sube Tu Currículum',
    uploadSubtitle: 'Sube tu CV en formato PDF o DOCX y conéctate con oportunidades laborales adecuadas.',
    modifyProfile: 'Modificar Perfil',
    aiReportBtn: 'Reporte de CV IA',
    recentUploads: 'Cargas Recientes',
    processedReady: 'Procesado y Listo para Coincidir',
    previewUploaded: 'Vista Previa',
    yourDataIsSafe: 'Tus Datos Están Seguros',
    safeSubtitle: 'Garantizamos la seguridad y privacidad de tus datos personales.',
    howItWorks: 'Cómo Funciona',
    step1Title: '1. Sube tu CV',
    step1Desc: 'Sube tu archivo PDF o DOCX',
    step2Title: '2. Análisis IA',
    step2Desc: 'Nuestra IA extrae habilidades',
    step3Title: '3. Almacenamiento',
    step3Desc: 'Tus datos se guardan con seguridad',
    step4Title: '4. Coincidencias',
    step4Desc: 'Te emparejamos con empleos',

    profile: 'Mi Perfil',
    uploads: 'Mis Documentos',
    report: 'Informe de CV IA',
    jobs: 'Empleos Disponibles',
    pipeline: 'Flujo de Contratación',
    jobFind: 'Publicaciones de Empleo',
    candidates: 'Búsqueda de Candidatos',
    settings: 'Configuración Empresa',
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
    appNameCandidate: 'Sélecteur de CV',
    appNameHR: 'Tableau de bord RH',
    navUploadResume: 'Téléverser un CV',
    navMyProfile: 'Mon Profil',
    navAnalyzerReport: 'Analyseur et Rapport de CV',
    navMyUploads: 'Mes Téléversements',
    navAvailableJobs: 'Offres d\'Emploi',
    navMyApplications: 'Mes Candidatures',
    navLogout: 'Déconnexion',

    navCreateJob: 'Créer une Offre',
    navHiringPipeline: 'Pipeline Recrutement',
    navJobFind: 'Offres d\'Emploi',
    navCandidateMatches: 'Candidats Correspondants',
    navAllCandidates: 'Tous les Candidats',
    navSettings: 'Paramètres',

    uploadYourResume: 'Téléversez Votre CV',
    uploadSubtitle: 'Téléversez votre CV au format PDF ou DOCX et accédez aux opportunités professionnelles ciblées.',
    modifyProfile: 'Modifier le Profil',
    aiReportBtn: 'Rapport CV IA',
    recentUploads: 'Téléversements Récents',
    processedReady: 'Traité et Prêt pour l\'Appariement',
    previewUploaded: 'Aperçu',
    yourDataIsSafe: 'Vos Données sont Sécurisées',
    safeSubtitle: 'Nous assurons la confidentialité stricte de vos informations.',
    howItWorks: 'Comment ça Fonctionne',
    step1Title: '1. Téléversez',
    step1Desc: 'Fichier PDF ou DOCX',
    step2Title: '2. Analyse IA',
    step2Desc: 'Extraction des compétences clés',
    step3Title: '3. Stockage Sécurisé',
    step3Desc: 'Données protégées dans le cloud',
    step4Title: '4. Appariement',
    step4Desc: 'Connexion aux offres idéales',

    profile: 'Mon Profil',
    uploads: 'Mes Documents & CV',
    report: 'Rapport CV IA',
    jobs: 'Offres Disponibles',
    pipeline: 'Pipeline Recrutement',
    jobFind: 'Offres d\'Emploi',
    candidates: 'Recherche Candidats',
    settings: 'Paramètres Entreprise',
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
    appNameCandidate: 'Lebenslauf-Screener',
    appNameHR: 'HR-Dashboard',
    navUploadResume: 'Lebenslauf hochladen',
    navMyProfile: 'Mein Profil',
    navAnalyzerReport: 'Lebenslauf-Analyse & Bericht',
    navMyUploads: 'Meine Uploads',
    navAvailableJobs: 'Verfügbare Stellen',
    navMyApplications: 'Meine Bewerbungen',
    navLogout: 'Abmelden',

    navCreateJob: 'Stelle erstellen',
    navHiringPipeline: 'Bewerbungsprozess',
    navJobFind: 'Stellensuche',
    navCandidateMatches: 'Passende Kandidaten',
    navAllCandidates: 'Alle Kandidaten',
    navSettings: 'Einstellungen',

    uploadYourResume: 'Laden Sie Ihren Lebenslauf hoch',
    uploadSubtitle: 'Laden Sie Ihren Lebenslauf im PDF- oder DOCX-Format hoch und finden Sie passende Stellenangebote.',
    modifyProfile: 'Profil bearbeiten',
    aiReportBtn: 'KI-Bericht anzeigen',
    recentUploads: 'Letzte Uploads',
    processedReady: 'Verarbeitet & Bereit für Matching',
    previewUploaded: 'Vorschau',
    yourDataIsSafe: 'Ihre Daten sind sicher',
    safeSubtitle: 'Wir gewährleisten die höchste Datensicherheit und Vertraulichkeit.',
    howItWorks: 'So funktioniert es',
    step1Title: '1. Hochladen',
    step1Desc: 'PDF oder DOCX auswählen',
    step2Title: '2. KI-Parsing',
    step2Desc: 'Fähigkeiten werden extrahiert',
    step3Title: '3. Sicher speichern',
    step3Desc: 'Verschlüsselt in der Datenbank',
    step4Title: '4. Job-Matching',
    step4Desc: 'Passende Stellen finden',

    profile: 'Mein Profil',
    uploads: 'Meine Dokumente',
    report: 'KI-Lebenslaufbericht',
    jobs: 'Verfügbare Stellen',
    pipeline: 'Bewerbungsprozess',
    jobFind: 'Stellenausschreibungen',
    candidates: 'Kandidatensuche',
    settings: 'Unternehmenseinstellungen',
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
    appNameCandidate: '履歴書スクリーナー',
    appNameHR: 'HRダッシュボード',
    navUploadResume: '履歴書アップロード',
    navMyProfile: 'マイプロフィール',
    navAnalyzerReport: 'AI履歴書分析・レポート',
    navMyUploads: '提出書類一覧',
    navAvailableJobs: '募集中の求人',
    navMyApplications: '応募履歴',
    navLogout: 'ログアウト',

    navCreateJob: '求人票を作成',
    navHiringPipeline: '選考パイプライン',
    navJobFind: '求人一覧',
    navCandidateMatches: 'AIマッチ候補者',
    navAllCandidates: '全候補者ディレクトリ',
    navSettings: '企業設定',

    uploadYourResume: '履歴書をアップロード',
    uploadSubtitle: 'PDFまたはDOCX形式の履歴書をアップロードして、最適な求人とマッチングします。',
    modifyProfile: 'プロフィール編集',
    aiReportBtn: 'AIレポート',
    recentUploads: '最近のアップロード',
    processedReady: '解析完了・マッチング待機中',
    previewUploaded: 'プレビュー',
    yourDataIsSafe: 'データは厳重に保護されています',
    safeSubtitle: '暗号化と最高水準のセキュリティにより情報を保護します。',
    howItWorks: 'ご利用の流れ',
    step1Title: '1. アップロード',
    step1Desc: 'PDFまたはDOCXを登録',
    step2Title: '2. AI解析',
    step2Desc: 'スキルと経歴を自動抽出',
    step3Title: '3. 安全に保管',
    step3Desc: 'セキュアなデータベースへ保存',
    step4Title: '4. マッチング',
    step4Desc: '最適な求人をご提案',

    profile: 'マイプロフィール',
    uploads: '提出書類・履歴書',
    report: 'AI履歴書レポート',
    jobs: '募集中の求人',
    pipeline: '選考パイプライン',
    jobFind: '求人一覧',
    candidates: '候補者検索',
    settings: '企業設定',
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
    appNameCandidate: '简历筛选系统',
    appNameHR: 'HR 招聘控制台',
    navUploadResume: '上传简历',
    navMyProfile: '个人资料',
    navAnalyzerReport: 'AI 简历分析与报告',
    navMyUploads: '我的上传文件',
    navAvailableJobs: '在招职位',
    navMyApplications: '我的应聘记录',
    navLogout: '退出登录',

    navCreateJob: '发布职位',
    navHiringPipeline: '招聘流程看板',
    navJobFind: '职位检索',
    navCandidateMatches: 'AI 匹配候选人',
    navAllCandidates: '所有候选人库',
    navSettings: '企业设置',

    uploadYourResume: '上传您的简历',
    uploadSubtitle: '上传 PDF 或 DOCX 格式的简历，即刻获取精准职位智能匹配。',
    modifyProfile: '编辑个人资料',
    aiReportBtn: 'AI 简历报告',
    recentUploads: '最近上传',
    processedReady: '已解析完成・就绪匹配',
    previewUploaded: '在线预览',
    yourDataIsSafe: '您的数据享有企业级安全保护',
    safeSubtitle: '我们严格保障您所有个人隐私与简历数据的端到端安全。',
    howItWorks: '使用流程',
    step1Title: '1. 上传简历',
    step1Desc: '上传 PDF 或 DOCX 文件',
    step2Title: '2. 智能解析',
    step2Desc: '自动提取技能与工作经历',
    step3Title: '3. 安全云端存储',
    step3Desc: '企业级数据库安全加密',
    step4Title: '4. 职位匹配',
    step4Desc: '精准推荐优质适合岗位',

    profile: '个人资料',
    uploads: '我的文档与简历',
    report: 'AI 简历分析报告',
    jobs: '在招职位',
    pipeline: '招聘流程',
    jobFind: '职位发布',
    candidates: '候选人库',
    settings: '企业设置',
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

// React Hook for dynamic reactive re-rendering across components
export function useLanguage() {
  const [lang, setLang] = useState(getStoredLanguage);

  useEffect(() => {
    const handleLangChange = () => {
      setLang(getStoredLanguage());
    };
    window.addEventListener('hireai_language_changed', handleLangChange);
    return () => window.removeEventListener('hireai_language_changed', handleLangChange);
  }, []);

  return {
    currentLang: lang,
    t: (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key,
    setLanguage: setStoredLanguage
  };
}
