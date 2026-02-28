import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { initializeDatabase } from '../src/db/database';
import OnboardingFlow from '../src/components/OnboardingFlow';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

const ONBOARDING_KEY = '@smartspend_onboarding_complete';

function InnerLayout() {
  const { isDark, colors } = useTheme();
  const [dbReady, setDbReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      setDbReady(true);
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setShowOnboarding(value !== 'true');
      } catch {
        setShowOnboarding(false);
      }
    };
    init();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="manage-categories" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="manage-budgets" options={{ presentation: 'card', headerShown: false }} />
      </Stack>

      {/* Loading overlay */}
      {(!dbReady || showOnboarding === null) && (
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Onboarding overlay — shown on first launch */}
      {showOnboarding && dbReady && (
        <View style={styles.overlay}>
          <OnboardingFlow
            onComplete={async () => {
              await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
              setShowOnboarding(false);
            }}
          />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
});
