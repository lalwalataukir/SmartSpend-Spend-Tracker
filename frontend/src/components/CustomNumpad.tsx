import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Spacing, FontSize, Radius } from '../constants/theme';

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

export default function CustomNumpad({ onKeyPress, onBackspace }: CustomNumpadProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.numpadBg }]}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              testID={`numpad-key-${key}`}
              accessibilityRole="button"
              accessibilityLabel={key === 'backspace' ? 'Delete' : key}
              style={[styles.key, { backgroundColor: colors.numpadKey }]}
              activeOpacity={0.6}
              onPress={() => {
                if (key === 'backspace') onBackspace();
                else onKeyPress(key);
              }}
            >
              {key === 'backspace' ? (
                <Ionicons name="backspace-outline" size={28} color={colors.text} />
              ) : (
                <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
              )}
            </TouchableOpacity>
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
  key: {
    width: '31%',
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: FontSize.xxl,
    fontWeight: '600',
  },
});
