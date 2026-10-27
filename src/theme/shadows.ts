import { colors } from './colors';

/**
 * Soft purple shadows v3 (redesign-v3.md §5)
 */
export const shadows = {
  e0: {},
  e1: {
    shadowColor: colors.action,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  e2: {
    shadowColor: colors.action,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
