import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert,
    StyleSheet, Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import { callClaudeAPI } from '../../../services/claudeService';

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    type: 'mcq' | 'truefalse';
}

const TIMER_SECONDS = 20;

export default function QuizPlayScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ category: string; difficulty: string }>();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<{ question: string; selected: string; correct: string; isCorrect: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [timer, setTimer] = useState(TIMER_SECONDS);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        generateQuestions();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    useEffect(() => {
        if (!loading && questions.length > 0) {
            startTimer();
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [currentIndex, loading]);

    const startTimer = () => {
        setTimer(TIMER_SECONDS);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleTimeout = () => {
        if (answered) return;
        setAnswered(true);
        const q = questions[currentIndex];
        setAnswers(prev => [...prev, {
            question: q.question, selected: 'Timed out',
            correct: q.options[q.correctIndex], isCorrect: false,
        }]);
    };

    const generateQuestions = async () => {
        try {
            const prompt = `Generate exactly 10 quiz questions about "${params.category}" at "${params.difficulty}" difficulty level.

Mix of question types: mostly MCQ (4 options) and some True/False.

Return ONLY valid JSON array, no other text. Each item:
{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "type": "mcq"
}
For true/false: options should be ["True", "False"] and type "truefalse".
Ensure correctIndex matches the correct option index.`;

            const result = await callClaudeAPI('You are a quiz question generator. Return ONLY valid JSON.', prompt);

            // Parse JSON from response
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('Invalid response format');
            const parsed: Question[] = JSON.parse(jsonMatch[0]);

            if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('No questions generated');
            setQuestions(parsed);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to generate questions', [
                { text: 'Go Back', onPress: () => router.back() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (optionIndex: number) => {
        if (answered) return;
        if (timerRef.current) clearInterval(timerRef.current);

        setSelectedOption(optionIndex);
        setAnswered(true);

        const q = questions[currentIndex];
        const isCorrect = optionIndex === q.correctIndex;
        if (isCorrect) setScore(prev => prev + 1);

        setAnswers(prev => [...prev, {
            question: q.question,
            selected: q.options[optionIndex],
            correct: q.options[q.correctIndex],
            isCorrect,
        }]);
    };

    const handleNext = () => {
        if (currentIndex + 1 >= questions.length) {
            // Go to results
            router.replace({
                pathname: '/quiz/result',
                params: {
                    score: score.toString(),
                    total: questions.length.toString(),
                    answers: JSON.stringify(answers),
                    category: params.category,
                    difficulty: params.difficulty,
                },
            } as any);
            return;
        }
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setAnswered(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Generating questions...</Text>
            </View>
        );
    }

    if (questions.length === 0) return null;

    const q = questions[currentIndex];
    const timerPercent = (timer / TIMER_SECONDS) * 100;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.progress}>{currentIndex + 1} / {questions.length}</Text>
                <Text style={styles.scoreText}>Score: {score}</Text>
            </View>

            {/* Timer Bar */}
            <View style={styles.timerBarBg}>
                <View style={[
                    styles.timerBarFill,
                    { width: `${timerPercent}%`, backgroundColor: timer <= 5 ? Colors.danger : Colors.primary },
                ]} />
            </View>

            {/* Question */}
            <View style={styles.questionContainer}>
                <View style={styles.questionBadge}>
                    <Text style={styles.questionBadgeText}>{q.type === 'truefalse' ? 'True / False' : 'MCQ'}</Text>
                </View>
                <Text style={styles.questionText}>{q.question}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
                {q.options.map((option, index) => {
                    let bgColor = Colors.card;
                    let borderColor = Colors.border;
                    let textColor = Colors.textPrimary;

                    if (answered) {
                        if (index === q.correctIndex) {
                            bgColor = '#E8F5E9';
                            borderColor = Colors.easy;
                            textColor = '#2E7D32';
                        }
                        if (selectedOption === index && index !== q.correctIndex) {
                            bgColor = '#FFEBEE';
                            borderColor = Colors.danger;
                            textColor = Colors.danger;
                        }
                    } else if (selectedOption === index) {
                        bgColor = Colors.primary + '15';
                        borderColor = Colors.primary;
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.optionButton, { backgroundColor: bgColor, borderColor }]}
                            onPress={() => handleAnswer(index)}
                            disabled={answered}
                        >
                            <Text style={[styles.optionLetter, { color: textColor }]}>
                                {String.fromCharCode(65 + index)}
                            </Text>
                            <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Next / Finish Button */}
            {answered && (
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { ...Typography.bodySmall, marginTop: Spacing.md },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.sm,
    },
    progress: { ...Typography.headingSmall, fontSize: 16 },
    scoreText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.primary },
    timerBarBg: { height: 4, backgroundColor: Colors.card, marginHorizontal: Spacing.lg },
    timerBarFill: { height: 4, borderRadius: 2 },
    questionContainer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
    questionBadge: {
        alignSelf: 'flex-start', backgroundColor: Colors.primary + '15',
        paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm, marginBottom: Spacing.sm,
    },
    questionBadgeText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: Colors.primary },
    questionText: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: Colors.textPrimary, lineHeight: 26 },
    optionsContainer: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
    optionButton: {
        flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
        borderRadius: Radius.md, borderWidth: 1.5, marginBottom: Spacing.sm,
    },
    optionLetter: {
        fontFamily: 'Poppins_600SemiBold', fontSize: 14, width: 28, height: 28,
        textAlign: 'center', lineHeight: 28, borderRadius: 14, backgroundColor: Colors.card, marginRight: Spacing.md,
        overflow: 'hidden',
    },
    optionText: { fontFamily: 'Poppins_400Regular', fontSize: 14, flex: 1 },
    nextButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        backgroundColor: Colors.primary, marginHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderRadius: Radius.md,
        marginTop: Spacing.lg, ...Shadows.button,
    },
    nextButtonText: { ...Typography.button, fontSize: 15 },
});
