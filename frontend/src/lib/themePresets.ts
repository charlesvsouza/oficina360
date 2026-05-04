export type ThemePresetId = 'lexgen-blue' | 'sunset-orange' | 'emerald-pro';

type ThemePreset = {
  id: ThemePresetId;
  label: string;
  description: string;
  vars: Record<string, string>;
};

const STORAGE_KEY = 'sigmaauto-theme-preset';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'lexgen-blue',
    label: 'LexGen Blue',
    description: 'Tema corporativo azul com contraste de operacao.',
    vars: {
      '--sidebar-bg': '#0f172a',
      '--sidebar-active': '#1e293b',
      '--sidebar-border': '#1e293b',
      '--sidebar-accent': '#3b82f6',
      '--surface-bg': '#f8fafc',
      '--surface-border': '#e2e8f0',
      '--header-bg': '#ffffff',
      '--theme-glow-rgb': '59, 130, 246',
      '--frame-accent': '#3b82f6',
      '--accent': '#3b82f6',
      '--accent-hover': '#2563eb',
    },
  },
  {
    id: 'sunset-orange',
    label: 'Sunset Orange',
    description: 'Visual comercial com energia para vendas e atendimento.',
    vars: {
      '--sidebar-bg': '#1a1625',
      '--sidebar-active': '#2a2038',
      '--sidebar-border': '#3b2a4d',
      '--sidebar-accent': '#f97316',
      '--surface-bg': '#fffaf5',
      '--surface-border': '#fde7d7',
      '--header-bg': '#ffffff',
      '--theme-glow-rgb': '249, 115, 22',
      '--frame-accent': '#f97316',
      '--accent': '#f97316',
      '--accent-hover': '#ea580c',
    },
  },
  {
    id: 'emerald-pro',
    label: 'Emerald Pro',
    description: 'Tema premium com foco em produtividade e leitura.',
    vars: {
      '--sidebar-bg': '#052e2b',
      '--sidebar-active': '#0f403b',
      '--sidebar-border': '#115e59',
      '--sidebar-accent': '#10b981',
      '--surface-bg': '#f7fffc',
      '--surface-border': '#d1fae5',
      '--header-bg': '#ffffff',
      '--theme-glow-rgb': '16, 185, 129',
      '--frame-accent': '#10b981',
      '--accent': '#10b981',
      '--accent-hover': '#059669',
    },
  },
];

function setCssVars(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function applyThemePreset(presetId: ThemePresetId) {
  const preset = THEME_PRESETS.find((item) => item.id === presetId) || THEME_PRESETS[0];
  setCssVars(preset.vars);
  localStorage.setItem(STORAGE_KEY, preset.id);
}

export function getStoredThemePreset(): ThemePresetId {
  const value = localStorage.getItem(STORAGE_KEY) as ThemePresetId | null;
  return THEME_PRESETS.some((preset) => preset.id === value) ? (value as ThemePresetId) : 'lexgen-blue';
}

export function initializeThemePreset() {
  applyThemePreset(getStoredThemePreset());
}
