/**
 * Spacing constants for consistent layout grid.
 * Based on an 8pt grid system with 4pt for fine adjustments.
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

/** Standard card grid dimensions */
export const grid = {
  /** Number of columns on iPhone */
  columnsPhone: 2,
  /** Number of columns on iPad */
  columnsTablet: 3,
  /** Gap between grid items */
  gap: spacing.sm,
} as const;
