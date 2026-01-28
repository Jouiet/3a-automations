/**
 * 3A Automation Design System
 * Futuristic, sober, powerful
 *
 * Palette: Dark mode primary, neon accents (cyan, magenta)
 * Typo: Inter/Geist Mono
 * Components: Glassmorphism, subtle gradients, glow borders
 */

// Color tokens
export const colors = {
  // Primary palette
  primary: {
    50: "#e6f7ff",
    100: "#b3e6ff",
    200: "#80d4ff",
    300: "#4dc3ff",
    400: "#1ab2ff",
    500: "#00a1e6", // Main primary
    600: "#0081b8",
    700: "#00618a",
    800: "#00415c",
    900: "#00202e",
  },

  // Neon accents
  neon: {
    cyan: "#00FFFF",
    cyanMuted: "rgba(0, 255, 255, 0.15)",
    magenta: "#FF00FF",
    magentaMuted: "rgba(255, 0, 255, 0.15)",
    green: "#00FF88",
    greenMuted: "rgba(0, 255, 136, 0.15)",
  },

  // Dark backgrounds
  dark: {
    900: "#0a0e1a",
    800: "#0f1424",
    700: "#141a2e",
    600: "#1a2138",
    500: "#202842",
    400: "#2a324f",
    300: "#3a4466",
  },

  // Semantic colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
} as const;

// Glassmorphism styles
export const glass = {
  light: {
    background: "rgba(255, 255, 255, 0.05)",
    blur: "backdrop-blur-md",
    border: "border border-white/10",
  },
  medium: {
    background: "rgba(255, 255, 255, 0.08)",
    blur: "backdrop-blur-lg",
    border: "border border-white/15",
  },
  heavy: {
    background: "rgba(255, 255, 255, 0.12)",
    blur: "backdrop-blur-xl",
    border: "border border-white/20",
  },
} as const;

// Glow effects
export const glow = {
  cyan: "shadow-[0_0_20px_rgba(0,255,255,0.15)]",
  cyanStrong: "shadow-[0_0_40px_rgba(0,255,255,0.25)]",
  magenta: "shadow-[0_0_20px_rgba(255,0,255,0.15)]",
  magentaStrong: "shadow-[0_0_40px_rgba(255,0,255,0.25)]",
  primary: "shadow-[0_0_20px_rgba(79,186,241,0.2)]",
  primaryStrong: "shadow-[0_0_40px_rgba(79,186,241,0.3)]",
  success: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
  error: "shadow-[0_0_20px_rgba(239,68,68,0.2)]",
} as const;

// Animation timing
export const timing = {
  fast: 150,
  normal: 200,
  slow: 300,
  verySlow: 500,
} as const;

// Easing functions
export const easing = {
  smooth: [0.4, 0, 0.2, 1],
  bouncy: [0.68, -0.55, 0.265, 1.55],
  snappy: [0.25, 0.1, 0.25, 1],
} as const;

// Typography scale
export const typography = {
  sizes: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Spacing scale
export const spacing = {
  px: "1px",
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

// Border radius
export const radius = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

// Component presets
export const presets = {
  card: {
    base: "rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm",
    glass: "rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-700/50",
    glassHover: "hover:border-slate-600/50 transition-all duration-300",
  },
  button: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    glow: "shadow-[0_0_20px_rgba(79,186,241,0.3)] hover:shadow-[0_0_30px_rgba(79,186,241,0.5)]",
  },
  input: {
    base: "bg-muted/50 border-border/50 focus:border-primary/50 focus:ring-primary/20",
    glass: "bg-slate-800/50 backdrop-blur-sm border-slate-700/50",
  },
} as const;

// Export all as theme object
export const theme = {
  colors,
  glass,
  glow,
  timing,
  easing,
  typography,
  spacing,
  radius,
  presets,
} as const;

export default theme;
