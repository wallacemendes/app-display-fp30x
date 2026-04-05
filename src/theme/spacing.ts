/**
 * Spacing constants for consistent layout grid — T027
 *
 * Based on an 8pt grid system with 4pt for fine adjustments.
 * Optimized for landscape-only layout (Constitution v2.0.1, Principle III).
 */

export const spacing = {
  /** 2px — hairline borders */
  xxs: 2,
  /** 4px — tight spacing */
  xs: 4,
  /** 8px — compact spacing */
  sm: 8,
  /** 12px — form element internal padding */
  md: 12,
  /** 16px — standard padding */
  lg: 16,
  /** 20px — section gaps */
  xl: 20,
  /** 24px — large section gaps */
  xxl: 24,
  /** 32px — layout sections */
  xxxl: 32,
  /** 48px — major sections */
  huge: 48,
} as const;

export const borderRadius = {
  /** 4px — subtle rounding */
  sm: 4,
  /** 8px — cards */
  md: 8,
  /** 12px — pills, buttons */
  lg: 12,
  /** 16px — modals */
  xl: 16,
  /** 9999px — full round (circles, capsules) */
  full: 9999,
} as const;

/** Hit slop for touch targets (minimum 44x44pt per Apple HIG) */
export const hitSlop = {
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
} as const;

/** Landscape-specific layout helpers */
export const landscape = {
  /** Side padding for landscape content area */
  gutter: 20,
  /** Safe area inset compensation (notch / Dynamic Island) */
  safeAreaPadding: spacing.lg,
} as const;

/** Standard card grid dimensions (landscape-optimized, flexible columns) */
export const grid = {
  /** Gap between grid items */
  gap: spacing.sm,
} as const;
