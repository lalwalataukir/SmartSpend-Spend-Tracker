import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FontFamily } from '../constants/theme';

const TAB_CONFIG: Record<string, {
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
    label: string;
}> = {
    index: { activeIcon: 'home', inactiveIcon: 'home-outline', label: 'Home' },
    history: { activeIcon: 'time', inactiveIcon: 'time-outline', label: 'History' },
    insights: { activeIcon: 'bar-chart', inactiveIcon: 'bar-chart-outline', label: 'Insights' },
    settings: { activeIcon: 'settings', inactiveIcon: 'settings-outline', label: 'Settings' },
};

export default function CustomTabBar({ state, descriptors, navigation }: any) {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: 'transparent', paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={[
                styles.tabBar,
                {
                    backgroundColor: isDark ? '#1C1C1E' : colors.surfaceHighlight,
                    borderColor: isDark ? '#3A3A3C' : colors.border,
                    borderWidth: isDark ? 1 : 0,
                    // Android shadow
                    elevation: 12,
                    // iOS shadow
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: isDark ? 0.4 : 0.12,
                    shadowRadius: 12,
                },
            ]}>
                {state.routes.map((route: any, index: number) => {
                    const isFocused = state.index === index;
                    const config = TAB_CONFIG[route.name] || { activeIcon: 'help', inactiveIcon: 'help-outline', label: route.name };

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.iconWrapper,
                                isFocused && {
                                    backgroundColor: colors.primary + '20',
                                },
                            ]}>
                                <Ionicons
                                    name={isFocused ? config.activeIcon : config.inactiveIcon}
                                    size={22}
                                    color={isFocused ? colors.primary : colors.textSecondary}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.label,
                                    {
                                        color: isFocused ? colors.primary : colors.textSecondary,
                                        fontFamily: isFocused ? FontFamily.semiBold : FontFamily.medium,
                                    },
                                ]}
                            >
                                {config.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 6,
    },
    tabBar: {
        flexDirection: 'row',
        borderRadius: 28,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
    },
    iconWrapper: {
        width: 48,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    label: {
        fontSize: 11,
        fontWeight: '500',
    },
});
