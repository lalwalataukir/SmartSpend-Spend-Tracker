import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { Spacing, FontSize, Radius, FontFamily } from '../constants/theme';

interface CustomNumpadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

function NumpadKey({ keyVal, onPress, colors }: { keyVal: string; onPress: (key: string) => void; colors: any }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  }, []);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(keyVal);
  }, [keyVal, onPress]);

  return (
    <Animated.View style={[styles.keyAnimWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        testID={`numpad-key-${keyVal}`}
        accessibilityRole="button"
        accessibilityLabel={keyVal === 'backspace' ? 'Delete' : keyVal}
        style={[styles.key, { backgroundColor: colors.numpadKey }]}
        activeOpacity={0.6}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        {keyVal === 'backspace' ? (
          <Ionicons name="backspace-outline" size={28} color={colors.text} />
        ) : (
          <Text style={[styles.keyText, { color: colors.text }]}>{keyVal}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CustomNumpad({ onKeyPress, onBackspace }: CustomNumpadProps) {
  const { colors } = useTheme();

  const handlePress = useCallback((key: string) => {
    if (key === 'backspace') onBackspace();
    else onKeyPress(key);
  }, [onKeyPress, onBackspace]);

  return (
    <View style={[styles.container, { backgroundColor: colors.numpadBg }]}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <NumpadKey key={key} keyVal={key} onPress={handlePress} colors={colors} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 3,
  },
  keyAnimWrapper: {
    width: '31%',
  },
  key: {
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600',
  },
});
