import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../../constants/theme';

type FormatMode = 'uppercase' | 'lowercase' | 'bold' | 'italic' | null;

export default function FormatterScreen() {
    const [inputText, setInputText] = useState('');
    const [activeMode, setActiveMode] = useState<FormatMode>(null);

    const outputText = useMemo(() => {
        if (!inputText) return '';
        switch (activeMode) {
            case 'uppercase':
                return inputText.toUpperCase();
            case 'lowercase':
                return inputText.toLowerCase();
            case 'bold':
                // Unicode bold mapping
                return toBoldUnicode(inputText);
            case 'italic':
                // Unicode italic mapping
                return toItalicUnicode(inputText);
            default:
                return inputText;
        }
    }, [inputText, activeMode]);

    const stats = useMemo(() => {
        const chars = inputText.length;
        const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
        return { chars, words };
    }, [inputText]);

    const handleCopy = async () => {
        if (!outputText) {
            Alert.alert('Nothing to copy', 'Type some text and select a format first.');
            return;
        }
        await Clipboard.setStringAsync(outputText);
        Alert.alert('Copied!', 'Text copied to clipboard.');
    };

    const formatButtons: { label: string; icon: string; mode: FormatMode }[] = [
        { label: 'UPPER', icon: 'arrow-up', mode: 'uppercase' },
        { label: 'lower', icon: 'arrow-down', mode: 'lowercase' },
        { label: 'Bold', icon: 'text', mode: 'bold' },
        { label: 'Italic', icon: 'text-outline', mode: 'italic' },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Text Formatter</Text>
                <Text style={styles.subtitle}>Transform your text instantly</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Input */}
                <Text style={styles.label}>INPUT</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Type or paste your text here..."
                    placeholderTextColor={Colors.textSecondary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    textAlignVertical="top"
                />

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <Text style={styles.statsText}>{stats.chars} characters</Text>
                    <Text style={styles.statsText}>{stats.words} words</Text>
                </View>

                {/* Format Buttons */}
                <View style={styles.buttonsRow}>
                    {formatButtons.map(btn => (
                        <TouchableOpacity
                            key={btn.mode}
                            style={[styles.formatButton, activeMode === btn.mode && styles.formatButtonActive]}
                            onPress={() => setActiveMode(prev => prev === btn.mode ? null : btn.mode)}
                        >
                            <Ionicons
                                name={btn.icon as any}
                                size={18}
                                color={activeMode === btn.mode ? Colors.white : Colors.primary}
                            />
                            <Text style={[styles.formatButtonText, activeMode === btn.mode && styles.formatButtonTextActive]}>
                                {btn.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Output */}
                <View style={styles.outputHeader}>
                    <Text style={styles.label}>OUTPUT</Text>
                    <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                        <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                        <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.outputBox}>
                    <Text style={styles.outputText}>
                        {outputText || 'Formatted text will appear here...'}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

// Unicode bold text converter (A-Z, a-z, 0-9)
function toBoldUnicode(str: string): string {
    return str.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + (code - 97));
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7CE + (code - 48));
        return c;
    }).join('');
}

// Unicode italic text converter (A-Z, a-z)
function toItalicUnicode(str: string): string {
    return str.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D434 + (code - 65));
        if (code >= 97 && code <= 122) {
            // 'h' has a special codepoint in italic
            if (c === 'h') return String.fromCodePoint(0x210E);
            const offset = code >= 104 ? code - 97 + 1 : code - 97; // skip h special
            return String.fromCodePoint(0x1D44E + (code - 97));
        }
        return c;
    }).join('');
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 56,
        paddingBottom: Spacing.md,
    },
    title: {
        ...Typography.heading,
        fontSize: 26,
    },
    subtitle: {
        ...Typography.bodySmall,
        marginTop: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    label: {
        ...Typography.label,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    textArea: {
        backgroundColor: Colors.card,
        borderRadius: Radius.md,
        padding: Spacing.md,
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
        color: Colors.textPrimary,
        height: 140,
        borderWidth: 1,
        borderColor: Colors.border,
        textAlignVertical: 'top',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    statsText: {
        ...Typography.label,
        fontSize: 12,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    formatButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.sm + 4,
        borderRadius: Radius.md,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    formatButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    formatButtonText: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 12,
        color: Colors.primary,
    },
    formatButtonTextActive: {
        color: Colors.white,
    },
    outputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    copyButtonText: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 13,
        color: Colors.primary,
    },
    outputBox: {
        backgroundColor: Colors.card,
        borderRadius: Radius.md,
        padding: Spacing.md,
        minHeight: 120,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.xl,
    },
    outputText: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
        color: Colors.textPrimary,
    },
});
