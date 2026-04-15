import { StyleSheet } from 'react-native';

export const colors = {
  background: '#0A0A0F',
  surface: '#15151E',
  surfaceLight: '#1E1E2D',
  primary: '#FF6B35',
  secondary: '#00D9A7',
  accent: '#5E6AD2',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: '#27272A',
  borderLight: '#3F3F46',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = StyleSheet.create({
  h1: { fontSize: 36, fontWeight: '700', color: colors.textPrimary },
  h2: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  h3: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  h4: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400', color: colors.textPrimary },
  bodySmall: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
