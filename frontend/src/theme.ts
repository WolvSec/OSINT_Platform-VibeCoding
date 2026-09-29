import { createTheme, alpha } from '@mui/material/styles';

/**
 * Design tokens — "maize & blue mission control" (University of Michigan / WolvSec).
 *
 * Michigan navy (#00274C), deepened for a dark UI, is the base; maize (#FFCB05) is the one brand
 * accent (identity, selection, focus). Live/system state uses a cold signal cyan: the data on
 * the globe is warm (wildfire orange #ff6d00, and maize itself), so a hot red-orange "live" dot
 * would read as just another marker, while cyan is unambiguous against both. Red is reserved for
 * the offline/error state only.
 *
 * Every text colour clears 4.5:1 on `bgPanel` (textMuted is the floor at ~4.7:1).
 * These values are mirrored as CSS custom properties (`--wv-*`) by the theme's CssBaseline.
 */
export const hud = {
  navy: '#00274c',
  bgBase: '#050d1a',
  bgPanel: '#0b1a2e',
  accent: '#ffcb05', // maize
  accentSoft: 'rgba(255, 203, 5, 0.12)',
  onAccent: '#00274c',
  signal: '#36d7ff', // live / system cyan
  signalSoft: 'rgba(54, 215, 255, 0.12)',
  warning: '#ffcb05',
  danger: '#ff5a6e',
  textPrimary: '#eef3fa',
  textSecondary: '#a3b5cc',
  textMuted: '#7890ad',
  surface: 'rgba(6, 17, 32, 0.84)',
  surfaceSolid: '#0b1a2e',
  surfaceRaised: 'rgba(163, 181, 204, 0.05)',
  surfaceHover: 'rgba(163, 181, 204, 0.08)',
  hairline: 'rgba(163, 181, 204, 0.12)',
  hairlineStrong: 'rgba(163, 181, 204, 0.22)',
  radius: 4,
  gutter: 16,
  shadow: '0 18px 40px rgba(0, 6, 16, 0.55), 0 2px 6px rgba(0, 6, 16, 0.4)',
  blur: 'blur(16px) saturate(130%)',
  fontDisplay: '"Russo One", "Archivo", system-ui, sans-serif',
  fontSans: '"Archivo", system-ui, -apple-system, "Segoe UI", sans-serif',
  fontMono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
  weightLight: 300,
  weightBlack: 800,
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
} as const;

/** Faint 24px blueprint grid + fractal-noise grain, layered under a panel's navy gradient. */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")";
export const panelTexture = [
  NOISE,
  'linear-gradient(rgba(163, 181, 204, 0.035) 1px, transparent 1px)',
  'linear-gradient(90deg, rgba(163, 181, 204, 0.035) 1px, transparent 1px)',
  'linear-gradient(180deg, rgba(0, 39, 76, 0.5) 0%, rgba(0, 39, 76, 0) 60%)'
].join(', ');

/** Shared `sx` for a floating glass panel: navy glass, blueprint grid, a maize corner tick. */
export const glassSurface = {
  position: 'relative',
  bgcolor: hud.surface,
  backgroundImage: panelTexture,
  backgroundSize: '160px 160px, 24px 24px, 24px 24px, 100% 100%',
  backdropFilter: hud.blur,
  WebkitBackdropFilter: hud.blur,
  border: `1px solid ${hud.hairline}`,
  borderRadius: `${hud.radius}px`,
  boxShadow: hud.shadow,
  color: hud.textPrimary,
  // Maize corner bracket: the one decorative flourish, marks every panel as part of one system.
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -1,
    left: -1,
    width: 18,
    height: 18,
    borderTop: `2px solid ${hud.accent}`,
    borderLeft: `2px solid ${hud.accent}`,
    borderTopLeftRadius: `${hud.radius}px`,
    pointerEvents: 'none',
    zIndex: 1
  }
} as const;

/** Small uppercase eyebrow label (section headers, stat labels): heavy sans, wide tracking. */
export const eyebrow = {
  fontFamily: hud.fontSans,
  fontSize: '0.625rem',
  fontWeight: hud.weightBlack,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: hud.textSecondary,
  lineHeight: 1.2
} as const;

/** Display type (brand, panel titles): Russo One, tight, uppercase. */
export const displayTitle = {
  fontFamily: hud.fontDisplay,
  fontWeight: 400, // Russo One ships a single, already-black weight
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  lineHeight: 1
} as const;

/** Monospace, tabular numerals: counters, coordinates, ids. */
export const monoValue = {
  fontFamily: hud.fontMono,
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum" 1, "zero" 1'
} as const;

/**
 * Staggered HUD entrance. `step` orders panels in the load sequence (~90ms apart); `from` is the
 * edge the panel slides in from. Reduced motion: no animation, panel simply present.
 */
export function hudEnter(step: number, from: 'top' | 'left' | 'right' | 'bottom' = 'top') {
  const offset = {
    top: 'translate3d(0, -14px, 0)',
    bottom: 'translate3d(0, 18px, 0)',
    left: 'translate3d(-24px, 0, 0)',
    right: 'translate3d(24px, 0, 0)'
  }[from];
  return {
    '--wv-enter-from': offset,
    animation: `wv-hud-enter 700ms ${hud.ease} ${120 + step * 90}ms both`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
  } as const;
}

/** CSS custom properties mirroring `hud`, for plain CSS and devtools inspection. */
const cssTokens = {
  '--wv-navy': hud.navy,
  '--wv-bg': hud.bgBase,
  '--wv-panel': hud.bgPanel,
  '--wv-maize': hud.accent,
  '--wv-signal': hud.signal,
  '--wv-danger': hud.danger,
  '--wv-text': hud.textPrimary,
  '--wv-text-2': hud.textSecondary,
  '--wv-text-3': hud.textMuted,
  '--wv-hairline': hud.hairline,
  '--wv-font-display': hud.fontDisplay,
  '--wv-font-body': hud.fontSans,
  '--wv-font-mono': hud.fontMono,
  '--wv-ease': hud.ease
};

export const tacticalTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: hud.bgBase,
      paper: hud.surfaceSolid
    },
    primary: { main: hud.accent, contrastText: hud.onAccent },
    secondary: { main: hud.signal },
    error: { main: hud.danger },
    warning: { main: hud.warning },
    success: { main: hud.signal },
    info: { main: hud.signal },
    divider: hud.hairline,
    text: {
      primary: hud.textPrimary,
      secondary: hud.textSecondary,
      disabled: hud.textMuted
    }
  },
  shape: { borderRadius: hud.radius },
  typography: {
    fontFamily: hud.fontSans,
    fontSize: 13,
    fontWeightLight: hud.weightLight,
    fontWeightRegular: hud.weightLight,
    fontWeightMedium: 500,
    fontWeightBold: hud.weightBlack,
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.02em' },
    h6: { fontWeight: hud.weightBlack, fontSize: '0.95rem', letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: hud.weightBlack },
    caption: { letterSpacing: 0 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': cssTokens,
        body: {
          backgroundColor: hud.bgBase,
          fontWeight: hud.weightLight,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        },
        '@keyframes wv-hud-enter': {
          from: { opacity: 0, transform: 'var(--wv-enter-from)', filter: 'blur(6px)' },
          to: { opacity: 1, transform: 'none', filter: 'none' }
        },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(163, 181, 204, 0.18)',
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'padding-box'
        },
        '*::-webkit-scrollbar-thumb:hover': { background: alpha(hud.accent, 0.5) },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '::selection': { background: alpha(hud.accent, 0.35), color: hud.textPrimary }
      }
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: `2px solid ${hud.accent}`,
            outlineOffset: 2
          }
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: { fontWeight: 400 },
        input: { '&::placeholder': { color: hud.textMuted, opacity: 1 } }
      }
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 250 },
      styleOverrides: {
        tooltip: {
          backgroundColor: hud.bgPanel,
          color: hud.textPrimary,
          border: `1px solid ${hud.hairlineStrong}`,
          fontFamily: hud.fontMono,
          fontSize: '0.6875rem',
          fontWeight: 400,
          padding: '6px 10px',
          borderRadius: hud.radius,
          boxShadow: hud.shadow
        },
        arrow: { color: hud.bgPanel, '&::before': { border: `1px solid ${hud.hairlineStrong}` } }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(11, 26, 46, 0.94)',
          backdropFilter: hud.blur,
          backgroundImage: 'none',
          border: `1px solid ${hud.hairline}`,
          borderRadius: hud.radius,
          boxShadow: hud.shadow
        },
        list: { padding: 4 }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontSize: '0.8125rem',
          minHeight: 34,
          '&.Mui-selected': { backgroundColor: hud.accentSoft },
          '&.Mui-selected:hover': { backgroundColor: alpha(hud.accent, 0.2) }
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 6 },
        track: { borderRadius: 10, backgroundColor: '#243a57', opacity: 1 },
        thumb: { boxShadow: 'none', backgroundColor: hud.textSecondary },
        switchBase: {
          '&.Mui-checked .MuiSwitch-thumb': { backgroundColor: hud.onAccent },
          '&.Mui-checked + .MuiSwitch-track': {
            opacity: 1,
            backgroundColor: hud.accent
          },
          '&.Mui-focusVisible .MuiSwitch-thumb': {
            outline: `2px solid ${hud.accent}`,
            outlineOffset: 2
          }
        }
      }
    }
  }
});
