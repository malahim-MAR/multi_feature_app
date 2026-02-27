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

// Helper function to render a contact item with a base64 inline SVG icon
const renderContactItem = (iconPath: string, text: string) => {
    if (!text) return '';
    return `
        <div class="contact-item">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="${iconPath}"/></svg>
            <span>${text}</span>
        </div>
    `;
};

// SVG Paths
const ICONS = {
    email: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
    linkedin: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"
};

// --- Option B: Classic Professional ---
function classicTemplate(cv: CVData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
        <style>
            @page { margin: 0; size: A4; }
            * { box-sizing: border-box; }
            body { font-family: 'Roboto', sans-serif; margin: 0; padding: 0; color: #1A1A1A; background: #FFF; display: flex; min-height: 297mm; }
            
            /* Sidebar */
            .sidebar { width: 32%; background: #1A1A2E; color: #FFF; padding: 40px 30px; }
            .sidebar h1 { font-size: 28px; margin: 0 0 10px 0; font-weight: 700; line-height: 1.1; color: #6C63FF; }
            .sidebar h3 { font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #6C63FF; padding-bottom: 5px; margin: 35px 0 15px 0; letter-spacing: 1px; color: #FFF; }
            
            /* Contact */
            .contact-list { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
            .contact-item { display: flex; align-items: center; gap: 10px; font-size: 12.5px; opacity: 0.9; word-break: break-all; }
            .contact-item svg { width: 16px; height: 16px; color: #6C63FF; flex-shrink: 0; }
            
            /* Skills / Languages */
            .skill-item { font-size: 13px; margin-bottom: 8px; opacity: 0.9; display: flex; align-items: center; }
            .skill-item::before { content: "•"; color: #6C63FF; margin-right: 8px; font-weight: bold; }
            
            /* Main Content */
            .main { width: 68%; padding: 40px 45px; }
            .main h2 { font-size: 18px; color: #1A1A2E; border-bottom: 1.5px solid #E8E8EE; padding-bottom: 8px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1.5px; }
            
            /* Summary */
            .summary { font-size: 13.5px; line-height: 1.6; color: #444; margin-bottom: 35px; }
            
            /* Entries */
            .entry { margin-bottom: 25px; }
            .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
            .entry-title { font-weight: 700; font-size: 15px; color: #1A1A2E; }
            .entry-subtitle { font-weight: 500; font-size: 14px; color: #6C63FF; }
            .entry-date { font-size: 12.5px; color: #7A7A8C; font-weight: 500; }
            .entry-desc { font-size: 13px; line-height: 1.5; color: #444; margin-top: 5px; }
            
            .section { margin-bottom: 35px; }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <h1>${cv.name}</h1>
            <div class="contact-list">
                ${renderContactItem(ICONS.email, cv.email)}
                ${renderContactItem(ICONS.phone, cv.phone)}
                ${renderContactItem(ICONS.linkedin, cv.linkedin)}
            </div>

            ${cv.skills.length ? `
            <h3>Skills</h3>
            <div>
                ${cv.skills.map(s => `<div class="skill-item">${s}</div>`).join('')}
            </div>` : ''}

            ${cv.languages.length ? `
            <h3>Languages</h3>
            <div>
                ${cv.languages.map(l => `<div class="skill-item">${l}</div>`).join('')}
            </div>` : ''}
            
            ${cv.certifications.length ? `
            <h3>Certifications</h3>
            <div>
                ${cv.certifications.map(c => `<div class="skill-item">${c}</div>`).join('')}
            </div>` : ''}
        </div>

        <div class="main">
            ${cv.summary ? `
            <div class="section">
                <h2>Profile</h2>
                <div class="summary">${cv.summary.replace(/\\n/g, '<br/>')}</div>
            </div>` : ''}

            ${cv.experience.length ? `
            <div class="section">
                <h2>Experience</h2>
                ${cv.experience.map(e => `
                <div class="entry">
                    <div class="entry-header">
                        <span class="entry-title">${e.role}</span>
                        <span class="entry-date">${e.duration}</span>
                    </div>
                    <div class="entry-subtitle">${e.company}</div>
                    <p class="entry-desc">${e.description.replace(/\\n/g, '<br/>')}</p>
                </div>
                `).join('')}
            </div>` : ''}

            ${cv.education.length ? `
            <div class="section">
                <h2>Education</h2>
                ${cv.education.map(e => `
                <div class="entry">
                    <div class="entry-header">
                        <span class="entry-title">${e.degree}</span>
                        <span class="entry-date">${e.year}</span>
                    </div>
                    <div class="entry-subtitle">${e.institution}</div>
                </div>
                `).join('')}
            </div>` : ''}

            ${cv.projects.length ? `
            <div class="section">
                <h2>Projects</h2>
                ${cv.projects.map(p => `
                <div class="entry">
                    <div class="entry-title" style="margin-bottom: 5px;">${p.name}</div>
                    <p class="entry-desc">${p.description.replace(/\\n/g, '<br/>')}</p>
                </div>
                `).join('')}
            </div>` : ''}
        </div>
    </body>
    </html>
    `;
}

// --- Option C: Modern Minimal ---
function modernTemplate(cv: CVData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            @page { margin: 0; size: A4; }
            * { box-sizing: border-box; }
            body { font-family: 'Outfit', sans-serif; margin: 0; padding: 0; color: #1A1A1A; background: #FFF; }
            
            /* Header */
            .header-bar { height: 12px; background: #6C63FF; width: 100%; }
            .header { padding: 45px 50px 30px 50px; text-align: center; }
            .header h1 { font-size: 38px; font-weight: 700; margin: 0 0 15px 0; color: #1A1A1A; letter-spacing: -0.5px; text-transform: uppercase; }
            
            .contact-row { display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; }
            .contact-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #555; font-weight: 400; }
            .contact-item svg { width: 14px; height: 14px; color: #6C63FF; }
            
            /* Container */
            .container { padding: 0 50px 40px 50px; }
            
            /* Summary */
            .summary { font-size: 14px; line-height: 1.6; color: #444; text-align: center; max-width: 85%; margin: 0 auto 40px auto; }
            
            /* Layout Grid */
            .grid { display: flex; gap: 40px; }
            /* Left column is wider for XP and Edu */
            .col-main { flex: 2; }
            /* Right column for Skills and Misc */
            .col-side { flex: 1; }
            
            /* Headings */
            h2 { font-size: 16px; color: #1A1A1A; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #1A1A1A; padding-bottom: 8px; margin: 0 0 20px 0; letter-spacing: 1px; }
            
            /* Entries */
            .entry { margin-bottom: 28px; }
            .entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
            .entry-role { font-weight: 600; font-size: 15px; color: #1A1A1A; }
            .entry-company { color: #6C63FF; font-weight: 500; font-size: 14px; margin-top: 2px; }
            .entry-date { font-size: 12px; color: #7A7A8C; background: #F5F5F7; padding: 4px 10px; border-radius: 4px; font-weight: 500;}
            .entry-desc { font-size: 13px; line-height: 1.6; color: #444; margin: 10px 0 0 0; }
            
            /* Chips / Tags */
            .tags { display: flex; flex-wrap: wrap; gap: 8px; }
            .tag { background: #F5F5F7; border: 1px solid #E8E8EE; color: #444; font-size: 12px; padding: 5px 12px; border-radius: 20px; font-weight: 500; }
            
            /* Simple list for languages/certs */
            .simple-item { font-size: 13.5px; color: #444; margin-bottom: 8px; border-bottom: 1px dashed #E8E8EE; padding-bottom: 5px; }
            
            .section { margin-bottom: 35px; }
        </style>
    </head>
    <body>
        <div class="header-bar"></div>
        <div class="header">
            <h1>${cv.name}</h1>
            <div class="contact-row">
                ${renderContactItem(ICONS.email, cv.email)}
                ${renderContactItem(ICONS.phone, cv.phone)}
                ${renderContactItem(ICONS.linkedin, cv.linkedin)}
            </div>
        </div>

        <div class="container">
            ${cv.summary ? `<div class="summary">${cv.summary.replace(/\\n/g, '<br/>')}</div>` : ''}

            <div class="grid">
                <div class="col-main">
                    ${cv.experience.length ? `
                    <div class="section">
                        <h2>Experience</h2>
                        ${cv.experience.map(e => `
                        <div class="entry">
                            <div class="entry-header">
                                <div>
                                    <div class="entry-role">${e.role}</div>
                                    <div class="entry-company">${e.company}</div>
                                </div>
                                <div class="entry-date">${e.duration}</div>
                            </div>
                            <p class="entry-desc">${e.description.replace(/\\n/g, '<br/>')}</p>
                        </div>
                        `).join('')}
                    </div>` : ''}

                    ${cv.education.length ? `
                    <div class="section">
                        <h2>Education</h2>
                        ${cv.education.map(e => `
                        <div class="entry" style="margin-bottom: 15px;">
                            <div class="entry-header" style="margin-bottom: 0;">
                                <div>
                                    <div class="entry-role">${e.degree}</div>
                                    <div class="entry-company">${e.institution}</div>
                                </div>
                                <div class="entry-date">${e.year}</div>
                            </div>
                        </div>
                        `).join('')}
                    </div>` : ''}

                    ${cv.projects.length ? `
                    <div class="section">
                        <h2>Projects</h2>
                        ${cv.projects.map(p => `
                        <div class="entry">
                            <div class="entry-role" style="margin-bottom: 5px;">${p.name}</div>
                            <p class="entry-desc" style="margin-top: 0;">${p.description.replace(/\\n/g, '<br/>')}</p>
                        </div>
                        `).join('')}
                    </div>` : ''}
                </div>

                <div class="col-side">
                    ${cv.skills.length ? `
                    <div class="section">
                        <h2>Skills</h2>
                        <div class="tags">
                            ${cv.skills.map(s => `<span class="tag">${s}</span>`).join('')}
                        </div>
                    </div>` : ''}

                    ${cv.languages.length ? `
                    <div class="section">
                        <h2>Languages</h2>
                        <div>
                            ${cv.languages.map(l => `<div class="simple-item">${l}</div>`).join('')}
                        </div>
                    </div>` : ''}

                    ${cv.certifications.length ? `
                    <div class="section">
                        <h2>Certifications</h2>
                        <div>
                            ${cv.certifications.map(c => `<div class="simple-item">${c}</div>`).join('')}
                        </div>
                    </div>` : ''}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

// --- Option A: Minimal White ---
function minimalTemplate(cv: CVData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            @page { margin: 0; size: A4; }
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 50px; color: #1A1A1A; background: #FFFFFF; }
            
            /* Header */
            .header { border-bottom: 1px solid #E8E8EE; padding-bottom: 25px; margin-bottom: 30px; }
            .header h1 { font-size: 34px; font-weight: 700; margin: 0 0 12px 0; color: #1A1A1A; letter-spacing: -0.5px; }
            
            .contact-row { display: flex; flex-wrap: wrap; gap: 20px; }
            .contact-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; font-weight: 400; }
            .contact-item svg { width: 14px; height: 14px; color: #1A1A1A; opacity: 0.6; }
            
            /* Summary */
            .summary-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6C63FF; letter-spacing: 1px; margin-bottom: 10px; }
            .summary { font-size: 14px; line-height: 1.6; color: #444; margin-bottom: 40px; }
            
            /* Sections */
            .section { margin-bottom: 35px; }
            .section-title { font-size: 16px; font-weight: 600; color: #1A1A1A; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 1px solid #E8E8EE; }
            
            /* Entries (Left date, Right content layout) */
            .entry { display: flex; margin-bottom: 25px; }
            .entry-left { width: 130px; flex-shrink: 0; font-size: 12px; color: #6C63FF; font-weight: 500; margin-top: 3px; }
            .entry-right { flex: 1; }
            .entry-role { font-weight: 600; font-size: 15px; color: #1A1A1A; margin-bottom: 3px; }
            .entry-company { color: #555; font-size: 13.5px; font-weight: 400; margin-bottom: 10px; }
            .entry-desc { font-size: 13.5px; line-height: 1.6; color: #444; margin: 0; }
            
            /* Tag layout for skills/langs */
            .tag-list { display: flex; flex-wrap: wrap; gap: 10px; }
            .tag-item { font-size: 13.5px; color: #333; display: flex; align-items: center; }
            .tag-item:not(:last-child)::after { content: "•"; color: #D1D1D6; margin-left: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${cv.name}</h1>
            <div class="contact-row">
                ${renderContactItem(ICONS.email, cv.email)}
                ${renderContactItem(ICONS.phone, cv.phone)}
                ${renderContactItem(ICONS.linkedin, cv.linkedin)}
            </div>
        </div>

        ${cv.summary ? `
        <div>
            <div class="summary-title">Profile</div>
            <div class="summary">${cv.summary.replace(/\\n/g, '<br/>')}</div>
        </div>` : ''}

        ${cv.experience.length ? `
        <div class="section">
            <h2 class="section-title">Experience</h2>
            ${cv.experience.map(e => `
            <div class="entry">
                <div class="entry-left">${e.duration}</div>
                <div class="entry-right">
                    <div class="entry-role">${e.role}</div>
                    <div class="entry-company">${e.company}</div>
                    <p class="entry-desc">${e.description.replace(/\\n/g, '<br/>')}</p>
                </div>
            </div>
            `).join('')}
        </div>` : ''}

        ${cv.education.length ? `
        <div class="section">
            <h2 class="section-title">Education</h2>
            ${cv.education.map(e => `
            <div class="entry">
                <div class="entry-left">${e.year}</div>
                <div class="entry-right">
                    <div class="entry-role">${e.degree}</div>
                    <div class="entry-company">${e.institution}</div>
                </div>
            </div>
            `).join('')}
        </div>` : ''}

        ${cv.skills.length ? `
        <div class="section">
            <h2 class="section-title">Skills</h2>
            <div class="tag-list">
                ${cv.skills.map(s => `<span class="tag-item">${s}</span>`).join('')}
            </div>
        </div>` : ''}

        ${cv.languages.length ? `
        <div class="section">
            <h2 class="section-title">Languages</h2>
            <div class="tag-list">
                ${cv.languages.map(l => `<span class="tag-item">${l}</span>`).join('')}
            </div>
        </div>` : ''}

        ${cv.projects.length ? `
        <div class="section">
            <h2 class="section-title">Projects</h2>
            ${cv.projects.map(p => `
            <div class="entry" style="margin-bottom: 20px;">
                <div class="entry-right" style="margin-left: 130px;">
                    <div class="entry-role" style="margin-bottom: 8px;">${p.name}</div>
                    <p class="entry-desc">${p.description.replace(/\\n/g, '<br/>')}</p>
                </div>
            </div>
            `).join('')}
        </div>` : ''}

        ${cv.certifications.length ? `
        <div class="section">
            <h2 class="section-title">Certifications</h2>
            <div class="tag-list" style="margin-left: 130px;">
                ${cv.certifications.map(c => `<span class="tag-item">${c}</span>`).join('')}
            </div>
        </div>` : ''}

    </body>
    </html>
    `;
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
