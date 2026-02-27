import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet, Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import { deleteNote, getAllNotes, Note } from '../../../services/notesStorage';
import { cancelReminder, setupNotificationResponseListener } from '../../../services/notificationService';

export default function NotesScreen() {
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadNotes = useCallback(async () => {
        const allNotes = await getAllNotes();
        setNotes(allNotes);
    }, []);

    // Reload notes every time tab is focused
    useFocusEffect(
        useCallback(() => {
            loadNotes();
        }, [loadNotes])
    );

    // Listen for notification taps → open that note
    useEffect(() => {
        const sub = setupNotificationResponseListener((noteId) => {
            router.push({ pathname: '/notes/editor', params: { id: noteId } } as any);
        });
        return () => sub.remove();
    }, [router]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotes();
        setRefreshing(false);
    };

    const handleDelete = (note: Note) => {
        Alert.alert('Delete Note', `Delete "${note.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (note.reminder?.notificationId) {
                        await cancelReminder(note.reminder.notificationId);
                    }
                    await deleteNote(note.id);
                    await loadNotes();
                },
            },
        ]);
    };

    const filtered = search
        ? notes.filter(
            n =>
                n.title.toLowerCase().includes(search.toLowerCase()) ||
                n.description.toLowerCase().includes(search.toLowerCase())
        )
        : notes;

    const renderItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/notes/editor', params: { id: item.id } } as any)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardActions}>
                    {item.reminder && (
                        <Ionicons name="notifications" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                    )}
                    <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.cardDate}>
                {new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Notes</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => router.push('/settings' as any)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/notes/editor' as any)} style={styles.addButton}>
                        <Ionicons name="add" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={Colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search notes..."
                    placeholderTextColor={Colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Notes List */}
            {filtered.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={48} color={Colors.border} />
                    <Text style={styles.emptyText}>
                        {search ? 'No matching notes' : 'No notes yet. Tap + to create one!'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: 56,
        paddingBottom: Spacing.md,
    },
    title: {
        ...Typography.heading,
        fontSize: 26,
    },
    addButton: {
        backgroundColor: Colors.primary,
        width: 40,
        height: 40,
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.button,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        borderRadius: Radius.md,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    listContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    cardTitle: {
        ...Typography.headingSmall,
        fontSize: 16,
        flex: 1,
        marginRight: Spacing.sm,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardDescription: {
        ...Typography.bodySmall,
        marginBottom: Spacing.sm,
    },
    cardDate: {
        ...Typography.label,
        textAlign: 'right',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emptyText: {
        ...Typography.bodySmall,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
});
