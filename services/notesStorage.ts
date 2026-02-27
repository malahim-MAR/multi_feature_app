import api from './api';

export interface NoteReminder {
    date: string;          // ISO date string
    repeat: 'once' | 'daily' | 'weekly';
    notificationId?: string;
}

export interface Note {
    id: string; // The front-end uses id, though MongoDB uses _id. We will map it below.
    _id?: string;
    title: string;
    description: string;
    reminder?: NoteReminder;
    createdAt: string;
    updatedAt: string;
}

// Map MongoDB `_id` to app `id` format
const mapNote = (n: any): Note => ({
    id: n._id,
    _id: n._id,
    title: n.title,
    description: n.description,
    reminder: n.reminder,
    createdAt: n.createdAt,
    updatedAt: n.createdAt // We use createdAt for both in DB unless explicitly updated
});

export const getAllNotes = async (): Promise<Note[]> => {
    try {
        const response = await api.get('/notes');
        const notes = response.data.data.map(mapNote);
        return notes;
    } catch (error) {
        console.error('Error getting notes from backend:', error);
        return [];
    }
};

export const saveNote = async (note: Note): Promise<void> => {
    try {
        if (note._id || (note.id && note.id.length === 24)) {
            // Update existing Note. We assume valid 24-character hex strings are mongo IDs
            await api.put(`/notes/${note._id || note.id}`, {
                title: note.title,
                description: note.description,
                reminder: note.reminder
            });
        } else {
            // Create a brand new Note
            await api.post('/notes', {
                title: note.title,
                description: note.description,
                reminder: note.reminder
            });
        }
    } catch (error) {
        console.error('Error saving note to backend:', error);
        throw error;
    }
};

export const deleteNote = async (id: string): Promise<void> => {
    try {
        await api.delete(`/notes/${id}`);
    } catch (error) {
        console.error('Error deleting note from backend:', error);
    }
};

export const getNoteById = async (id: string): Promise<Note | null> => {
    try {
        // As our backend currently only supports getting all notes, we will fetch and filter.
        // A dedicated GET /notes/:id route would be more efficient!
        const notes = await getAllNotes();
        return notes.find(n => n.id === id || n._id === id) || null;
    } catch (error) {
        console.error('Error getting note:', error);
        return null;
    }
};

export const searchNotes = async (query: string): Promise<Note[]> => {
    try {
        const notes = await getAllNotes();
        const q = query.toLowerCase();
        return notes.filter(
            n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
        );
    } catch (error) {
        console.error('Error searching notes:', error);
        return [];
    }
};
