import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
//  Types & Interfaces
// ─────────────────────────────────────────────

export interface NoteReminder {
    date: string; // ISO date string
    repeat: 'once' | 'daily' | 'weekly';
    notificationId?: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export interface Note {
    id: string;
    title: string;
    description: string;
    // Rich content
    isChecklist: boolean;
    checklistItems: ChecklistItem[];
    images: string[]; // local URIs
    color: string; // hex color
    // Meta
    reminder?: NoteReminder;
    labels: string[]; // label IDs
    pinned: boolean;
    archived: boolean;
    deleted: boolean;
    deletedAt?: string; // ISO string — when it was moved to trash
    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export interface Label {
    id: string;
    name: string;
    createdAt: string;
}

// ─────────────────────────────────────────────
//  Storage Keys
// ─────────────────────────────────────────────

const NOTES_KEY = '@notes_v3';
const LABELS_KEY = '@labels_v1';
const RECENT_SEARCHES_KEY = '@notes_recent_searches';

// Soft pastel palette
export const NOTE_COLORS = [
    '#FFFFFF', // Default white
    '#FFF9C4', // Yellow
    '#DCEDC8', // Green
    '#E1F5FE', // Blue
    '#FCE4EC', // Pink
    '#EDE7F6', // Lavender
    '#FFF3E0', // Orange
    '#E8F5E9', // Mint
    '#F3E5F5', // Lilac
    '#E0F2F1', // Teal
];

// ─────────────────────────────────────────────
//  Helper: Trash auto-cleanup (7 days)
// ─────────────────────────────────────────────

const TRASH_TTL_DAYS = 7;

const autoCleanTrash = (notes: Note[]): Note[] => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - TRASH_TTL_DAYS);
    return notes.filter((n) => {
        if (n.deleted && n.deletedAt) {
            return new Date(n.deletedAt) > cutoff;
        }
        return true;
    });
};

// ─────────────────────────────────────────────
//  Raw Storage Access
// ─────────────────────────────────────────────

const readAllRaw = async (): Promise<Note[]> => {
    try {
        const raw = await AsyncStorage.getItem(NOTES_KEY);
        const notes: Note[] = raw ? JSON.parse(raw) : [];
        return autoCleanTrash(notes);
    } catch {
        return [];
    }
};

const writeAll = async (notes: Note[]): Promise<void> => {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

// ─────────────────────────────────────────────
//  Public Note API
// ─────────────────────────────────────────────

/** Returns active (not archived, not deleted) notes */
export const getAllNotes = async (): Promise<Note[]> => {
    const notes = await readAllRaw();
    return notes.filter((n) => !n.archived && !n.deleted);
};

/** Returns archived notes */
export const getArchivedNotes = async (): Promise<Note[]> => {
    const notes = await readAllRaw();
    return notes.filter((n) => n.archived && !n.deleted);
};

/** Returns trashed notes */
export const getTrashedNotes = async (): Promise<Note[]> => {
    const notes = await readAllRaw();
    return notes.filter((n) => n.deleted);
};

/** Save (create or update) a note */
export const saveNote = async (note: Note): Promise<void> => {
    const notes = await readAllRaw();
    const idx = notes.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
        notes[idx] = note;
    } else {
        notes.unshift(note);
    }
    await writeAll(notes);
};

/** Get a single note by ID */
export const getNoteById = async (id: string): Promise<Note | null> => {
    const notes = await readAllRaw();
    return notes.find((n) => n.id === id) ?? null;
};

/** Soft delete → move to Trash */
export const moveToTrash = async (id: string): Promise<void> => {
    const notes = await readAllRaw();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx >= 0) {
        notes[idx] = {
            ...notes[idx],
            deleted: true,
            archived: false,
            deletedAt: new Date().toISOString(),
        };
        await writeAll(notes);
    }
};

/** Restore from Trash back to active */
export const restoreFromTrash = async (id: string): Promise<void> => {
    const notes = await readAllRaw();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx >= 0) {
        notes[idx] = { ...notes[idx], deleted: false, deletedAt: undefined };
        await writeAll(notes);
    }
};

/** Permanently delete a single note */
export const permanentlyDeleteNote = async (id: string): Promise<void> => {
    const notes = await readAllRaw();
    await writeAll(notes.filter((n) => n.id !== id));
};

/** Empty the entire trash */
export const emptyTrash = async (): Promise<void> => {
    const notes = await readAllRaw();
    await writeAll(notes.filter((n) => !n.deleted));
};

/** Archive a note */
export const archiveNote = async (id: string): Promise<void> => {
    const notes = await readAllRaw();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx >= 0) {
        notes[idx] = { ...notes[idx], archived: true, pinned: false };
        await writeAll(notes);
    }
};

/** Unarchive → back to active */
export const unarchiveNote = async (id: string): Promise<void> => {
    const notes = await readAllRaw();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx >= 0) {
        notes[idx] = { ...notes[idx], archived: false };
        await writeAll(notes);
    }
};

/** Toggle pin */
export const togglePin = async (id: string): Promise<void> => {
    const notes = await readAllRaw();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx >= 0) {
        notes[idx] = { ...notes[idx], pinned: !notes[idx].pinned };
        await writeAll(notes);
    }
};

/** Bulk operations */
export const bulkMoveToTrash = async (ids: string[]): Promise<void> => {
    const notes = await readAllRaw();
    const now = new Date().toISOString();
    const updated = notes.map((n) =>
        ids.includes(n.id) ? { ...n, deleted: true, archived: false, deletedAt: now } : n
    );
    await writeAll(updated);
};

export const bulkArchive = async (ids: string[]): Promise<void> => {
    const notes = await readAllRaw();
    const updated = notes.map((n) =>
        ids.includes(n.id) ? { ...n, archived: true, pinned: false } : n
    );
    await writeAll(updated);
};

export const bulkPin = async (ids: string[]): Promise<void> => {
    const notes = await readAllRaw();
    const updated = notes.map((n) =>
        ids.includes(n.id) ? { ...n, pinned: true } : n
    );
    await writeAll(updated);
};

export const bulkAddLabel = async (ids: string[], labelId: string): Promise<void> => {
    const notes = await readAllRaw();
    const updated = notes.map((n) => {
        if (ids.includes(n.id)) {
            const labels = n.labels.includes(labelId)
                ? n.labels
                : [...n.labels, labelId];
            return { ...n, labels };
        }
        return n;
    });
    await writeAll(updated);
};

/** Legacy compat shim – hard delete without trash */
export const deleteNote = async (id: string): Promise<void> => {
    await moveToTrash(id);
};

// ─────────────────────────────────────────────
//  Labels API
// ─────────────────────────────────────────────

export const getAllLabels = async (): Promise<Label[]> => {
    try {
        const raw = await AsyncStorage.getItem(LABELS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveLabel = async (label: Label): Promise<void> => {
    const labels = await getAllLabels();
    const idx = labels.findIndex((l) => l.id === label.id);
    if (idx >= 0) {
        labels[idx] = label;
    } else {
        labels.push(label);
    }
    await AsyncStorage.setItem(LABELS_KEY, JSON.stringify(labels));
};

export const deleteLabel = async (id: string): Promise<void> => {
    const labels = await getAllLabels();
    await AsyncStorage.setItem(
        LABELS_KEY,
        JSON.stringify(labels.filter((l) => l.id !== id))
    );
    // Also remove label from all notes
    const notes = await readAllRaw();
    const updated = notes.map((n) => ({
        ...n,
        labels: n.labels.filter((lid) => lid !== id),
    }));
    await writeAll(updated);
};

// ─────────────────────────────────────────────
//  Recent Searches
// ─────────────────────────────────────────────

const MAX_RECENT = 5;

export const getRecentSearches = async (): Promise<string[]> => {
    try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const addRecentSearch = async (query: string): Promise<void> => {
    if (!query.trim()) return;
    const searches = await getRecentSearches();
    const filtered = searches.filter((s) => s !== query);
    filtered.unshift(query);
    await AsyncStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(filtered.slice(0, MAX_RECENT))
    );
};

export const clearRecentSearches = async (): Promise<void> => {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

export const generateId = (): string =>
    Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

/** Format last edited time for display */
export const formatLastEdited = (iso: string): string => {
    const now = new Date();
    const edited = new Date(iso);
    const diffMs = now.getTime() - edited.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return edited.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Create blank note skeleton */
export const createBlankNote = (overrides: Partial<Note> = {}): Note => {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        title: '',
        description: '',
        isChecklist: false,
        checklistItems: [],
        images: [],
        color: '#FFFFFF',
        labels: [],
        pinned: false,
        archived: false,
        deleted: false,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
};

export const searchNotes = async (query: string): Promise<Note[]> => {
    const notes = await getAllNotes();
    const q = query.toLowerCase();
    return notes.filter(
        (n) =>
            n.title.toLowerCase().includes(q) ||
            n.description.toLowerCase().includes(q) ||
            n.labels.some((lid) => lid.toLowerCase().includes(q))
    );
};
