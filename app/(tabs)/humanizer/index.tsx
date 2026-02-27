import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import { callClaudeAPI } from '../../../services/claudeService';

type Tone = 'casual' | 'professional' | 'friendly';
type Strength = 'light' | 'medium' | 'heavy';

export default function HumanizerScreen() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [tone, setTone] = useState<Tone>('professional');
    const [strength, setStrength] = useState<Strength>('medium');
    const [loading, setLoading] = useState(false);

    const handleHumanize = async () => {
        if (!inputText.trim()) {
            Alert.alert('Error', 'Please paste some text to humanize.');
            return;
        }

        setLoading(true);
        setOutputText('');

        try {
            const systemPrompt = `You are a text humanizer. Rewrite the given AI-generated text to sound naturally human-written.

Tone: ${tone}
Rewrite Strength: ${strength} (light = minimal changes, medium = moderate rewrite, heavy = complete rewrite in natural voice)

Rules:
- Keep the same meaning and information
- Make it sound like a real person wrote it
- Remove robotic patterns and AI-sounding phrases
- Add natural flow, personality, and variety
- Only return the humanized text, no explanations`;

            const result = await callClaudeAPI(systemPrompt, inputText);
            setOutputText(result);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to humanize text.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!outputText) return;
        await Clipboard.setStringAsync(outputText);
        Alert.alert('Copied!', 'Humanized text copied to clipboard.');
    };

    const tones: { key: Tone; label: string; icon: string }[] = [
        { key: 'casual', label: 'Casual', icon: 'chatbubble-outline' },
        { key: 'professional', label: 'Professional', icon: 'briefcase-outline' },
        { key: 'friendly', label: 'Friendly', icon: 'happy-outline' },
    ];

    const strengths: { key: Strength; label: string }[] = [
        { key: 'light', label: 'Light' },
        { key: 'medium', label: 'Medium' },
        { key: 'heavy', label: 'Heavy' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>AI Humanizer</Text>
                <Text style={styles.subtitle}>Make AI text sound human</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Input */}
                <Text style={styles.label}>PASTE AI TEXT</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Paste AI-generated text here..."
                    placeholderTextColor={Colors.textSecondary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    textAlignVertical="top"
                />

                {/* Tone */}
                <Text style={styles.label}>TONE</Text>
                <View style={styles.optionRow}>
                    {tones.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.optionChip, tone === t.key && styles.optionChipActive]}
                            onPress={() => setTone(t.key)}
                        >
                            <Ionicons name={t.icon as any} size={16} color={tone === t.key ? Colors.white : Colors.primary} />
                            <Text style={[styles.optionChipText, tone === t.key && styles.optionChipTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Strength */}
                <Text style={styles.label}>STRENGTH</Text>
                <View style={styles.optionRow}>
                    {strengths.map(s => (
                        <TouchableOpacity
                            key={s.key}
                            style={[styles.optionChip, strength === s.key && styles.optionChipActive]}
                            onPress={() => setStrength(s.key)}
                        >
                            <Text style={[styles.optionChipText, strength === s.key && styles.optionChipTextActive]}>{s.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Humanize Button */}
                <TouchableOpacity style={styles.humanizeButton} onPress={handleHumanize} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            <Ionicons name="sparkles" size={18} color={Colors.white} />
                            <Text style={styles.humanizeButtonText}>Humanize</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Output */}
                {(outputText || loading) && (
                    <>
                        <View style={styles.outputHeader}>
                            <Text style={styles.label}>HUMANIZED RESULT</Text>
                            {outputText ? (
                                <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                                    <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                                    <Text style={styles.copyButtonText}>Copy</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        <View style={styles.outputBox}>
                            {loading ? (
                                <ActivityIndicator color={Colors.primary} />
                            ) : (
                                <Text style={styles.outputText}>{outputText}</Text>
                            )}
                        </View>
                    </>
                )}

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
        letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.md,
    },
    textArea: {
        backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
        fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textPrimary,
        height: 130, borderWidth: 1, borderColor: Colors.border, textAlignVertical: 'top',
    },
    optionRow: { flexDirection: 'row', gap: Spacing.sm },
    optionChip: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
        paddingVertical: Spacing.sm + 4, borderRadius: Radius.md,
        backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    },
    optionChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    optionChipText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: Colors.primary },
    optionChipTextActive: { color: Colors.white },
    humanizeButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Radius.md,
        marginTop: Spacing.lg, ...Shadows.button,
    },
    humanizeButtonText: { ...Typography.button, fontSize: 16 },
    outputHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: Spacing.lg, marginBottom: Spacing.sm,
    },
    copyButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    copyButtonText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.primary },
    outputBox: {
        backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
        minHeight: 120, borderWidth: 1, borderColor: Colors.border,
    },
    outputText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
});
