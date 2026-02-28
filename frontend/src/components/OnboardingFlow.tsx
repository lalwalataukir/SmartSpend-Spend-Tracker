import React, { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Spacing, FontSize, Radius, FontFamily } from '../constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingProps {
    onComplete: () => void;
}

interface Slide {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    bgColors: [string, string];
    title: string;
    subtitle: string;
}

const slides: Slide[] = [
    {
        id: '1',
        icon: 'wallet',
        iconColor: '#4F46E5',
        bgColors: ['#EEF2FF', '#E0E7FF'],
        title: 'Track Every Spend',
        subtitle: 'Log expenses in under 10 seconds with our quick-add numpad. No clutter, no distractions.',
    },
    {
        id: '2',
        icon: 'bar-chart',
        iconColor: '#7C3AED',
        bgColors: ['#F5F3FF', '#EDE9FE'],
        title: 'Visualize Your Habits',
        subtitle: 'See where your money goes with beautiful charts, daily breakdowns, and category insights.',
    },
    {
        id: '3',
        icon: 'shield-checkmark',
        iconColor: '#059669',
        bgColors: ['#ECFDF5', '#D1FAE5'],
        title: 'Stay on Budget',
        subtitle: 'Set budgets per category and get smart nudges when you\'re overspending. All data stays on your device.',
    },
];

export default function OnboardingFlow({ onComplete }: OnboardingProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const goToNext = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < slides.length - 1) {
            const nextIndex = currentIndex + 1;
            flatListRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
            setCurrentIndex(nextIndex);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onComplete();
    };

    const renderSlide = ({ item }: { item: Slide }) => (
        <View style={styles.slide}>
            <View style={[styles.iconArea, { backgroundColor: item.bgColors[0] }]}>
                <View style={[styles.iconRingOuter, { backgroundColor: item.bgColors[1] }]}>
                    <View style={[styles.iconRingInner, { backgroundColor: item.iconColor + '20' }]}>
                        <Ionicons name={item.icon} size={48} color={item.iconColor} />
                    </View>
                </View>
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>
    );

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View />
                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            />

            <View style={styles.footer}>
                <View style={styles.dots}>
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                i === currentIndex
                                    ? { backgroundColor: '#4F46E5', width: 24 }
                                    : { backgroundColor: '#D1D5DB', width: 8 },
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity onPress={goToNext} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#4F46E5', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextBtn}
                    >
                        {currentIndex === slides.length - 1 ? (
                            <Text style={styles.nextBtnText}>Get Started</Text>
                        ) : (
                            <>
                                <Text style={styles.nextBtnText}>Next</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: Spacing.md,
    },
    skipBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    skipText: {
        fontSize: FontSize.base,
        fontFamily: FontFamily.medium,
        color: '#6B7280',
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    iconArea: {
        width: 200,
        height: 200,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xxxl,
    },
    iconRingOuter: {
        width: 150,
        height: 150,
        borderRadius: 75,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconRingInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slideTitle: {
        fontSize: FontSize.xxl + 4,
        fontFamily: FontFamily.extraBold,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    slideSubtitle: {
        fontSize: FontSize.base,
        fontFamily: FontFamily.regular,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: Spacing.lg,
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 50 : 30,
        alignItems: 'center',
        gap: Spacing.xl,
    },
    dots: {
        flexDirection: 'row',
        gap: Spacing.sm,
        alignItems: 'center',
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxxl,
        paddingVertical: Spacing.md + 4,
        borderRadius: Radius.full,
        gap: Spacing.sm,
        minWidth: 180,
    },
    nextBtnText: {
        color: '#FFF',
        fontSize: FontSize.lg,
        fontFamily: FontFamily.bold,
        fontWeight: '700',
    },
});
