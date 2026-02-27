import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { getClaudeApiKey, setClaudeApiKey } from '../services/claudeService';

export default function SettingsScreen() {
    const router = useRouter();
    const [apiKey, setApiKeyState] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        (async () => {
            const key = await getClaudeApiKey();
            setApiKeyState(key);
        })();
    }, []);

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            Alert.alert('Error', 'Please enter a valid API key');
            return;
        }
        await setClaudeApiKey(apiKey.trim());
        Alert.alert('Saved', 'Claude API key has been saved.');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Appearance */}
                <Text style={styles.sectionTitle}>APPEARANCE</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="moon-outline" size={20} color={Colors.primary} />
                            <Text style={styles.rowLabel}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={darkMode}
                            onValueChange={setDarkMode}
                            trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
                            thumbColor={darkMode ? Colors.primary : '#f4f3f4'}
                        />
                    </View>
                    <Text style={styles.rowHint}>Coming soon — dark mode is under development</Text>
                </View>

                {/* AI Configuration */}
                <Text style={styles.sectionTitle}>AI CONFIGURATION</Text>
                <View style={styles.card}>
                    <Text style={styles.fieldLabel}>Claude API Key</Text>
                    <Text style={styles.fieldHint}>
                        Required for AI Humanizer & Quiz. Get your key from console.anthropic.com
                    </Text>
                    <View style={styles.apiKeyRow}>
                        <TextInput
                            style={styles.apiKeyInput}
                            placeholder="sk-ant-api..."
                            placeholderTextColor={Colors.textSecondary}
                            value={apiKey}
                            onChangeText={setApiKeyState}
                            secureTextEntry={!showApiKey}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)} style={styles.eyeButton}>
                            <Ionicons name={showApiKey ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.saveKeyButton} onPress={handleSaveApiKey}>
                        <Text style={styles.saveKeyText}>Save API Key</Text>
                    </TouchableOpacity>
                </View>

                {/* About */}
                <Text style={styles.sectionTitle}>ABOUT</Text>
                <View style={styles.card}>
                    <View style={styles.aboutRow}>
                        <Text style={styles.aboutLabel}>App Name</Text>
                        <Text style={styles.aboutValue}>Multi Feature App</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.aboutRow}>
                        <Text style={styles.aboutLabel}>Version</Text>
                        <Text style={styles.aboutValue}>1.0.0</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.aboutRow}>
                        <Text style={styles.aboutLabel}>Framework</Text>
                        <Text style={styles.aboutValue}>React Native (Expo)</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.aboutRow}>
                        <Text style={styles.aboutLabel}>Developer</Text>
                        <Text style={styles.aboutValue}>Malahim</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { ...Typography.headingSmall, fontSize: 18 },
    content: { flex: 1, paddingHorizontal: Spacing.lg },
    sectionTitle: {
        ...Typography.label, fontSize: 12, textTransform: 'uppercase',
        letterSpacing: 0.5, marginTop: Spacing.lg, marginBottom: Spacing.sm,
    },
    card: {
        backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    rowLabel: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: Colors.textPrimary },
    rowHint: { ...Typography.label, fontSize: 11, marginTop: Spacing.xs },
    fieldLabel: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Colors.textPrimary },
    fieldHint: { ...Typography.label, fontSize: 11, marginTop: 2, marginBottom: Spacing.sm },
    apiKeyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    apiKeyInput: {
        flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
        fontFamily: 'Poppins_400Regular', fontSize: 13, color: Colors.textPrimary,
        borderWidth: 1, borderColor: Colors.border,
    },
    eyeButton: { padding: 8 },
    saveKeyButton: {
        backgroundColor: Colors.primary, alignItems: 'center', paddingVertical: Spacing.sm + 2,
        borderRadius: Radius.sm, marginTop: Spacing.md,
    },
    saveKeyText: { ...Typography.button, fontSize: 13 },
    aboutRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    aboutLabel: { ...Typography.bodySmall, fontSize: 14 },
    aboutValue: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Colors.textPrimary },
    divider: { height: 1, backgroundColor: Colors.border },
});
