import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import {
    formatLastEdited,
    getAllNotes,
    Note,
} from '../../../services/notesStorage';

export default function LabelNotesScreen() {
    const router = useRouter();
    const { labelId, labelName } = useLocalSearchParams<{ labelId: string; labelName: string }>();
    const [notes, setNotes] = useState<Note[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const all = await getAllNotes();
        setNotes(all.filter((n) => n.labels?.includes(labelId as string)));
    }, [labelId]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={s.headerTitle}>{labelName}</Text>
                    <Text style={s.headerSub}>{notes.length} note{notes.length !== 1 ? 's' : ''}</Text>
                </View>
            </View>

            {notes.length === 0 ? (
                <View style={s.empty}>
                    <View style={s.emptyIconBg}><Ionicons name="document-text-outline" size={44} color={Colors.primary + '80'} /></View>
                    <Text style={s.emptyTitle}>No notes with this label</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                >
                    {notes.map((note) => (
                        <TouchableOpacity
                            key={note.id}
                            style={[s.card, { backgroundColor: note.color || '#FFFFFF' }]}
                            onPress={() => router.push({ pathname: '/notes/editor', params: { id: note.id } } as any)}
                            activeOpacity={0.85}
                        >
                            <Text style={s.cardTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                            {note.isChecklist
                                ? (note.checklistItems || []).slice(0, 3).map((item) => (
                                    <View key={item.id} style={s.clRow}>
                                        <Ionicons name={item.checked ? 'checkbox' : 'square-outline'} size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                                        <Text style={[s.clText, item.checked && s.clDone]} numberOfLines={1}>{item.text}</Text>
                                    </View>
                                ))
                                : <Text style={s.cardDesc} numberOfLines={2}>{note.description}</Text>
                            }
                            <Text style={s.cardDate}>{formatLastEdited(note.updatedAt)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { ...Typography.headingSmall, fontSize: 20 },
    headerSub: { ...Typography.label, fontSize: 12 },
    list: { padding: Spacing.lg, paddingBottom: 40 },
    card: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.card },
    cardTitle: { ...Typography.headingSmall, fontSize: 15, marginBottom: 6 },
    cardDesc: { ...Typography.bodySmall, marginBottom: Spacing.xs },
    cardDate: { ...Typography.label, fontSize: 11, textAlign: 'right', marginTop: 4 },
    clRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    clText: { ...Typography.bodySmall, fontSize: 13, flex: 1 },
    clDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
    emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    emptyTitle: { ...Typography.headingSmall, fontSize: 18, textAlign: 'center' },
});
