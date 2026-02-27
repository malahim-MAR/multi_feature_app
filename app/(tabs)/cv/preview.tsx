import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet, Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../../constants/theme';
import { CVData, getCVById } from '../../../services/cvStorage';

export default function CVPreviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string }>();
    const [cv, setCv] = useState<CVData | null>(null);

    useEffect(() => {
        if (params.id) {
            (async () => {
                const data = await getCVById(params.id);
                setCv(data);
            })();
        }
    }, [params.id]);

    const generateHTML = () => {
        if (!cv) return '';
        if (cv.template === 'modern') return modernTemplate(cv);
        if (cv.template === 'minimal') return minimalTemplate(cv);
        return classicTemplate(cv);
    };

    const handleExportPDF = async () => {
        try {
            const html = generateHTML();
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert('Error', 'Failed to export PDF');
        }
    };

    if (!cv) return (
        <View style={styles.container}>
            <Text style={{ ...Typography.body, textAlign: 'center', marginTop: 100 }}>Loading...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Preview</Text>
                <TouchableOpacity onPress={handleExportPDF} style={styles.exportButton}>
                    <Ionicons name="download-outline" size={18} color={Colors.white} />
                    <Text style={styles.exportButtonText}>PDF</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.preview} showsVerticalScrollIndicator={false}>
                {/* In-app preview */}
                <View style={styles.previewCard}>
                    <Text style={styles.previewName}>{cv.name || 'Your Name'}</Text>
                    <Text style={styles.previewContact}>
                        {[cv.email, cv.phone, cv.linkedin].filter(Boolean).join('  ·  ')}
                    </Text>

                    {cv.summary ? (
                        <>
                            <Text style={styles.sectionTitle}>Profile Summary</Text>
                            <Text style={styles.previewText}>{cv.summary}</Text>
                        </>
                    ) : null}

                    {cv.experience.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Work Experience</Text>
                            {cv.experience.map((exp, i) => (
                                <View key={i} style={styles.entry}>
                                    <Text style={styles.entryTitle}>{exp.role} — {exp.company}</Text>
                                    <Text style={styles.entryDate}>{exp.duration}</Text>
                                    <Text style={styles.previewText}>{exp.description}</Text>
                                </View>
                            ))}
                        </>
                    )}

                    {cv.education.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Education</Text>
                            {cv.education.map((edu, i) => (
                                <View key={i} style={styles.entry}>
                                    <Text style={styles.entryTitle}>{edu.degree}</Text>
                                    <Text style={styles.entryDate}>{edu.institution} · {edu.year}</Text>
                                </View>
                            ))}
                        </>
                    )}

                    {cv.skills.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Skills</Text>
                            <Text style={styles.previewText}>{cv.skills.join('  ·  ')}</Text>
                        </>
                    )}

                    {cv.languages.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Languages</Text>
                            <Text style={styles.previewText}>{cv.languages.join('  ·  ')}</Text>
                        </>
                    )}

                    {cv.projects.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Projects</Text>
                            {cv.projects.map((p, i) => (
                                <View key={i} style={styles.entry}>
                                    <Text style={styles.entryTitle}>{p.name}</Text>
                                    <Text style={styles.previewText}>{p.description}</Text>
                                </View>
                            ))}
                        </>
                    )}

                    {cv.certifications.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Certifications</Text>
                            <Text style={styles.previewText}>{cv.certifications.join('  ·  ')}</Text>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

// ─── HTML Templates ──────────────────────────────

function classicTemplate(cv: CVData): string {
    return `<html><head><style>
    body { font-family: Georgia, serif; margin: 40px; color: #333; }
    h1 { text-align: center; margin-bottom: 4px; }
    .contact { text-align: center; color: #666; font-size: 13px; margin-bottom: 20px; }
    h2 { border-bottom: 2px solid #6C63FF; padding-bottom: 4px; font-size: 16px; margin-top: 20px; color: #6C63FF; }
    .entry { margin-bottom: 12px; }
    .entry-title { font-weight: bold; font-size: 14px; }
    .entry-sub { color: #888; font-size: 12px; }
    p { font-size: 13px; line-height: 1.5; }
    .skills { font-size: 13px; }
  </style></head><body>
    <h1>${cv.name}</h1>
    <div class="contact">${[cv.email, cv.phone, cv.linkedin].filter(Boolean).join(' · ')}</div>
    ${cv.summary ? `<h2>Profile Summary</h2><p>${cv.summary}</p>` : ''}
    ${cv.experience.length ? `<h2>Work Experience</h2>${cv.experience.map(e => `<div class="entry"><div class="entry-title">${e.role} — ${e.company}</div><div class="entry-sub">${e.duration}</div><p>${e.description}</p></div>`).join('')}` : ''}
    ${cv.education.length ? `<h2>Education</h2>${cv.education.map(e => `<div class="entry"><div class="entry-title">${e.degree}</div><div class="entry-sub">${e.institution} · ${e.year}</div></div>`).join('')}` : ''}
    ${cv.skills.length ? `<h2>Skills</h2><p class="skills">${cv.skills.join(' · ')}</p>` : ''}
    ${cv.languages.length ? `<h2>Languages</h2><p>${cv.languages.join(' · ')}</p>` : ''}
    ${cv.projects.length ? `<h2>Projects</h2>${cv.projects.map(p => `<div class="entry"><div class="entry-title">${p.name}</div><p>${p.description}</p></div>`).join('')}` : ''}
    ${cv.certifications.length ? `<h2>Certifications</h2><p>${cv.certifications.join(' · ')}</p>` : ''}
  </body></html>`;
}

function modernTemplate(cv: CVData): string {
    return `<html><head><style>
    body { font-family: 'Helvetica Neue', sans-serif; margin: 0; color: #1a1a1a; }
    .header { background: #6C63FF; color: white; padding: 30px 40px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header .contact { font-size: 13px; opacity: 0.9; margin-top: 6px; }
    .body { padding: 30px 40px; }
    h2 { color: #6C63FF; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .entry { margin-bottom: 12px; }
    .entry-title { font-weight: bold; font-size: 14px; }
    .entry-sub { color: #888; font-size: 12px; }
    p { font-size: 13px; line-height: 1.6; }
  </style></head><body>
    <div class="header">
      <h1>${cv.name}</h1>
      <div class="contact">${[cv.email, cv.phone, cv.linkedin].filter(Boolean).join(' · ')}</div>
    </div>
    <div class="body">
    ${cv.summary ? `<h2>Profile</h2><p>${cv.summary}</p>` : ''}
    ${cv.experience.length ? `<h2>Experience</h2>${cv.experience.map(e => `<div class="entry"><div class="entry-title">${e.role} — ${e.company}</div><div class="entry-sub">${e.duration}</div><p>${e.description}</p></div>`).join('')}` : ''}
    ${cv.education.length ? `<h2>Education</h2>${cv.education.map(e => `<div class="entry"><div class="entry-title">${e.degree}</div><div class="entry-sub">${e.institution} · ${e.year}</div></div>`).join('')}` : ''}
    ${cv.skills.length ? `<h2>Skills</h2><p>${cv.skills.join(' · ')}</p>` : ''}
    ${cv.languages.length ? `<h2>Languages</h2><p>${cv.languages.join(' · ')}</p>` : ''}
    ${cv.projects.length ? `<h2>Projects</h2>${cv.projects.map(p => `<div class="entry"><div class="entry-title">${p.name}</div><p>${p.description}</p></div>`).join('')}` : ''}
    ${cv.certifications.length ? `<h2>Certifications</h2><p>${cv.certifications.join(' · ')}</p>` : ''}
    </div>
  </body></html>`;
}

function minimalTemplate(cv: CVData): string {
    return `<html><head><style>
    body { font-family: 'Courier New', monospace; margin: 40px; color: #1a1a1a; max-width: 600px; }
    h1 { font-size: 22px; margin-bottom: 2px; }
    .contact { color: #888; font-size: 12px; margin-bottom: 24px; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #aaa; margin-top: 20px; margin-bottom: 8px; }
    .entry { margin-bottom: 10px; }
    .entry-title { font-weight: bold; font-size: 13px; }
    .entry-sub { color: #aaa; font-size: 11px; }
    p { font-size: 12px; line-height: 1.6; }
  </style></head><body>
    <h1>${cv.name}</h1>
    <div class="contact">${[cv.email, cv.phone, cv.linkedin].filter(Boolean).join(' / ')}</div>
    ${cv.summary ? `<h2>About</h2><p>${cv.summary}</p>` : ''}
    ${cv.experience.length ? `<h2>Experience</h2>${cv.experience.map(e => `<div class="entry"><div class="entry-title">${e.role} @ ${e.company}</div><div class="entry-sub">${e.duration}</div><p>${e.description}</p></div>`).join('')}` : ''}
    ${cv.education.length ? `<h2>Education</h2>${cv.education.map(e => `<div class="entry"><div class="entry-title">${e.degree}</div><div class="entry-sub">${e.institution} / ${e.year}</div></div>`).join('')}` : ''}
    ${cv.skills.length ? `<h2>Skills</h2><p>${cv.skills.join(', ')}</p>` : ''}
    ${cv.languages.length ? `<h2>Languages</h2><p>${cv.languages.join(', ')}</p>` : ''}
    ${cv.projects.length ? `<h2>Projects</h2>${cv.projects.map(p => `<div class="entry"><div class="entry-title">${p.name}</div><p>${p.description}</p></div>`).join('')}` : ''}
    ${cv.certifications.length ? `<h2>Certifications</h2><p>${cv.certifications.join(', ')}</p>` : ''}
  </body></html>`;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { ...Typography.headingSmall, fontSize: 18 },
    exportButton: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderRadius: Radius.sm,
    },
    exportButtonText: { ...Typography.button, fontSize: 13 },
    preview: { flex: 1, padding: Spacing.lg },
    previewCard: {
        backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg,
        borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl,
    },
    previewName: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: Colors.textPrimary, textAlign: 'center' },
    previewContact: { ...Typography.label, textAlign: 'center', marginTop: 4, marginBottom: Spacing.md },
    sectionTitle: {
        fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.primary,
        textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.lg,
        marginBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 4,
    },
    entry: { marginBottom: Spacing.sm },
    entryTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary },
    entryDate: { ...Typography.label, fontSize: 11 },
    previewText: { ...Typography.bodySmall, fontSize: 13, lineHeight: 20 },
});
