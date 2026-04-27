/**
 * TradeUp Design Tokens
 * Aesthetic Direction: DARK COLLECTOR — oscuro, refinado, galería underground
 */
export const tokens = {
  colors: {
    // Base
    bg:           '#0A0A0F',   // near-black with blue tint
    bgSurface:    '#111118',   // card surfaces
    bgElevated:   '#1A1A26',   // elevated panels
    border:       '#2A2A3E',   // subtle borders
    borderStrong: '#3D3D5C',

    // Primary — cold electric gold
    primary:      '#C9A84C',   // collector's gold
    primaryHover: '#E4C76B',
    primaryMuted: '#C9A84C33',

    // Accent — holographic teal
    accent:       '#00D4AA',
    accentHover:  '#00F0C3',
    accentMuted:  '#00D4AA22',

    // Rarity colors
    rarityCommon:     '#A0A0B0',
    rarityUncommon:   '#4CAF7D',
    rarityRare:       '#4A90E2',
    raritySuperRare:  '#9B59B6',
    rarityUltraRare:  '#E74C3C',
    raritySecretRare: '#C9A84C',
    rarityPromo:      '#00D4AA',

    // Text
    textPrimary:   '#F0EDE8',
    textSecondary: '#8888A8',
    textMuted:     '#555570',
  },
  fonts: {
    display: '"Bebas Neue", cursive',    // dramatic headers
    heading: '"Cormorant Garamond", serif', // editorial subheadings
    body:    '"DM Sans", sans-serif',       // readable body text
    mono:    '"JetBrains Mono", monospace',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
    '2xl': '64px',
    '3xl': '96px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    card: '12px',
  },
  shadows: {
    card: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(201,168,76,0.08)',
    cardHover: '0 20px 60px rgba(0,0,0,0.8), 0 4px 16px rgba(201,168,76,0.2)',
    glow: '0 0 20px rgba(201,168,76,0.3)',
    accentGlow: '0 0 20px rgba(0,212,170,0.3)',
  }
} as const
