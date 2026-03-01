import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { Spacing, FontSize, FontFamily, Radius } from '../constants/theme';
import { formatCurrency } from '../utils/format';

interface DonutChartProps {
    data: Array<{
        value: number;
        color: string;
        label: string;
        emoji: string;
    }>;
    total: number;
    size?: number;
    strokeWidth?: number;
}

export default function DonutChart({ data, total, size = 180, strokeWidth = 28 }: DonutChartProps) {
    const { colors } = useTheme();
    const [showAll, setShowAll] = useState(false);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    let cumulativePercent = 0;

    const visibleData = data.length > 6 && !showAll ? data.slice(0, 6) : data;
    const hasMore = data.length > 6;

    return (
        <View style={styles.container}>
            <View style={styles.chartWrapper}>
                <Svg width={size} height={size}>
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={colors.border}
                        strokeWidth={strokeWidth}
                    />
                    <G rotation="-90" origin={`${center}, ${center}`}>
                        {data.map((item, index) => {
                            const percent = total > 0 ? item.value / total : 0;
                            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
                            const strokeDashoffset = -circumference * cumulativePercent;
                            cumulativePercent += percent;

                            return (
                                <Circle
                                    key={index}
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="none"
                                    stroke={item.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    </G>
                </Svg>
                <View style={[styles.centerLabel, { top: center - 24, left: 0, right: 0 }]}>
                    <Text style={[styles.centerTotal, { color: colors.text }]}>{formatCurrency(total)}</Text>
                    <Text style={[styles.centerSubtitle, { color: colors.textSecondary }]}>Total</Text>
                </View>
            </View>

            <View style={styles.legend}>
                {visibleData.map((item, index) => {
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                        <View key={index} style={styles.legendItem}>
                            <Text style={styles.legendEmoji}>{item.emoji}</Text>
                            <View style={styles.legendText}>
                                <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                                    {item.label}
                                </Text>
                                <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                                    {pct}%
                                </Text>
                            </View>
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        </View>
                    );
                })}
            </View>
            {hasMore && (
                <TouchableOpacity
                    onPress={() => setShowAll(!showAll)}
                    style={[styles.showAllButton, { backgroundColor: colors.primary + '12' }]}
                >
                    <Text style={[styles.showAllText, { color: colors.primary }]}>
                        {showAll ? 'Show Less' : `Show All (${data.length})`}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    chartWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerLabel: {
        position: 'absolute',
        alignItems: 'center',
    },
    centerTotal: {
        fontSize: FontSize.xl,
        fontFamily: FontFamily.extraBold,
        fontWeight: '800',
    },
    centerSubtitle: {
        fontSize: FontSize.xs,
        fontFamily: FontFamily.medium,
        marginTop: 2,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: Spacing.lg,
        gap: Spacing.sm,
        paddingHorizontal: Spacing.sm,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        gap: 4,
        minWidth: '28%',
    },
    legendEmoji: {
        fontSize: 14,
    },
    legendText: {
        flex: 1,
    },
    legendLabel: {
        fontSize: FontSize.xs,
        fontFamily: FontFamily.medium,
    },
    legendValue: {
        fontSize: 10,
        fontFamily: FontFamily.regular,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    showAllButton: {
        alignSelf: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.md,
        marginTop: Spacing.xs,
    },
    showAllText: {
        fontSize: FontSize.xs,
        fontFamily: FontFamily.semiBold,
        fontWeight: '600',
    },
});
