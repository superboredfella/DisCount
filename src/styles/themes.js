export const THEMES = {
  midnight: {
    name: 'Midnight',
    vars: {
      '--bg-primary': '#0d0e10',
      '--bg-secondary': '#141517',
      '--bg-tertiary': '#1a1b1f',
      '--bg-elevated': '#222428',
      '--bg-input': '#0d0e10',
      '--accent': '#5865f2',
      '--accent-hover': '#4752c4',
    },
  },
  forest: {
    name: 'Forest',
    vars: {
      '--bg-primary': '#0f1410',
      '--bg-secondary': '#151c17',
      '--bg-tertiary': '#1c2620',
      '--bg-elevated': '#243028',
      '--bg-input': '#0f1410',
      '--accent': '#3ba55d',
      '--accent-hover': '#2d8a4a',
    },
  },
  sunset: {
    name: 'Sunset',
    vars: {
      '--bg-primary': '#1a1210',
      '--bg-secondary': '#221816',
      '--bg-tertiary': '#2c1f1c',
      '--bg-elevated': '#362824',
      '--bg-input': '#1a1210',
      '--accent': '#e85d4c',
      '--accent-hover': '#c94a3b',
    },
  },
  ocean: {
    name: 'Ocean',
    vars: {
      '--bg-primary': '#0a1018',
      '--bg-secondary': '#0f1824',
      '--bg-tertiary': '#152030',
      '--bg-elevated': '#1a2840',
      '--bg-input': '#0a1018',
      '--accent': '#3b9ed4',
      '--accent-hover': '#2d85b8',
    },
  },
  light: {
    name: 'Light',
    vars: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f2f3f5',
      '--bg-tertiary': '#e3e5e8',
      '--bg-elevated': '#d4d7dc',
      '--bg-input': '#ffffff',
      '--bg-hover': 'rgba(0, 0, 0, 0.04)',
      '--bg-active': 'rgba(0, 0, 0, 0.08)',
      '--text-primary': '#060607',
      '--text-secondary': '#4e5058',
      '--text-muted': '#80848e',
      '--border': 'rgba(0, 0, 0, 0.1)',
      '--accent': '#5865f2',
      '--accent-hover': '#4752c4',
    },
  },
  neon: {
    name: 'Neon',
    vars: {
      '--bg-primary': '#0a0a12',
      '--bg-secondary': '#10101c',
      '--bg-tertiary': '#161628',
      '--bg-elevated': '#1e1e36',
      '--bg-input': '#0a0a12',
      '--accent': '#ff2d95',
      '--accent-hover': '#e02580',
      '--text-link': '#00f0ff',
    },
  },
};

export const FONTS = [
  { id: 'inter', name: 'Inter', value: "'Inter', system-ui, sans-serif" },
  { id: 'outfit', name: 'Outfit', value: "'Outfit', system-ui, sans-serif" },
  { id: 'mono', name: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { id: 'system', name: 'System', value: "system-ui, -apple-system, sans-serif" },
];

export const DENSITY = {
  compact: { '--message-spacing': '0.25rem', '--font-size': '14px' },
  comfortable: { '--message-spacing': '1rem', '--font-size': '15px' },
  cozy: { '--message-spacing': '1.5rem', '--font-size': '16px' },
};

export const DEFAULT_SETTINGS = {
  theme: 'midnight',
  font: 'inter',
  density: 'comfortable',
  sidebarWidth: 240,
  showAvatars: true,
  showTimestamps: true,
  animateMessages: true,
  customAccent: null,
  customVars: {},
};

export function applySettings(settings) {
  const root = document.documentElement;
  const theme = THEMES[settings.theme] || THEMES.midnight;
  const font = FONTS.find(f => f.id === settings.font) || FONTS[0];
  const density = DENSITY[settings.density] || DENSITY.comfortable;

  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  Object.entries(density).forEach(([k, v]) => root.style.setProperty(k, v));
  root.style.setProperty('--font-family', font.value);
  root.style.setProperty('--sidebar-width', `${settings.sidebarWidth || 240}px`);

  if (settings.customAccent) {
    root.style.setProperty('--accent', settings.customAccent);
  }
  if (settings.customVars) {
    Object.entries(settings.customVars).forEach(([k, v]) => root.style.setProperty(k, v));
  }
}
