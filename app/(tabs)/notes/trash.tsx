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
    emptyTrash,
    formatLastEdited,
    getTrashedNotes,
    Note,
    permanentlyDeleteNote,
    restoreFromTrash,
} from '../../../services/notesStorage';

const TRASH_TTL = 7;

function daysRemaining(deletedAt?: string): number {
    if (!deletedAt) return TRASH_TTL;
    const deleted = new Date(deletedAt);
    const expiry = new Date(deleted.getTime() + TRASH_TTL * 24 * 60 * 60 * 1000);
    const diff = expiry.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function TrashScreen() {
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const trashed = await getTrashedNotes();
        setNotes(trashed);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleRestore = async (id: string) => {
        await restoreFromTrash(id); await load();
    };

    const handlePermanentDelete = (note: Note) => {
        Alert.alert('Delete Forever', `Permanently delete "${note.title}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await permanentlyDeleteNote(note.id); await load(); } },
        ]);
    };

    const handleEmptyTrash = () => {
        Alert.alert('Empty Trash', `Permanently delete all ${notes.length} note(s)? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Empty Trash', style: 'destructive', onPress: async () => { await emptyTrash(); await load(); } },
        ]);
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Trash</Text>
                {notes.length > 0 ? (
                    <TouchableOpacity onPress={handleEmptyTrash} style={s.emptyBtn}>
                        <Text style={s.emptyBtnText}>Empty</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 56 }} />
                )}
            </View>

            {notes.length > 0 && (
                <View style={s.infoBanner}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
                    <Text style={s.infoBannerText}>Notes in trash are deleted after {TRASH_TTL} days</Text>
                </View>
            )}

            {notes.length === 0 ? (
                <View style={s.empty}>
                    <View style={s.emptyIconBg}><Ionicons name="trash-outline" size={44} color={Colors.primary + '80'} /></View>
                    <Text style={s.emptyTitle}>Trash is empty</Text>
                    <Text style={s.emptySub}>Deleted notes appear here</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                >
                    {notes.map((note) => {
                        const days = daysRemaining(note.deletedAt);
                        const urgent = days <= 2;
                        return (
                            <View key={note.id} style={[s.card, { backgroundColor: note.color || '#FFFFFF' }]}>
                                {note.images?.length > 0 && (
                                    <Image source={{ uri: note.images[0] }} style={s.cardImage} resizeMode="cover" />
                                )}
                                <View style={s.cardRow}>
                                    <Text style={s.cardTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                                    <TouchableOpacity onPress={() => handleRestore(note.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 8 }}>
                                        <Ionicons name="refresh-outline" size={18} color={Colors.secondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handlePermanentDelete(note)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 8 }}>
                                        <Ionicons name="trash" size={18} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                                {note.isChecklist
                                    ? (note.checklistItems || []).slice(0, 2).map((item) => (
                                        <View key={item.id} style={s.clRow}>
                                            <Ionicons name={item.checked ? 'checkbox' : 'square-outline'} size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                                            <Text style={[s.clText, item.checked && s.clDone]} numberOfLines={1}>{item.text}</Text>
                                        </View>
                                    ))
                                    : <Text style={s.cardDesc} numberOfLines={2}>{note.description}</Text>
                                }
                                <View style={s.cardFooter}>
                                    <Text style={s.cardDate}>{formatLastEdited(note.updatedAt)}</Text>
                                    <View style={[s.dayChip, { backgroundColor: urgent ? Colors.danger + '18' : Colors.card }]}>
                                        <Text style={[s.dayChipText, { color: urgent ? Colors.danger : Colors.textSecondary }]}>
                                            {days === 0 ? 'Deletes today' : `${days}d remaining`}
                                        </Text>
                                    </View>
                                </View>
                            </View>
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
    emptyBtn: { backgroundColor: Colors.danger + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
    emptyBtnText: { ...Typography.label, fontSize: 13, color: Colors.danger, fontFamily: 'Poppins_600SemiBold' },
    infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warning + '18', padding: Spacing.md, gap: 8, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: Radius.md },
    infoBannerText: { ...Typography.bodySmall, flex: 1, color: '#7A5C00' },
    list: { padding: Spacing.lg, paddingBottom: 40 },
    card: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.card },
    cardImage: { width: '100%', height: 100, borderRadius: Radius.md, marginBottom: Spacing.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    cardTitle: { ...Typography.headingSmall, fontSize: 15, flex: 1 },
    cardDesc: { ...Typography.bodySmall, marginBottom: Spacing.xs },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    cardDate: { ...Typography.label, fontSize: 11 },
    clRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    clText: { ...Typography.bodySmall, fontSize: 13, flex: 1 },
    clDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
    dayChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
    dayChipText: { fontFamily: 'Poppins_500Medium', fontSize: 11 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
    emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    emptyTitle: { ...Typography.headingSmall, fontSize: 18, textAlign: 'center', marginBottom: 8 },
    emptySub: { ...Typography.bodySmall, textAlign: 'center' },
});
