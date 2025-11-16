import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class', '[data-color-scheme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme colors using CSS variables for dynamic theming
        theme: {
          background: 'var(--theme-background)',
          surface: 'var(--theme-surface)',
          surfaceAlt: 'var(--theme-surfaceAlt)',
          text: 'var(--theme-text)',
          textMuted: 'var(--theme-textMuted)',
          textOnAccent: 'var(--theme-textOnAccent)',
          primary: 'var(--theme-primary)',
          primaryGlow: 'var(--theme-primaryGlow)',
          primaryHover: 'var(--theme-primaryHover)',
          secondary: 'var(--theme-secondary)',
          secondaryHover: 'var(--theme-secondaryHover)',
          border: 'var(--theme-border)',
          borderMuted: 'var(--theme-borderMuted)',
          borderStrong: 'var(--theme-borderStrong)',
          accentRed: 'var(--theme-accentRed)',
          accentBlue: 'var(--theme-accentBlue)',
          accentGreen: 'var(--theme-accentGreen)',
          accentAmber: 'var(--theme-accentAmber)',
          accentViolet: 'var(--theme-accentViolet)',
          accentPink: 'var(--theme-accentPink)',
          accentCyan: 'var(--theme-accentCyan)',
          accentOrange: 'var(--theme-accentOrange)',
          accentTeal: 'var(--theme-accentTeal)',
          accentIndigo: 'var(--theme-accentIndigo)',
        },
      },
      backgroundColor: {
        theme: {
          background: 'var(--theme-background)',
          surface: 'var(--theme-surface)',
          surfaceAlt: 'var(--theme-surfaceAlt)',
          overlay: 'var(--theme-overlay)',
          canvas: 'var(--theme-canvas)',
          plotBackground: 'var(--theme-plotBackground)',
        },
      },
      textColor: {
        theme: {
          text: 'var(--theme-text)',
          textMuted: 'var(--theme-textMuted)',
          textOnAccent: 'var(--theme-textOnAccent)',
        },
      },
      borderColor: {
        theme: {
          border: 'var(--theme-border)',
          borderMuted: 'var(--theme-borderMuted)',
          borderStrong: 'var(--theme-borderStrong)',
        },
      },
      boxShadow: {
        'theme-glow': '0 0 20px 4px var(--theme-primaryGlow)',
        'theme-glow-sm': '0 0 14px 2px var(--theme-primaryGlow)',
        'theme-glow-md': '0 0 18px var(--theme-primaryGlow)',
      },
      backgroundImage: {
        'theme-gradient-primary': 'linear-gradient(135deg, var(--theme-gradientPrimaryStart), var(--theme-gradientPrimaryEnd))',
        'theme-gradient-hover': 'linear-gradient(135deg, var(--theme-gradientHoverStart), var(--theme-gradientHoverEnd))',
      },
    },
  },
  plugins: [],
} satisfies Config
