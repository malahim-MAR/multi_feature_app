import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../../constants/theme';
import {
    ChecklistItem,
    createBlankNote,
    generateId,
    getAllLabels,
    getNoteById,
    Label,
    Note,
    NOTE_COLORS,
    NoteReminder,
    saveNote,
} from '../../../services/notesStorage';
import { cancelReminder, scheduleReminder } from '../../../services/notificationService';

type EditorMode = 'note' | 'checklist' | 'image';

export default function NoteEditorScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string; mode?: string }>();
    const isEditing = !!params.id;
    const initialMode = (params.mode as EditorMode) || 'note';

    // Core fields
    const [noteId] = useState(params.id || generateId());
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#FFFFFF');
    const [labels, setLabels] = useState<string[]>([]);
    const [pinned, setPinned] = useState(false);
    const [isChecklist, setIsChecklist] = useState(initialMode === 'checklist');
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [images] = useState<string[]>([]);
    const [createdAt, setCreatedAt] = useState('');
    const [originalNote, setOriginalNote] = useState<Note | null>(null);

    // Reminder
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderDate, setReminderDate] = useState(new Date());
    const [repeatMode, setRepeatMode] = useState<'once' | 'daily' | 'weekly'>('once');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [existingReminder, setExistingReminder] = useState<NoteReminder | undefined>();

    // UI state
    const [saving, setSaving] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [allLabels, setAllLabels] = useState<Label[]>([]);
    const [savedAnim] = useState(new Animated.Value(0));
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load existing note
    useEffect(() => {
        (async () => {
            const [fetchedLabels] = await Promise.all([getAllLabels()]);
            setAllLabels(fetchedLabels);
            if (params.id) {
                const note = await getNoteById(params.id);
                if (note) {
                    setOriginalNote(note);
                    setTitle(note.title);
                    setDescription(note.description);
                    setColor(note.color || '#FFFFFF');
                    setLabels(note.labels || []);
                    setPinned(note.pinned || false);
                    setIsChecklist(note.isChecklist || false);
                    setChecklistItems(note.checklistItems || []);
                    setCreatedAt(note.createdAt);
                    if (note.reminder) {
                        setReminderEnabled(true);
                        setReminderDate(new Date(note.reminder.date));
                        setRepeatMode(note.reminder.repeat);
                        setExistingReminder(note.reminder);
                    }
                }
            } else {
                setCreatedAt(new Date().toISOString());
            }
        })();
    }, [params.id]);

    // Trigger auto-save whenever content changes
    const scheduleAutoSave = useCallback(() => {
        if (!isEditing && !title && !description && checklistItems.length === 0) return;
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(async () => {
            await doSave(true);
        }, 2000);
    }, [title, description, isEditing, checklistItems]);

    useEffect(() => { scheduleAutoSave(); }, [title, description, checklistItems]);

    const showSavedToast = () => {
        Animated.sequence([
            Animated.timing(savedAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(1500),
            Animated.timing(savedAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    };

    const doSave = async (silent = false) => {
        if (!title.trim() && !description.trim() && checklistItems.length === 0) return;
        setSaving(true);
        try {
            let reminder: NoteReminder | undefined;
            if (existingReminder?.notificationId && !reminderEnabled) {
                await cancelReminder(existingReminder.notificationId);
            }
            if (reminderEnabled) {
                if (existingReminder?.notificationId) {
                    await cancelReminder(existingReminder.notificationId);
                }
                const notifId = await scheduleReminder(noteId, title || 'Note', reminderDate, repeatMode);
                reminder = {
                    date: reminderDate.toISOString(),
                    repeat: repeatMode,
                    notificationId: notifId || undefined,
                };
            }

            const now = new Date().toISOString();
            const note: Note = {
                ...(originalNote || createBlankNote()),
                id: noteId,
                title: title.trim(),
                description: description.trim(),
                color,
                labels,
                pinned,
                isChecklist,
                checklistItems,
                images,
                reminder,
                createdAt: createdAt || now,
                updatedAt: now,
                archived: originalNote?.archived || false,
                deleted: originalNote?.deleted || false,
            };
            await saveNote(note);
            if (!silent) { router.back(); }
            else { showSavedToast(); }
        } catch (e) {
            if (!silent) Alert.alert('Error', 'Failed to save note.');
        } finally {
            setSaving(false);
        }
    };

    // Checklist helpers
    const addChecklistItem = () => {
        setChecklistItems((prev) => [...prev, { id: generateId(), text: '', checked: false }]);
    };

    const updateChecklistItem = (id: string, text: string) => {
        setChecklistItems((prev) => prev.map((item) => item.id === id ? { ...item, text } : item));
    };

    const toggleChecklistItem = (id: string) => {
        setChecklistItems((prev) => prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
    };

    const removeChecklistItem = (id: string) => {
        setChecklistItems((prev) => prev.filter((item) => item.id !== id));
    };

    const onDateChange = (_e: DateTimePickerEvent, d?: Date) => {
        setShowDatePicker(false);
        if (d) {
            const nd = new Date(reminderDate);
            nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
            setReminderDate(nd);
        }
    };

    const onTimeChange = (_e: DateTimePickerEvent, t?: Date) => {
        setShowTimePicker(false);
        if (t) {
            const nd = new Date(reminderDate);
            nd.setHours(t.getHours(), t.getMinutes());
            setReminderDate(nd);
        }
    };

    const toggleLabel = (id: string) => {
        setLabels((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);
    };

    const repeatOptions: { label: string; value: 'once' | 'daily' | 'weekly' }[] = [
        { label: 'Once', value: 'once' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
    ];

    return (
        <View style={[s.container, { backgroundColor: color }]}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => { doSave(false); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                {/* Center toolbar */}
                <View style={s.toolbarCenter}>
                    <TouchableOpacity onPress={() => setPinned(!pinned)} style={s.toolBtn}>
                        <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={20} color={pinned ? Colors.primary : Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsChecklist(!isChecklist)} style={s.toolBtn}>
                        <Ionicons name={isChecklist ? 'checkbox' : 'checkbox-outline'} size={20} color={isChecklist ? Colors.primary : Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowColorPicker(true)} style={s.toolBtn}>
                        <View style={[s.colorDot, { backgroundColor: color === '#FFFFFF' ? Colors.border : color }]} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowLabelModal(true)} style={s.toolBtn}>
                        <Ionicons name="pricetag-outline" size={20} color={labels.length > 0 ? Colors.primary : Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => doSave(false)} disabled={saving} style={s.saveBtn}>
                    <Text style={s.saveBtnText}>{saving ? '…' : 'Save'}</Text>
                </TouchableOpacity>
            </View>

            {/* Auto-save indicator */}
            <Animated.View style={[s.savedBadge, { opacity: savedAnim }]}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.secondary} />
                <Text style={s.savedText}>Saved</Text>
            </Animated.View>

            <ScrollView style={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Title */}
                <TextInput
                    style={s.titleInput}
                    placeholder="Title"
                    placeholderTextColor={Colors.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={80}
                    returnKeyType="next"
                />

                {/* Checklist OR Note body */}
                {isChecklist ? (
                    <View>
                        {checklistItems.map((item, idx) => (
                            <View key={item.id} style={s.clRow}>
                                <TouchableOpacity onPress={() => toggleChecklistItem(item.id)} style={{ marginRight: 8 }}>
                                    <Ionicons
                                        name={item.checked ? 'checkbox' : 'square-outline'}
                                        size={22}
                                        color={item.checked ? Colors.primary : Colors.textSecondary}
                                    />
                                </TouchableOpacity>
                                <TextInput
                                    style={[s.clInput, item.checked && s.clDone]}
                                    placeholder={`Item ${idx + 1}`}
                                    placeholderTextColor={Colors.textSecondary}
                                    value={item.text}
                                    onChangeText={(text) => updateChecklistItem(item.id, text)}
                                    onSubmitEditing={addChecklistItem}
                                    returnKeyType="next"
                                />
                                <TouchableOpacity onPress={() => removeChecklistItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons name="close" size={18} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity style={s.addItemBtn} onPress={addChecklistItem}>
                            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                            <Text style={s.addItemText}>Add item</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TextInput
                        style={s.descInput}
                        placeholder="Note…"
                        placeholderTextColor={Colors.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        textAlignVertical="top"
                    />
                )}

                {/* Applied labels */}
                {labels.length > 0 && (
                    <View style={s.labelDisplay}>
                        {labels.map((lid) => {
                            const lbl = allLabels.find((l) => l.id === lid);
                            return lbl ? (
                                <TouchableOpacity key={lid} style={s.labelChip} onPress={() => toggleLabel(lid)}>
                                    <Ionicons name="pricetag" size={11} color={Colors.primary} style={{ marginRight: 4 }} />
                                    <Text style={s.labelChipText}>{lbl.name}</Text>
                                    <Ionicons name="close" size={11} color={Colors.primary} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            ) : null;
                        })}
                    </View>
                )}

                {/* Reminder Section */}
                <View style={s.reminderSection}>
                    <View style={s.reminderToggle}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
                            <Text style={s.reminderToggleText}>Set Reminder</Text>
                        </View>
                        <Switch
                            value={reminderEnabled}
                            onValueChange={setReminderEnabled}
                            trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
                            thumbColor={reminderEnabled ? Colors.primary : '#f4f3f4'}
                        />
                    </View>

                    {reminderEnabled && (
                        <View style={s.reminderOptions}>
                            <TouchableOpacity style={s.pickerBtn} onPress={() => setShowDatePicker(true)}>
                                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                                <Text style={s.pickerBtnText}>
                                    {reminderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.pickerBtn} onPress={() => setShowTimePicker(true)}>
                                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                                <Text style={s.pickerBtnText}>
                                    {reminderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                            <Text style={s.repeatLabel}>Repeat</Text>
                            <View style={s.repeatRow}>
                                {repeatOptions.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[s.repeatChip, repeatMode === opt.value && s.repeatChipActive]}
                                        onPress={() => setRepeatMode(opt.value)}
                                    >
                                        <Text style={[s.repeatChipText, repeatMode === opt.value && s.repeatChipTextActive]}>
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

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Color Picker Modal */}
            <Modal visible={showColorPicker} transparent animationType="fade" onRequestClose={() => setShowColorPicker(false)}>
                <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
                    <View style={s.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={s.colorModal}>
                                <Text style={s.colorModalTitle}>Note Color</Text>
                                <View style={s.colorGrid}>
                                    {NOTE_COLORS.map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[
                                                s.colorSwatch,
                                                { backgroundColor: c, borderColor: c === '#FFFFFF' ? Colors.border : c },
                                                color === c && s.colorSwatchActive,
                                            ]}
                                            onPress={() => { setColor(c); setShowColorPicker(false); }}
                                        >
                                            {color === c && <Ionicons name="checkmark" size={16} color={c === '#FFFFFF' ? Colors.textPrimary : Colors.textPrimary + 'AA'} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Label Select Modal */}
            <Modal visible={showLabelModal} transparent animationType="fade" onRequestClose={() => setShowLabelModal(false)}>
                <TouchableWithoutFeedback onPress={() => setShowLabelModal(false)}>
                    <View style={s.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={s.labelModal}>
                                <Text style={s.colorModalTitle}>Labels</Text>
                                {allLabels.length === 0 ? (
                                    <Text style={{ ...Typography.bodySmall, textAlign: 'center', marginVertical: Spacing.md }}>
                                        No labels yet. Create them in the Labels screen.
                                    </Text>
                                ) : (
                                    allLabels.map((lbl) => (
                                        <TouchableOpacity
                                            key={lbl.id}
                                            style={s.labelRow}
                                            onPress={() => toggleLabel(lbl.id)}
                                        >
                                            <Ionicons
                                                name={labels.includes(lbl.id) ? 'checkbox' : 'square-outline'}
                                                size={20}
                                                color={labels.includes(lbl.id) ? Colors.primary : Colors.textSecondary}
                                                style={{ marginRight: 10 }}
                                            />
                                            <Text style={s.labelText}>{lbl.name}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                                <TouchableOpacity style={s.doneBtn} onPress={() => setShowLabelModal(false)}>
                                    <Text style={s.doneBtnText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    toolbarCenter: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
    toolBtn: { padding: 6, borderRadius: Radius.sm },
    colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border },
    saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm - 2, borderRadius: Radius.sm },
    saveBtnText: { ...Typography.button, fontSize: 14 },
    savedBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: 4, gap: 4 },
    savedText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: Colors.secondary },
    content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
    titleInput: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, color: Colors.textPrimary, marginBottom: Spacing.sm, paddingVertical: 4 },
    descInput: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: Colors.textPrimary, minHeight: 180, textAlignVertical: 'top', lineHeight: 26 },
    // Checklist
    clRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, },
    clInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
    clDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
    addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: Spacing.sm, marginTop: 4 },
    addItemText: { ...Typography.body, color: Colors.primary, fontFamily: 'Poppins_500Medium', fontSize: 14 },
    // Labels
    labelDisplay: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.md },
    labelChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    labelChipText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: Colors.primary },
    // Reminder
    reminderSection: { marginTop: Spacing.md, backgroundColor: Colors.white + 'CC', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    reminderToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reminderToggleText: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: Colors.textPrimary, marginLeft: 8 },
    reminderOptions: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
    pickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    pickerBtnText: { ...Typography.body, marginLeft: Spacing.sm },
    repeatLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.sm, marginBottom: Spacing.sm },
    repeatRow: { flexDirection: 'row', gap: Spacing.sm },
    repeatChip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
    repeatChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    repeatChipText: { ...Typography.label, fontSize: 13, color: Colors.textSecondary },
    repeatChipTextActive: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
    // Modals
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    colorModal: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 },
    colorModalTitle: { ...Typography.headingSmall, fontSize: 16, marginBottom: Spacing.md },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    colorSwatch: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    colorSwatchActive: { borderWidth: 3, borderColor: Colors.textPrimary + '60', transform: [{ scale: 1.1 }] },
    labelModal: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 },
    labelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    labelText: { ...Typography.body, fontSize: 15 },
    doneBtn: { marginTop: Spacing.md, backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
    doneBtnText: { ...Typography.button, fontSize: 14 },
});
