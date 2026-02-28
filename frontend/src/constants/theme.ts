export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
};

export const Colors = {
  light: {
    primary: '#4F46E5',
    primaryLight: '#818CF8',
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
    info: '#818CF8',
    numpadBg: '#F9FAFB',
    numpadKey: '#FFFFFF',
    shimmer: '#E5E7EB',
    gradientStart: '#4F46E5',
    gradientEnd: '#7C3AED',
  },
  dark: {
    primary: '#818CF8',
    primaryLight: '#A5B4FC',
    primaryForeground: '#FFFFFF',
    background: '#0F0F0F',
    surface: '#1C1C1E',
    surfaceHighlight: '#2A2A2E',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#3A3A3C',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    info: '#A5B4FC',
    numpadBg: '#1A1A1A',
    numpadKey: '#2A2A2E',
    shimmer: '#3A3A3C',
    gradientStart: '#4338CA',
    gradientEnd: '#6D28D9',
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

import { Platform } from 'react-native';

export const Shadows = {
  sm: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  }) as any,
  md: Platform.select({
    web: { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  }) as any,
  lg: Platform.select({
    web: { boxShadow: '0 10px 12px rgba(0,0,0,0.15)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  }) as any,
};

export type ThemeColors = typeof Colors.light;
