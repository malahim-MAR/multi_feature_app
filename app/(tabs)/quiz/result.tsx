import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet, Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';

export default function QuizResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        score: string; total: string; answers: string;
        category: string; difficulty: string;
    }>();

    const score = parseInt(params.score || '0');
    const total = parseInt(params.total || '0');
    const answers: { question: string; selected: string; correct: string; isCorrect: boolean }[] =
        JSON.parse(params.answers || '[]');
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    const getGrade = () => {
        if (percentage >= 90) return { label: 'Excellent! 🏆', color: Colors.easy };
        if (percentage >= 70) return { label: 'Great Job! 🎉', color: Colors.primary };
        if (percentage >= 50) return { label: 'Good Try! 👍', color: Colors.warning };
        return { label: 'Keep Practicing! 💪', color: Colors.danger };
    };

    const grade = getGrade();

    const handleRetry = () => {
        router.replace({
            pathname: '/quiz/play',
            params: { category: params.category, difficulty: params.difficulty },
        } as any);
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Score Card */}
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreTitle}>Quiz Complete!</Text>
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreNumber}>{score}/{total}</Text>
                        <Text style={styles.scorePercent}>{percentage}%</Text>
                    </View>
                    <Text style={[styles.gradeText, { color: grade.color }]}>{grade.label}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <Ionicons name="refresh" size={18} color={Colors.white} />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.changeButton} onPress={() => router.replace('/quiz' as any)}>
                        <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
                        <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                </View>

                {/* Review */}
                <Text style={styles.reviewTitle}>Review</Text>
                {answers.map((ans, i) => (
                    <View key={i} style={[styles.reviewCard, { borderLeftColor: ans.isCorrect ? Colors.easy : Colors.danger }]}>
                        <Text style={styles.reviewQuestion}>{i + 1}. {ans.question}</Text>
                        <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Your answer: </Text>
                            <Text style={[styles.reviewAnswer, { color: ans.isCorrect ? Colors.easy : Colors.danger }]}>
                                {ans.selected}
                            </Text>
                        </View>
                        {!ans.isCorrect && (
                            <View style={styles.reviewRow}>
                                <Text style={styles.reviewLabel}>Correct: </Text>
                                <Text style={[styles.reviewAnswer, { color: Colors.easy }]}>{ans.correct}</Text>
                            </View>
                        )}
                    </View>
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: 56 },
    scoreCard: {
        alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg,
        padding: Spacing.xl, ...Shadows.card, borderWidth: 1, borderColor: Colors.border,
    },
    scoreTitle: { ...Typography.heading, fontSize: 22, marginBottom: Spacing.md },
    scoreCircle: {
        width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    },
    scoreNumber: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: Colors.primary },
    scorePercent: { ...Typography.label, fontSize: 13 },
    gradeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 18 },
    actionsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
    retryButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Radius.md, ...Shadows.button,
    },
    retryButtonText: { ...Typography.button, fontSize: 15 },
    changeButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        backgroundColor: Colors.card, paddingVertical: Spacing.md, borderRadius: Radius.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    changeButtonText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.primary },
    reviewTitle: { ...Typography.headingSmall, fontSize: 18, marginTop: Spacing.xl, marginBottom: Spacing.md },
    reviewCard: {
        backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
        marginBottom: Spacing.sm, borderLeftWidth: 3,
    },
    reviewQuestion: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.textPrimary, marginBottom: 6 },
    reviewRow: { flexDirection: 'row', marginTop: 2 },
    reviewLabel: { ...Typography.label, fontSize: 12 },
    reviewAnswer: { fontFamily: 'Poppins_500Medium', fontSize: 12 },
});
