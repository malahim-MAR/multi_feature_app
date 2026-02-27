import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    PanResponder,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import {
    addRecentSearch,
    archiveNote,
    bulkAddLabel,
    bulkArchive,
    bulkMoveToTrash,
    bulkPin,
    clearRecentSearches,
    formatLastEdited,
    getAllLabels,
    getAllNotes,
    getRecentSearches,
    Label,
    moveToTrash,
    Note,
    restoreFromTrash,
    togglePin
} from '../../../services/notesStorage';
import { cancelReminder, setupNotificationResponseListener } from '../../../services/notificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────
//  Pastel Note Card Colors
// ─────────────────────────────────────────────
const CARD_BORDER: Record<string, string> = {
    '#FFFFFF': '#E8E8EE',
    '#FFF9C4': '#F9E77E',
    '#DCEDC8': '#AED581',
    '#E1F5FE': '#81D4FA',
    '#FCE4EC': '#F48FB1',
    '#EDE7F6': '#CE93D8',
    '#FFF3E0': '#FFCC80',
    '#E8F5E9': '#A5D6A7',
    '#F3E5F5': '#CE93D8',
    '#E0F2F1': '#80CBC4',
};

// ─────────────────────────────────────────────
//  Swipeable Note Card
// ─────────────────────────────────────────────

interface SwipeableCardProps {
    note: Note;
    labels: Label[];
    selected: boolean;
    multiSelect: boolean;
    onPress: () => void;
    onLongPress: () => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onToggleSelect: (id: string) => void;
    onTogglePin: (id: string) => void;
}

function SwipeableCard({
    note,
    labels,
    selected,
    multiSelect,
    onPress,
    onLongPress,
    onDelete,
    onArchive,
    onToggleSelect,
    onTogglePin,
}: SwipeableCardProps) {
    const translateX = useRef(new Animated.Value(0)).current;
    const [swiping, setSwiping] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_e, gs) =>
                !multiSelect && Math.abs(gs.dx) > 10 && Math.abs(gs.dy) < 20,
            onPanResponderMove: (_e, gs) => {
                setSwiping(true);
                translateX.setValue(gs.dx);
            },
            onPanResponderRelease: (_e, gs) => {
                setSwiping(false);
                if (gs.dx < -80) {
                    // Swipe left → delete
                    Animated.timing(translateX, {
                        toValue: -SCREEN_WIDTH,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onDelete(note.id);
                        translateX.setValue(0);
                    });
                } else if (gs.dx > 80) {
                    // Swipe right → archive
                    Animated.timing(translateX, {
                        toValue: SCREEN_WIDTH,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onArchive(note.id);
                        translateX.setValue(0);
                    });
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const reminderPassed =
        note.reminder && new Date(note.reminder.date) < new Date();
    const chipColor = reminderPassed ? '#FF4757' : '#6C63FF';
    const chipBg = reminderPassed ? '#FFF0F0' : '#F0EEFF';

    const noteLabels = labels.filter((l) => note.labels?.includes(l.id));

    return (
        <View style={styles.swipeContainer}>
            {/* Delete hint (left swipe) */}
            <View style={[styles.swipeHint, styles.swipeHintLeft]}>
                <Ionicons name="trash" size={22} color="#fff" />
                <Text style={styles.swipeHintText}>Delete</Text>
            </View>
            {/* Archive hint (right swipe) */}
            <View style={[styles.swipeHint, styles.swipeHintRight]}>
                <Ionicons name="archive" size={22} color="#fff" />
                <Text style={styles.swipeHintText}>Archive</Text>
            </View>

            <Animated.View
                style={{ transform: [{ translateX }] }}
                {...(!multiSelect ? panResponder.panHandlers : {})}
            >
                <TouchableOpacity
                    activeOpacity={multiSelect ? 1 : 0.85}
                    onPress={() => (multiSelect ? onToggleSelect(note.id) : onPress())}
                    onLongPress={onLongPress}
                    delayLongPress={350}
                    style={[
                        styles.card,
                        {
                            backgroundColor: note.color || '#FFFFFF',
                            borderColor: CARD_BORDER[note.color] || '#E8E8EE',
                        },
                        selected && styles.cardSelected,
                    ]}
                >
                    {/* Image preview */}
                    {note.images?.length > 0 && (
                        <Image
                            source={{ uri: note.images[0] }}
                            style={styles.cardImage}
                            resizeMode="cover"
                        />
                    )}

                    {/* Card header */}
                    <View style={styles.cardHeader}>
                        {multiSelect ? (
                            <View style={styles.checkboxOuter}>
                                {selected && (
                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                )}
                            </View>
                        ) : null}
                        <Text style={styles.cardTitle} numberOfLines={1}>
                            {note.title || 'Untitled'}
                        </Text>
                        <View style={styles.cardHeaderIcons}>
                            {note.pinned && (
                                <Ionicons
                                    name="pin"
                                    size={14}
                                    color={Colors.primary}
                                    style={{ marginLeft: 4 }}
                                />
                            )}
                            {!multiSelect && (
                                <TouchableOpacity
                                    onPress={() => onTogglePin(note.id)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ marginLeft: 6 }}
                                >
                                    <Ionicons
                                        name={note.pinned ? 'pin' : 'pin-outline'}
                                        size={16}
                                        color={note.pinned ? Colors.primary : Colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Content preview */}
                    {note.isChecklist ? (
                        <View style={{ marginBottom: Spacing.xs }}>
                            {(note.checklistItems || []).slice(0, 4).map((item) => (
                                <View key={item.id} style={styles.checklistRow}>
                                    <Ionicons
                                        name={item.checked ? 'checkbox' : 'square-outline'}
                                        size={15}
                                        color={item.checked ? Colors.primary : Colors.textSecondary}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text
                                        style={[
                                            styles.checklistText,
                                            item.checked && styles.checklistTextDone,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.text}
                                    </Text>
                                </View>
                            ))}
                            {(note.checklistItems || []).length > 4 && (
                                <Text style={styles.moreItems}>
                                    +{note.checklistItems.length - 4} more items
                                </Text>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.cardDescription} numberOfLines={2}>
                            {note.description}
                        </Text>
                    )}

                    {/* Reminder chip */}
                    {note.reminder && (
                        <View style={[styles.reminderChip, { backgroundColor: chipBg }]}>
                            <Ionicons name="notifications" size={12} color={chipColor} />
                            <Text style={[styles.reminderChipText, { color: chipColor }]}>
                                {new Date(note.reminder.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                })}{' '}
                                {new Date(note.reminder.date).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                        </View>
                    )}

                    {/* Labels */}
                    {noteLabels.length > 0 && (
                        <View style={styles.labelRow}>
                            {noteLabels.slice(0, 3).map((lbl) => (
                                <View key={lbl.id} style={styles.labelChip}>
                                    <Text style={styles.labelChipText}>{lbl.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Footer */}
                    <Text style={styles.cardDate}>{formatLastEdited(note.updatedAt)}</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

// ─────────────────────────────────────────────
//  Snackbar
// ─────────────────────────────────────────────
interface SnackbarProps {
    message: string;
    onUndo: () => void;
    visible: boolean;
}
function Snackbar({ message, onUndo, visible }: SnackbarProps) {
    if (!visible) return null;
    return (
        <View style={styles.snackbar}>
            <Text style={styles.snackbarText}>{message}</Text>
            <TouchableOpacity onPress={onUndo}>
                <Text style={styles.snackbarUndo}>UNDO</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─────────────────────────────────────────────
//  Section Header
// ─────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );
}

// ─────────────────────────────────────────────
//  Empty State
// ─────────────────────────────────────────────
function EmptyState({ icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
                <Ionicons name={icon} size={44} color={Colors.primary + '80'} />
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
        </View>
    );
}

// ─────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────

type FilterChip = 'All' | 'Pinned' | 'Reminder' | 'Checklist' | 'Image';
type SortMode = 'date_modified' | 'date_created' | 'title_az';

export default function NotesScreen() {
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [search, setSearch] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Multi-select
    const [multiSelectMode, setMultiSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filter / Sort
    const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
    const [sortMode, setSortMode] = useState<SortMode>('date_modified');
    const [showSortModal, setShowSortModal] = useState(false);

    // FAB
    const [fabOpen, setFabOpen] = useState(false);
    const fabAnim = useRef(new Animated.Value(0)).current;

    // Snackbar (undo delete/archive)
    const [snackVisible, setSnackVisible] = useState(false);
    const [snackMsg, setSnackMsg] = useState('');
    const [deletedNoteCache, setDeletedNoteCache] = useState<Note | null>(null);
    const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Labels multi-select modal
    const [showLabelModal, setShowLabelModal] = useState(false);

    // ── Load ──────────────────────────────────
    const load = useCallback(async () => {
        const [allNotes, allLabels, searches] = await Promise.all([
            getAllNotes(),
            getAllLabels(),
            getRecentSearches(),
        ]);
        setNotes(allNotes);
        setLabels(allLabels);
        setRecentSearches(searches);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    useEffect(() => {
        const sub = setupNotificationResponseListener((noteId) => {
            router.push({ pathname: '/notes/editor', params: { id: noteId } } as any);
        });
        return () => sub.remove();
    }, [router]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    // ── FAB toggle ────────────────────────────
    const toggleFab = () => {
        const toValue = fabOpen ? 0 : 1;
        Animated.spring(fabAnim, {
            toValue,
            useNativeDriver: true,
            friction: 6,
        }).start();
        setFabOpen(!fabOpen);
    };

    // ── Selection logic ───────────────────────
    const enterMultiSelect = (id: string) => {
        setMultiSelectMode(true);
        setSelectedIds(new Set([id]));
    };

    const toggleSelectId = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            if (next.size === 0) setMultiSelectMode(false);
            return next;
        });
    };

    const exitMultiSelect = () => {
        setMultiSelectMode(false);
        setSelectedIds(new Set());
    };

    // ── Snackbar helpers ──────────────────────
    const showSnack = (msg: string, note?: Note) => {
        if (snackTimer.current) clearTimeout(snackTimer.current);
        setSnackMsg(msg);
        if (note) setDeletedNoteCache(note);
        setSnackVisible(true);
        snackTimer.current = setTimeout(() => {
            setSnackVisible(false);
            setDeletedNoteCache(null);
        }, 5000);
    };

    const handleUndo = async () => {
        if (deletedNoteCache) {
            await restoreFromTrash(deletedNoteCache.id);
            setSnackVisible(false);
            setDeletedNoteCache(null);
            await load();
        }
    };

    // ── Actions ───────────────────────────────
    const handleDelete = async (id: string) => {
        const note = notes.find((n) => n.id === id);
        if (note?.reminder?.notificationId) {
            await cancelReminder(note.reminder.notificationId);
        }
        await moveToTrash(id);
        await load();
        showSnack('Note moved to trash', note);
    };

    const handleArchive = async (id: string) => {
        const note = notes.find((n) => n.id === id);
        await archiveNote(id);
        await load();
        showSnack('Note archived', note);
    };

    const handleTogglePin = async (id: string) => {
        await togglePin(id);
        await load();
    };

    // ── Bulk actions ──────────────────────────
    const handleBulkDelete = async () => {
        await bulkMoveToTrash(Array.from(selectedIds));
        exitMultiSelect();
        await load();
        showSnack(`${selectedIds.size} note(s) moved to trash`);
    };

    const handleBulkArchive = async () => {
        await bulkArchive(Array.from(selectedIds));
        exitMultiSelect();
        await load();
        showSnack(`${selectedIds.size} note(s) archived`);
    };

    const handleBulkPin = async () => {
        await bulkPin(Array.from(selectedIds));
        exitMultiSelect();
        await load();
    };

    const handleBulkAddLabel = async (labelId: string) => {
        await bulkAddLabel(Array.from(selectedIds), labelId);
        setShowLabelModal(false);
        exitMultiSelect();
        await load();
    };

    // ── Search ────────────────────────────────
    const handleSearchSubmit = () => {
        if (search.trim()) {
            addRecentSearch(search.trim());
            setRecentSearches((prev) => [search.trim(), ...prev.filter(s => s !== search.trim())].slice(0, 5));
        }
        setShowSearchSuggestions(false);
    };

    const handleRecentSearchTap = (s: string) => {
        setSearch(s);
        setShowSearchSuggestions(false);
    };

    const handleClearRecents = async () => {
        await clearRecentSearches();
        setRecentSearches([]);
    };

    // ── Filter & Sort ─────────────────────────
    const processed = useMemo(() => {
        let list = [...notes];
        // Filter by search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (n) =>
                    n.title.toLowerCase().includes(q) ||
                    n.description.toLowerCase().includes(q) ||
                    (n.labels || []).some((lid) =>
                        labels.find((l) => l.id === lid)?.name.toLowerCase().includes(q)
                    )
            );
        }
        // Filter by chip
        if (activeFilter === 'Pinned') list = list.filter((n) => n.pinned);
        if (activeFilter === 'Reminder') list = list.filter((n) => !!n.reminder);
        if (activeFilter === 'Checklist') list = list.filter((n) => n.isChecklist);
        if (activeFilter === 'Image') list = list.filter((n) => n.images?.length > 0);
        // Sort
        list.sort((a, b) => {
            if (sortMode === 'date_modified') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            if (sortMode === 'date_created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return a.title.localeCompare(b.title);
        });
        return list;
    }, [notes, search, activeFilter, sortMode, labels]);

    const pinnedNotes = processed.filter((n) => n.pinned);
    const otherNotes = processed.filter((n) => !n.pinned);

    // ── Render ────────────────────────────────
    const filterChips: FilterChip[] = ['All', 'Pinned', 'Reminder', 'Checklist', 'Image'];
    const sortLabels: { key: SortMode; label: string }[] = [
        { key: 'date_modified', label: 'Date Modified' },
        { key: 'date_created', label: 'Date Created' },
        { key: 'title_az', label: 'Title A–Z' },
    ];

    const fabRotation = fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
    const fabOption1Y = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -190] });
    const fabOption2Y = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -130] });
    const fabOption3Y = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
    const fabOpacity = fabAnim;

    const renderNoteCard = (item: Note) => (
        <SwipeableCard
            key={item.id}
            note={item}
            labels={labels}
            selected={selectedIds.has(item.id)}
            multiSelect={multiSelectMode}
            onPress={() => router.push({ pathname: '/notes/editor', params: { id: item.id } } as any)}
            onLongPress={() => enterMultiSelect(item.id)}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onToggleSelect={toggleSelectId}
            onTogglePin={handleTogglePin}
        />
    );

    return (
        <View style={styles.container}>
            {/* ── Multi-Select Toolbar ── */}
            {multiSelectMode ? (
                <View style={styles.multiSelectBar}>
                    <TouchableOpacity onPress={exitMultiSelect} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.multiSelectCount}>{selectedIds.size} selected</Text>
                    <View style={styles.multiSelectActions}>
                        <TouchableOpacity onPress={handleBulkPin} style={styles.msAction}>
                            <Ionicons name="pin-outline" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowLabelModal(true)} style={styles.msAction}>
                            <Ionicons name="pricetag-outline" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleBulkArchive} style={styles.msAction}>
                            <Ionicons name="archive-outline" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleBulkDelete} style={styles.msAction}>
                            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                /* ── Normal Header ── */
                <View style={styles.header}>
                    <Text style={styles.title}>Notes</Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => router.push('/notes/labels' as any)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="pricetag-outline" size={22} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/notes/archive' as any)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ marginLeft: 14 }}
                        >
                            <Ionicons name="archive-outline" size={22} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/notes/trash' as any)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ marginLeft: 14 }}
                        >
                            <Ionicons name="trash-outline" size={22} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── Search Bar ── */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notes, labels..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                        onFocus={() => setShowSearchSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 150)}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Recent search suggestions dropdown */}
                {showSearchSuggestions && search.length === 0 && recentSearches.length > 0 && (
                    <View style={styles.suggestionsBox}>
                        <View style={styles.suggestionsHeader}>
                            <Text style={styles.suggestionsTitle}>Recent</Text>
                            <TouchableOpacity onPress={handleClearRecents}>
                                <Text style={styles.clearText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                        {recentSearches.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={styles.suggestionRow}
                                onPress={() => handleRecentSearchTap(s)}
                            >
                                <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
                                <Text style={styles.suggestionText}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* ── Filter Chips + Sort ── */}
            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {filterChips.map((chip) => (
                        <TouchableOpacity
                            key={chip}
                            style={[styles.filterChip, activeFilter === chip && styles.filterChipActive]}
                            onPress={() => setActiveFilter(chip)}
                        >
                            <Text style={[styles.filterChipText, activeFilter === chip && styles.filterChipTextActive]}>
                                {chip}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
                    <Ionicons name="funnel-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* ── Notes List ── */}
            {processed.length === 0 ? (
                <EmptyState
                    icon="document-text-outline"
                    title={search ? `No notes found for "${search}"` : 'No notes yet'}
                    subtitle={search ? undefined : 'Tap + to add your first note'}
                />
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                >
                    {pinnedNotes.length > 0 && activeFilter !== 'All' ? null : (
                        <>
                            {pinnedNotes.length > 0 && <SectionHeader title="📌 Pinned" />}
                            {pinnedNotes.map(renderNoteCard)}
                            {otherNotes.length > 0 && pinnedNotes.length > 0 && (
                                <SectionHeader title="Others" />
                            )}
                        </>
                    )}
                    {otherNotes.map(renderNoteCard)}
                </ScrollView>
            )}

            {/* ── FAB ── */}
            {!multiSelectMode && (
                <View style={styles.fabContainer} pointerEvents="box-none">
                    {/* Backdrop */}
                    {fabOpen && (
                        <TouchableWithoutFeedback onPress={toggleFab}>
                            <View style={StyleSheet.absoluteFillObject} />
                        </TouchableWithoutFeedback>
                    )}

                    {/* Options */}
                    {[
                        { label: 'New Image Note', icon: 'image-outline', y: fabOption1Y, mode: 'image' },
                        { label: 'New Checklist', icon: 'checkbox-outline', y: fabOption2Y, mode: 'checklist' },
                        { label: 'New Note', icon: 'document-text-outline', y: fabOption3Y, mode: 'note' },
                    ].map((opt) => (
                        <Animated.View
                            key={opt.mode}
                            style={[
                                styles.fabOption,
                                { opacity: fabOpacity, transform: [{ translateY: opt.y }] },
                            ]}
                            pointerEvents={fabOpen ? 'auto' : 'none'}
                        >
                            <TouchableOpacity
                                style={styles.fabOptionBtn}
                                onPress={() => {
                                    toggleFab();
                                    router.push({
                                        pathname: '/notes/editor',
                                        params: { mode: opt.mode },
                                    } as any);
                                }}
                            >
                                <Ionicons name={opt.icon as any} size={18} color={Colors.primary} />
                            </TouchableOpacity>
                            <View style={styles.fabOptionLabel}>
                                <Text style={styles.fabOptionLabelText}>{opt.label}</Text>
                            </View>
                        </Animated.View>
                    ))}

                    {/* Main FAB */}
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => {
                            if (fabOpen) { toggleFab(); return; }
                            router.push('/notes/editor' as any);
                        }}
                        onLongPress={toggleFab}
                        delayLongPress={300}
                        activeOpacity={0.85}
                    >
                        <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
                            <Ionicons name="add" size={28} color="#fff" />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Snackbar ── */}
            <Snackbar message={snackMsg} onUndo={handleUndo} visible={snackVisible} />

            {/* ── Sort Modal ── */}
            <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
                <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.sortModal}>
                                <Text style={styles.sortModalTitle}>Sort By</Text>
                                {sortLabels.map((s) => (
                                    <TouchableOpacity
                                        key={s.key}
                                        style={[styles.sortOption, sortMode === s.key && styles.sortOptionActive]}
                                        onPress={() => { setSortMode(s.key); setShowSortModal(false); }}
                                    >
                                        <Text style={[styles.sortOptionText, sortMode === s.key && styles.sortOptionTextActive]}>
                                            {s.label}
                                        </Text>
                                        {sortMode === s.key && (
                                            <Ionicons name="checkmark" size={18} color={Colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* ── Label Select Modal (bulk) ── */}
            <Modal visible={showLabelModal} transparent animationType="fade" onRequestClose={() => setShowLabelModal(false)}>
                <TouchableWithoutFeedback onPress={() => setShowLabelModal(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.sortModal}>
                                <Text style={styles.sortModalTitle}>Add Label</Text>
                                {labels.length === 0 ? (
                                    <Text style={styles.emptySubtitle}>No labels yet. Create one in Labels.</Text>
                                ) : (
                                    labels.map((lbl) => (
                                        <TouchableOpacity
                                            key={lbl.id}
                                            style={styles.sortOption}
                                            onPress={() => handleBulkAddLabel(lbl.id)}
                                        >
                                            <Ionicons name="pricetag-outline" size={16} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                                            <Text style={styles.sortOptionText}>{lbl.name}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

// ─────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    /* Header */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: Spacing.sm,
    },
    title: { ...Typography.heading, fontSize: 28 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },

    /* Multi-select bar */
    multiSelectBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: Spacing.sm,
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    multiSelectCount: {
        ...Typography.headingSmall,
        fontSize: 16,
        flex: 1,
        marginLeft: Spacing.md,
    },
    multiSelectActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    msAction: { padding: 8 },

    /* Search */
    searchWrapper: { paddingHorizontal: Spacing.lg, marginBottom: 4, zIndex: 99 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    suggestionsBox: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
        zIndex: 999,
        marginHorizontal: 0,
    },
    suggestionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xs,
    },
    suggestionsTitle: { ...Typography.label, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
    clearText: { ...Typography.label, fontSize: 11, color: Colors.primary },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: 10,
    },
    suggestionText: { ...Typography.bodySmall, color: Colors.textPrimary },

    /* Filter */
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    filterScroll: { paddingHorizontal: Spacing.lg, gap: 8 },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: Radius.full,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterChipText: { ...Typography.label, fontSize: 13, color: Colors.textSecondary },
    filterChipTextActive: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
    sortButton: {
        padding: 8,
        backgroundColor: Colors.card,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: Spacing.md,
    },

    /* List */
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

    /* Section header */
    sectionHeader: { paddingVertical: Spacing.xs, marginBottom: 4, marginTop: 2 },
    sectionHeaderText: { ...Typography.label, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

    /* Swipe */
    swipeContainer: { marginBottom: Spacing.sm },
    swipeHint: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 90,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Radius.lg,
        gap: 4,
    },
    swipeHintLeft: { right: 0, backgroundColor: Colors.danger },
    swipeHintRight: { left: 0, backgroundColor: Colors.secondary },
    swipeHintText: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 12 },

    /* Card */
    card: {
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1.5,
        ...Shadows.card,
    },
    cardSelected: {
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    cardImage: {
        width: '100%',
        height: 140,
        borderRadius: Radius.md,
        marginBottom: Spacing.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    cardTitle: { ...Typography.headingSmall, fontSize: 15, flex: 1 },
    cardHeaderIcons: { flexDirection: 'row', alignItems: 'center' },
    cardDescription: { ...Typography.bodySmall, marginBottom: Spacing.xs },
    cardDate: { ...Typography.label, fontSize: 11, textAlign: 'right', marginTop: 4 },

    /* Checklist preview */
    checklistRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    checklistText: { ...Typography.bodySmall, fontSize: 13, flex: 1 },
    checklistTextDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
    moreItems: { ...Typography.label, fontSize: 11, marginTop: 2, color: Colors.textSecondary },

    /* Checkbox (multi-select) */
    checkboxOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    /* Reminder chip */
    reminderChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.full,
        marginTop: Spacing.xs,
        gap: 4,
    },
    reminderChipText: { fontFamily: 'Poppins_500Medium', fontSize: 11 },

    /* Label chips */
    labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
    labelChip: {
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    labelChipText: { ...Typography.label, fontSize: 11, color: Colors.primary },

    /* Empty state */
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
    emptyIconBg: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: Colors.primary + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    emptyTitle: { ...Typography.headingSmall, fontSize: 18, textAlign: 'center', marginBottom: 8 },
    emptySubtitle: { ...Typography.bodySmall, textAlign: 'center' },

    /* FAB */
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        alignItems: 'flex-end',
    },
    fab: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.button,
    },
    fabOption: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    fabOptionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    fabOptionLabel: {
        position: 'absolute',
        right: 54,
        backgroundColor: Colors.textPrimary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.sm,
    },
    fabOptionLabelText: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 12 },

    /* Snackbar */
    snackbar: {
        position: 'absolute',
        bottom: 24,
        left: Spacing.lg,
        right: 90,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1A1A1A',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        borderRadius: Radius.lg,
        ...Shadows.card,
    },
    snackbarText: { color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13, flex: 1 },
    snackbarUndo: { color: Colors.secondary, fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginLeft: 12 },

    /* Sort / Label Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    sortModal: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        width: '100%',
        maxWidth: 360,
    },
    sortModalTitle: { ...Typography.headingSmall, fontSize: 17, marginBottom: Spacing.md },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderRadius: Radius.sm,
        paddingHorizontal: 4,
    },
    sortOptionActive: { backgroundColor: Colors.primary + '10' },
    sortOptionText: { ...Typography.body, fontSize: 15 },
    sortOptionTextActive: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
});
