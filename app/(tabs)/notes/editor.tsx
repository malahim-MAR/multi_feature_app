import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../../constants/theme';
import { getNoteById, Note, NoteReminder, saveNote } from '../../../services/notesStorage';
import { cancelReminder, scheduleReminder } from '../../../services/notificationService';

export default function NoteEditorScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const isEditing = !!params.id;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Reminder states
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderDate, setReminderDate] = useState(new Date());
    const [repeatMode, setRepeatMode] = useState<'once' | 'daily' | 'weekly'>('once');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [existingReminder, setExistingReminder] = useState<NoteReminder | undefined>();

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadExistingNote(params.id);
        }
    }, [params.id]);

    const loadExistingNote = async (id: string) => {
        const note = await getNoteById(id);
        if (note) {
            setTitle(note.title);
            setDescription(note.description);
            if (note.reminder) {
                setReminderEnabled(true);
                setReminderDate(new Date(note.reminder.date));
                setRepeatMode(note.reminder.repeat);
                setExistingReminder(note.reminder);
            }
        }
    };

    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a description');
            return;
        }

        setSaving(true);

        try {
            const noteId = params.id || generateId();
            let reminder: NoteReminder | undefined;

            // Cancel old reminder if it existed
            if (existingReminder?.notificationId) {
                await cancelReminder(existingReminder.notificationId);
            }

            // Schedule new reminder if enabled
            if (reminderEnabled) {
                const notifId = await scheduleReminder(noteId, title, reminderDate, repeatMode);
                reminder = {
                    date: reminderDate.toISOString(),
                    repeat: repeatMode,
                    notificationId: notifId || undefined,
                };
            }

            const now = new Date().toISOString();
            const note: Note = {
                id: noteId,
                title: title.trim(),
                description: description.trim(),
                reminder,
                createdAt: isEditing ? (await getNoteById(noteId))?.createdAt || now : now,
                updatedAt: now,
            };

            await saveNote(note);
            router.back();
        } catch (error) {
            console.error('Error saving note:', error);
            Alert.alert('Error', 'Failed to save note.');
        } finally {
            setSaving(false);
        }
    };

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(reminderDate);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setReminderDate(newDate);
        }
    };

    const onTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(reminderDate);
            newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            setReminderDate(newDate);
        }
    };

    const repeatOptions: { label: string; value: 'once' | 'daily' | 'weekly' }[] = [
        { label: 'Once', value: 'once' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Note' : 'New Note'}</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>{saving ? '...' : 'Save'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Title Input */}
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Note title..."
                    placeholderTextColor={Colors.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={50}
                />

                {/* Description Input */}
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Write your note..."
                    placeholderTextColor={Colors.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                />

                {/* Reminder Section */}
                <View style={styles.reminderSection}>
                    <View style={styles.reminderToggle}>
                        <View style={styles.reminderToggleLeft}>
                            <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
                            <Text style={styles.reminderToggleText}>Set Reminder</Text>
                        </View>
                        <Switch
                            value={reminderEnabled}
                            onValueChange={setReminderEnabled}
                            trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
                            thumbColor={reminderEnabled ? Colors.primary : '#f4f3f4'}
                        />
                    </View>

                    {reminderEnabled && (
                        <View style={styles.reminderOptions}>
                            {/* Date Picker */}
                            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
                                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                                <Text style={styles.pickerButtonText}>
                                    {reminderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>

                            {/* Time Picker */}
                            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
                                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                                <Text style={styles.pickerButtonText}>
                                    {reminderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>

                            {/* Repeat Options */}
                            <Text style={[styles.label, { marginTop: Spacing.md }]}>Repeat</Text>
                            <View style={styles.repeatRow}>
                                {repeatOptions.map(opt => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[styles.repeatChip, repeatMode === opt.value && styles.repeatChipActive]}
                                        onPress={() => setRepeatMode(opt.value)}
                                    >
                                        <Text style={[styles.repeatChipText, repeatMode === opt.value && styles.repeatChipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={reminderDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                            {showTimePicker && (
                                <DateTimePicker
                                    value={reminderDate}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onTimeChange}
                                />
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: 56,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        ...Typography.headingSmall,
        fontSize: 18,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.sm,
    },
    saveButtonText: {
        ...Typography.button,
        fontSize: 14,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    label: {
        ...Typography.label,
        fontSize: 13,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.card,
        borderRadius: Radius.md,
        padding: Spacing.md,
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    textArea: {
        height: 150,
        textAlignVertical: 'top',
    },
    reminderSection: {
        marginTop: Spacing.md,
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    reminderToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reminderToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reminderToggleText: {
        ...Typography.body,
        marginLeft: Spacing.sm,
        fontFamily: 'Poppins_500Medium',
    },
    reminderOptions: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: Radius.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    pickerButtonText: {
        ...Typography.body,
        marginLeft: Spacing.sm,
    },
    repeatRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    repeatChip: {
        flex: 1,
        paddingVertical: Spacing.sm + 2,
        alignItems: 'center',
        borderRadius: Radius.sm,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    repeatChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    repeatChipText: {
        ...Typography.label,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    repeatChipTextActive: {
        color: Colors.white,
    },
});
