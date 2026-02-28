import React from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { initializeDatabase } from '../src/db/database';

function InnerLayout() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="manage-categories" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="manage-budgets" options={{ presentation: 'card', headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="spendsmart.db" onInit={initializeDatabase}>
      <ThemeProvider>
        <InnerLayout />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
