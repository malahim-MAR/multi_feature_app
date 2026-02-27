import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Image,
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
    getAllLabels,
    getArchivedNotes,
    Label,
    moveToTrash,
    Note,
    unarchiveNote,
} from '../../../services/notesStorage';

export default function ArchiveScreen() {
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const [archived, allLabels] = await Promise.all([getArchivedNotes(), getAllLabels()]);
        setNotes(archived);
        setLabels(allLabels);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const onRefresh = async () => {
        setRefreshing(true); await load(); setRefreshing(false);
    };

    const handleRestore = async (id: string) => {
        await unarchiveNote(id); await load();
    };

    const handleDelete = (note: Note) => {
        Alert.alert('Move to Trash', `Move "${note.title}" to trash?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Move to Trash', style: 'destructive', onPress: async () => { await moveToTrash(note.id); await load(); } },
        ]);
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Archive</Text>
                <View style={{ width: 24 }} />
            </View>

            {notes.length === 0 ? (
                <View style={s.empty}>
                    <View style={s.emptyIconBg}><Ionicons name="archive-outline" size={44} color={Colors.primary + '80'} /></View>
                    <Text style={s.emptyTitle}>No archived notes</Text>
                    <Text style={s.emptySub}>Swipe right on any note to archive it</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                >
                    <Text style={s.count}>{notes.length} archived note{notes.length !== 1 ? 's' : ''}</Text>
                    {notes.map((note) => {
                        const noteLabels = labels.filter((l) => note.labels?.includes(l.id));
                        const reminderPassed = note.reminder && new Date(note.reminder.date) < new Date();
                        const chipColor = reminderPassed ? '#FF4757' : Colors.primary;
                        const chipBg = reminderPassed ? '#FFF0F0' : Colors.primary + '18';
                        return (
                            <TouchableOpacity
                                key={note.id}
                                style={[s.card, { backgroundColor: note.color || '#FFFFFF' }]}
                                onPress={() => router.push({ pathname: '/notes/editor', params: { id: note.id } } as any)}
                                activeOpacity={0.85}
                            >
                                {note.images?.length > 0 && (
                                    <Image source={{ uri: note.images[0] }} style={s.cardImage} resizeMode="cover" />
                                )}
                                <View style={s.cardRow}>
                                    <Text style={s.cardTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                                    <TouchableOpacity onPress={() => handleRestore(note.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 8 }}>
                                        <Ionicons name="refresh-outline" size={18} color={Colors.secondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(note)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 8 }}>
                                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                                {note.isChecklist
                                    ? (note.checklistItems || []).slice(0, 3).map((item) => (
                                        <View key={item.id} style={s.clRow}>
                                            <Ionicons name={item.checked ? 'checkbox' : 'square-outline'} size={14} color={item.checked ? Colors.primary : Colors.textSecondary} style={{ marginRight: 6 }} />
                                            <Text style={[s.clText, item.checked && s.clDone]} numberOfLines={1}>{item.text}</Text>
                                        </View>
                                    ))
                                    : <Text style={s.cardDesc} numberOfLines={2}>{note.description}</Text>
                                }
                                {note.reminder && (
                                    <View style={[s.chip, { backgroundColor: chipBg }]}>
                                        <Ionicons name="notifications" size={12} color={chipColor} />
                                        <Text style={[s.chipText, { color: chipColor }]}>
                                            {new Date(note.reminder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                )}
                                {noteLabels.length > 0 && (
                                    <View style={s.labelRow}>
                                        {noteLabels.slice(0, 3).map((l) => (
                                            <View key={l.id} style={s.labelChip}><Text style={s.labelChipText}>{l.name}</Text></View>
                                        ))}
                                    </View>
                                )}
                                <Text style={s.cardDate}>{formatLastEdited(note.updatedAt)}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { ...Typography.headingSmall, fontSize: 20 },
    list: { padding: Spacing.lg, paddingBottom: 40 },
    count: { ...Typography.label, marginBottom: Spacing.md },
    card: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.card },
    cardImage: { width: '100%', height: 120, borderRadius: Radius.md, marginBottom: Spacing.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    cardTitle: { ...Typography.headingSmall, fontSize: 15, flex: 1 },
    cardDesc: { ...Typography.bodySmall, marginBottom: Spacing.xs },
    cardDate: { ...Typography.label, fontSize: 11, textAlign: 'right', marginTop: 4 },
    clRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    clText: { ...Typography.bodySmall, fontSize: 13, flex: 1 },
    clDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
    chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginTop: Spacing.xs, gap: 4 },
    chipText: { fontFamily: 'Poppins_500Medium', fontSize: 11 },
    labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
    labelChip: { backgroundColor: Colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
    labelChipText: { ...Typography.label, fontSize: 11, color: Colors.primary },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
    emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    emptyTitle: { ...Typography.headingSmall, fontSize: 18, textAlign: 'center', marginBottom: 8 },
    emptySub: { ...Typography.bodySmall, textAlign: 'center' },
});
