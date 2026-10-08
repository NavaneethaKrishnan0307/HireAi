// HireAI Theme Manager (Light, Dark, and System Preferences)

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

export function getStoredTheme() {
  const saved = localStorage.getItem('hireai_theme');
  if (saved === 'dark' || saved === 'light' || saved === 'system') {
    return saved;
  }
  return 'light';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  localStorage.setItem('hireai_theme', theme);

  if (theme === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);

  // Listen for system theme changes if set to system
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (getStoredTheme() === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }
}
