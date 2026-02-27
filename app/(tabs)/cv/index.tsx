import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet, Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import { CVData, deleteCV, getAllCVs } from '../../../services/cvStorage';

export default function CVListScreen() {
    const router = useRouter();
    const [cvs, setCvs] = useState<CVData[]>([]);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                const all = await getAllCVs();
                setCvs(all);
            })();
        }, [])
    );

    const handleDelete = (cv: CVData) => {
        Alert.alert('Delete CV', `Delete "${cv.name || 'Untitled'}" CV?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => { await deleteCV(cv.id); setCvs(prev => prev.filter(c => c.id !== cv.id)); },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>CV Maker</Text>
                <TouchableOpacity onPress={() => router.push('/cv/editor' as any)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={Colors.white} />
                </TouchableOpacity>
            </View>

            {cvs.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="briefcase-outline" size={48} color={Colors.border} />
                    <Text style={styles.emptyText}>No CVs yet. Tap + to create one!</Text>
                </View>
            ) : (
                <FlatList
                    data={cvs}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => router.push({ pathname: '/cv/editor', params: { id: item.id } } as any)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardIcon}>
                                <Ionicons name="document-text" size={24} color={Colors.primary} />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.name || 'Untitled CV'}</Text>
                                <Text style={styles.cardSub}>
                                    {item.template.charAt(0).toUpperCase() + item.template.slice(1)} · Updated {new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                            </View>
                            <View style={styles.cardActions}>
                                <TouchableOpacity onPress={() => router.push({ pathname: '/cv/preview', params: { id: item.id } } as any)}>
                                    <Ionicons name="eye-outline" size={20} color={Colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item)}>
                                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
    },
    title: { ...Typography.heading, fontSize: 26 },
    addButton: {
        backgroundColor: Colors.primary, width: 40, height: 40, borderRadius: Radius.full,
        justifyContent: 'center', alignItems: 'center', ...Shadows.button,
    },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
        borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.border, ...Shadows.card,
    },
    cardIcon: {
        width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.card,
        justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.textPrimary },
    cardSub: { ...Typography.label, fontSize: 11, marginTop: 2 },
    cardActions: { flexDirection: 'row', gap: Spacing.md },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { ...Typography.bodySmall, marginTop: Spacing.md, textAlign: 'center' },
});
