import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Spacing, FontSize, Radius, FontFamily } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '12' }]}>
                <View style={[styles.iconInner, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name={icon} size={40} color={colors.primary} />
                </View>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity activeOpacity={0.8} onPress={onAction}>
                    <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionBtn}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.actionText}>{actionLabel}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxxl,
        paddingHorizontal: Spacing.xl,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    iconInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: FontSize.xl,
        fontFamily: FontFamily.bold,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.base,
        fontFamily: FontFamily.regular,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        gap: Spacing.sm,
    },
    actionText: {
        color: '#FFF',
        fontSize: FontSize.base,
        fontFamily: FontFamily.semiBold,
        fontWeight: '600',
    },
});
