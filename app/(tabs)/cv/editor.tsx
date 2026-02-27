import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../../constants/theme';
import { CVData, getCVById, getEmptyCV, saveCV } from '../../../services/cvStorage';

type SectionTab = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'extra';

const tabs: { key: SectionTab; label: string }[] = [
    { key: 'personal', label: 'Personal' },
    { key: 'summary', label: 'Summary' },
    { key: 'experience', label: 'Work' },
    { key: 'education', label: 'Education' },
    { key: 'skills', label: 'Skills' },
    { key: 'extra', label: 'More' },
];

export default function CVEditorScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const [cv, setCv] = useState<CVData>(getEmptyCV());
    const [activeTab, setActiveTab] = useState<SectionTab>('personal');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (params.id) {
            (async () => {
                const existing = await getCVById(params.id!);
                if (existing) setCv(existing);
            })();
        }
    }, [params.id]);

    const update = (field: keyof CVData, value: any) => {
        setCv(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!cv.name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }
        setSaving(true);
        try {
            await saveCV(cv);
            router.back();
        } catch {
            Alert.alert('Error', 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const addExperience = () => {
        update('experience', [...cv.experience, { company: '', role: '', duration: '', description: '' }]);
    };

    const updateExperience = (index: number, field: string, value: string) => {
        const copy = [...cv.experience];
        (copy[index] as any)[field] = value;
        update('experience', copy);
    };

    const removeExperience = (index: number) => {
        update('experience', cv.experience.filter((_, i) => i !== index));
    };

    const addEducation = () => {
        update('education', [...cv.education, { institution: '', degree: '', year: '' }]);
    };

    const updateEducation = (index: number, field: string, value: string) => {
        const copy = [...cv.education];
        (copy[index] as any)[field] = value;
        update('education', copy);
    };

    const removeEducation = (index: number) => {
        update('education', cv.education.filter((_, i) => i !== index));
    };

    const templates: { key: CVData['template']; label: string }[] = [
        { key: 'classic', label: 'Classic' },
        { key: 'modern', label: 'Modern' },
        { key: 'minimal', label: 'Minimal' },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{params.id ? 'Edit CV' : 'New CV'}</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>{saving ? '...' : 'Save'}</Text>
                </TouchableOpacity>
            </View>

            {/* Section Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'personal' && (
                    <>
                        <InputField label="Full Name" value={cv.name} onChange={v => update('name', v)} placeholder="John Doe" />
                        <InputField label="Email" value={cv.email} onChange={v => update('email', v)} placeholder="john@email.com" keyboardType="email-address" />
                        <InputField label="Phone" value={cv.phone} onChange={v => update('phone', v)} placeholder="+92 300 1234567" keyboardType="phone-pad" />
                        <InputField label="LinkedIn URL" value={cv.linkedin} onChange={v => update('linkedin', v)} placeholder="linkedin.com/in/johndoe" />

                        <Text style={styles.sectionLabel}>TEMPLATE</Text>
                        <View style={styles.templateRow}>
                            {templates.map(t => (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[styles.templateChip, cv.template === t.key && styles.templateChipActive]}
                                    onPress={() => update('template', t.key)}
                                >
                                    <Text style={[styles.templateChipText, cv.template === t.key && styles.templateChipTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                {activeTab === 'summary' && (
                    <InputField label="Profile Summary" value={cv.summary} onChange={v => update('summary', v)} placeholder="A brief summary about yourself..." multiline />
                )}

                {activeTab === 'experience' && (
                    <>
                        {cv.experience.map((exp, i) => (
                            <View key={i} style={styles.entryCard}>
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeExperience(i)}>
                                    <Ionicons name="close-circle" size={20} color={Colors.danger} />
                                </TouchableOpacity>
                                <InputField label="Company" value={exp.company} onChange={v => updateExperience(i, 'company', v)} placeholder="Company name" />
                                <InputField label="Role" value={exp.role} onChange={v => updateExperience(i, 'role', v)} placeholder="Job title" />
                                <InputField label="Duration" value={exp.duration} onChange={v => updateExperience(i, 'duration', v)} placeholder="Jan 2022 - Present" />
                                <InputField label="Description" value={exp.description} onChange={v => updateExperience(i, 'description', v)} placeholder="What did you do?" multiline />
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addEntryButton} onPress={addExperience}>
                            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                            <Text style={styles.addEntryText}>Add Experience</Text>
                        </TouchableOpacity>
                    </>
                )}

                {activeTab === 'education' && (
                    <>
                        {cv.education.map((edu, i) => (
                            <View key={i} style={styles.entryCard}>
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeEducation(i)}>
                                    <Ionicons name="close-circle" size={20} color={Colors.danger} />
                                </TouchableOpacity>
                                <InputField label="Institution" value={edu.institution} onChange={v => updateEducation(i, 'institution', v)} placeholder="University name" />
                                <InputField label="Degree" value={edu.degree} onChange={v => updateEducation(i, 'degree', v)} placeholder="BS Computer Science" />
                                <InputField label="Year" value={edu.year} onChange={v => updateEducation(i, 'year', v)} placeholder="2020 - 2024" />
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addEntryButton} onPress={addEducation}>
                            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                            <Text style={styles.addEntryText}>Add Education</Text>
                        </TouchableOpacity>
                    </>
                )}

                {activeTab === 'skills' && (
                    <>
                        <InputField
                            label="Skills (comma separated)"
                            value={cv.skills.join(', ')}
                            onChange={v => update('skills', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
                            placeholder="React Native, TypeScript, Node.js"
                            multiline
                        />
                        <InputField
                            label="Languages (comma separated)"
                            value={cv.languages.join(', ')}
                            onChange={v => update('languages', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
                            placeholder="English, Urdu, Arabic"
                        />
                    </>
                )}

                {activeTab === 'extra' && (
                    <>
                        <InputField
                            label="Certifications (comma separated)"
                            value={cv.certifications.join(', ')}
                            onChange={v => update('certifications', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
                            placeholder="AWS Certified, Google Analytics"
                            multiline
                        />
                        <Text style={styles.sectionLabel}>PROJECTS</Text>
                        {cv.projects.map((proj, i) => (
                            <View key={i} style={styles.entryCard}>
                                <TouchableOpacity style={styles.removeBtn} onPress={() => update('projects', cv.projects.filter((_, idx) => idx !== i))}>
                                    <Ionicons name="close-circle" size={20} color={Colors.danger} />
                                </TouchableOpacity>
                                <InputField label="Name" value={proj.name} onChange={v => {
                                    const copy = [...cv.projects]; copy[i] = { ...copy[i], name: v }; update('projects', copy);
                                }} placeholder="Project name" />
                                <InputField label="Description" value={proj.description} onChange={v => {
                                    const copy = [...cv.projects]; copy[i] = { ...copy[i], description: v }; update('projects', copy);
                                }} placeholder="Brief description" multiline />
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addEntryButton} onPress={() => update('projects', [...cv.projects, { name: '', description: '' }])}>
                            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                            <Text style={styles.addEntryText}>Add Project</Text>
                        </TouchableOpacity>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function InputField({ label, value, onChange, placeholder, multiline, keyboardType }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; multiline?: boolean; keyboardType?: any;
}) {
    return (
        <>
            <Text style={fieldStyles.label}>{label}</Text>
            <TextInput
                style={[fieldStyles.input, multiline && fieldStyles.multiline]}
                placeholder={placeholder}
                placeholderTextColor={Colors.textSecondary}
                value={value}
                onChangeText={onChange}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                keyboardType={keyboardType}
            />
        </>
    );
}

const fieldStyles = StyleSheet.create({
    label: { ...Typography.label, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
        fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textPrimary,
        borderWidth: 1, borderColor: Colors.border,
    },
    multiline: { height: 100, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { ...Typography.headingSmall, fontSize: 18 },
    saveButton: {
        backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderRadius: Radius.sm,
    },
    saveButtonText: { ...Typography.button, fontSize: 14 },
    tabBar: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: Colors.border },
    tabBarContent: { paddingHorizontal: Spacing.lg, gap: 4 },
    tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: Colors.primary },
    tabText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.textSecondary },
    tabTextActive: { color: Colors.primary },
    content: { flex: 1, paddingHorizontal: Spacing.lg },
    sectionLabel: { ...Typography.label, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    templateRow: { flexDirection: 'row', gap: Spacing.sm },
    templateChip: {
        flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 2, borderRadius: Radius.md,
        backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    },
    templateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    templateChipText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.textSecondary },
    templateChipTextActive: { color: Colors.white },
    entryCard: {
        backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
        marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border, position: 'relative',
    },
    removeBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
    addEntryButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        paddingVertical: Spacing.md, marginTop: Spacing.md,
        borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed',
    },
    addEntryText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Colors.primary },
});
