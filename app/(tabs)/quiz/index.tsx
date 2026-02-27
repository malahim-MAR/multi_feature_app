import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet, Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';

const categories = [
    { key: 'general', label: 'General Knowledge', icon: 'bulb-outline' },
    { key: 'science', label: 'Science', icon: 'flask-outline' },
    { key: 'history', label: 'History', icon: 'time-outline' },
    { key: 'geography', label: 'Geography', icon: 'globe-outline' },
    { key: 'technology', label: 'Technology / AI', icon: 'hardware-chip-outline' },
    { key: 'religion', label: 'Islam / Religion', icon: 'moon-outline' },
    { key: 'sports', label: 'Sports', icon: 'football-outline' },
    { key: 'math', label: 'Math', icon: 'calculator-outline' },
    { key: 'english', label: 'English / Grammar', icon: 'text-outline' },
];

const difficulties = [
    { key: 'easy', label: 'Easy', color: Colors.easy, emoji: '🟢' },
    { key: 'medium', label: 'Medium', color: Colors.medium, emoji: '🟡' },
    { key: 'hard', label: 'Hard', color: Colors.hard, emoji: '🔴' },
];

export default function QuizHomeScreen() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState('general');
    const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

    const handleStart = () => {
        router.push({
            pathname: '/quiz/play',
            params: { category: selectedCategory, difficulty: selectedDifficulty },
        } as any);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Quiz</Text>
                <Text style={styles.subtitle}>Test your knowledge</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Category Selection */}
                <Text style={styles.label}>CATEGORY</Text>
                <View style={styles.categoryGrid}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.key}
                            style={[styles.categoryCard, selectedCategory === cat.key && styles.categoryCardActive]}
                            onPress={() => setSelectedCategory(cat.key)}
                        >
                            <Ionicons
                                name={cat.icon as any}
                                size={22}
                                color={selectedCategory === cat.key ? Colors.white : Colors.primary}
                            />
                            <Text
                                style={[styles.categoryLabel, selectedCategory === cat.key && styles.categoryLabelActive]}
                                numberOfLines={1}
                            >
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Difficulty */}
                <Text style={styles.label}>DIFFICULTY</Text>
                <View style={styles.difficultyRow}>
                    {difficulties.map(diff => (
                        <TouchableOpacity
                            key={diff.key}
                            style={[
                                styles.difficultyChip,
                                selectedDifficulty === diff.key && { backgroundColor: diff.color, borderColor: diff.color },
                            ]}
                            onPress={() => setSelectedDifficulty(diff.key)}
                        >
                            <Text style={styles.difficultyEmoji}>{diff.emoji}</Text>
                            <Text
                                style={[
                                    styles.difficultyText,
                                    selectedDifficulty === diff.key && { color: Colors.white },
                                ]}
                            >
                                {diff.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Start Button */}
                <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                    <Ionicons name="play" size={20} color={Colors.white} />
                    <Text style={styles.startButtonText}>Start Quiz</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md },
    title: { ...Typography.heading, fontSize: 26 },
    subtitle: { ...Typography.bodySmall, marginTop: 2 },
    content: { flex: 1, paddingHorizontal: Spacing.lg },
    label: {
        ...Typography.label, fontSize: 12, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: Spacing.md, marginTop: Spacing.lg,
    },
    categoryGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    },
    categoryCard: {
        width: '31%', alignItems: 'center', paddingVertical: Spacing.md,
        borderRadius: Radius.md, backgroundColor: Colors.card,
        borderWidth: 1, borderColor: Colors.border,
    },
    categoryCardActive: {
        backgroundColor: Colors.primary, borderColor: Colors.primary,
    },
    categoryLabel: {
        fontFamily: 'Poppins_500Medium', fontSize: 10, color: Colors.textSecondary,
        marginTop: 4, textAlign: 'center',
    },
    categoryLabelActive: { color: Colors.white },
    difficultyRow: { flexDirection: 'row', gap: Spacing.sm },
    difficultyChip: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: Spacing.sm + 4, borderRadius: Radius.md,
        backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    },
    difficultyEmoji: { fontSize: 14 },
    difficultyText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.textPrimary },
    startButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Radius.md,
        marginTop: Spacing.xl, ...Shadows.button,
    },
    startButtonText: { ...Typography.button, fontSize: 16 },
});
