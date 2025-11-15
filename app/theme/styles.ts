import { themeVar } from './themeVars';

const surfacePanel = {
  background: themeVar('surface'),
  color: themeVar('text'),
  borderColor: themeVar('border'),
} as const;

const surfaceAltPanel = {
  background: themeVar('surfaceAlt'),
  color: themeVar('text'),
  borderColor: themeVar('border'),
} as const;

const surfaceAltFill = {
  background: themeVar('surfaceAlt'),
  color: themeVar('text'),
} as const;

const textPrimary = {
  color: themeVar('text'),
} as const;

const textMuted = {
  color: themeVar('textMuted'),
} as const;

const accentRedText = {
  color: themeVar('accentRed'),
} as const;

const gradientPrimary = `linear-gradient(135deg, ${themeVar('gradientPrimaryStart')}, ${themeVar('gradientPrimaryEnd')})`;

const checkboxBase = {
  accentColor: themeVar('primary'),
  borderColor: themeVar('border'),
  background: themeVar('surface'),
} as const;

export const sharedStyles = {
  surfacePanel,
  surfaceAltPanel,
  surfaceAltFill,
  textPrimary,
  textMuted,
  accentRedText,
  gradientPrimary,
  checkboxBase,
} as const;

export const pageStyles = {
  layout: {
    background: themeVar('background'),
    color: themeVar('text'),
  },
  header: surfacePanel,
  subtitle: textMuted,
  tabGroup: surfaceAltPanel,
  modeLabel: textMuted,
  modeValue: {
    ...textPrimary,
    fontWeight: 600,
  },
  titleGradient: {
    backgroundImage: gradientPrimary,
  },
  sidebarToggle: {
    borderColor: themeVar('border'),
    background: themeVar('surfaceAlt'),
    color: themeVar('text'),
  },
  footer: {
    ...surfacePanel,
    color: themeVar('textMuted'),
  },
} as const;

const activeTab = {
  background: themeVar('surface'),
  color: themeVar('text'),
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
} as const;

const inactiveTab = {
  color: themeVar('textMuted'),
} as const;

export const getTabButtonStyle = (isActive: boolean) => (isActive ? activeTab : inactiveTab);

export const calculatorStyles = {
  panel: surfacePanel,
  heading: textPrimary,
  muted: textMuted,
  input: surfaceAltPanel,
  preview: {
    ...surfaceAltPanel,
    borderColor: themeVar('borderMuted'),
  },
  modeButton: {
    active: {
      background: themeVar('primary'),
      color: themeVar('textOnAccent'),
      boxShadow: `0 0 18px ${themeVar('primaryGlow', 'rgba(99, 102, 241, 0.35)')}`,
    },
    inactive: {
      ...surfaceAltFill,
    },
  },
  clearButton: accentRedText,
  errorBox: {
    background: themeVar('overlay'),
    borderColor: themeVar('accentRed'),
    color: themeVar('accentRed'),
  },
  errorText: accentRedText,
  actionButton: {
    background: themeVar('accentGreen'),
    color: themeVar('textOnAccent'),
  },
  resultHeader: surfacePanel,
  resultCard: surfaceAltPanel,
  resultMuted: textMuted,
  exampleBadge: {
    ...surfaceAltFill,
  },
  checkbox: checkboxBase,
} as const;

export const equationInputStyles = {
  panel: surfacePanel,
  heading: textPrimary,
  input: surfaceAltPanel,
  helper: textMuted,
  exampleChip: {
    ...surfaceAltFill,
    borderColor: themeVar('borderMuted'),
  },
  preview: surfaceAltPanel,
  modeButton: {
    active: {
      background: themeVar('primary'),
      color: themeVar('textOnAccent'),
    },
    inactive: {
      ...surfaceAltFill,
      color: themeVar('textMuted'),
    },
  },
  addButton: {
    background: gradientPrimary,
    color: themeVar('textOnAccent'),
    border: 'none',
  },
  emptyState: textMuted,
  equationCard: surfaceAltPanel,
  toggleIcon: {
    color: themeVar('textOnAccent'),
  },
  removeButton: accentRedText,
  errorText: accentRedText,
} as const;

export const graph2DStyles = {
  container: {
    backgroundColor: themeVar('surface'),
    borderColor: themeVar('border'),
    color: themeVar('text'),
  },
  emptyState: textMuted,
  overlayCard: {
    background: themeVar('surfaceAlt'),
    color: themeVar('text'),
    borderColor: themeVar('border'),
  },
} as const;

export const graph3DStyles = {
  container: surfacePanel,
  emptyState: textMuted,
  overlayCard: {
    background: themeVar('surfaceAlt'),
    color: themeVar('text'),
    borderColor: themeVar('border'),
  },
} as const;

export const settingsStyles = {
  panel: surfacePanel,
  heading: textPrimary,
  label: textMuted,
  input: surfaceAltPanel,
  button: {
    active: {
      background: themeVar('primary'),
      color: themeVar('textOnAccent'),
    },
    inactive: {
      ...surfaceAltFill,
    },
  },
  checkbox: checkboxBase,
} as const;
