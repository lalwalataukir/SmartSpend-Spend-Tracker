export const Colors = {
  light: {
    primary: '#1A56DB',
    primaryLight: '#3B82F6',
    primaryForeground: '#FFFFFF',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    surfaceHighlight: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    numpadBg: '#F9FAFB',
    numpadKey: '#FFFFFF',
    shimmer: '#E5E7EB',
  },
  dark: {
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryForeground: '#FFFFFF',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceHighlight: '#2C2C2C',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    numpadBg: '#1A1A1A',
    numpadKey: '#2C2C2C',
    shimmer: '#374151',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 48,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  } as any,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  } as any,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  } as any,
};

export type ThemeColors = typeof Colors.light;
