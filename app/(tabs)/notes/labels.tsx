import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import {
    deleteLabel,
    generateId,
    getAllLabels,
    getAllNotes,
    Label,
    Note,
    saveLabel,
} from '../../../services/notesStorage';

export default function LabelsScreen() {
    const router = useRouter();
    const [labels, setLabels] = useState<Label[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);
    const [labelName, setLabelName] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        const [allLabels, allNotes] = await Promise.all([getAllLabels(), getAllNotes()]);
        setLabels(allLabels);
        setNotes(allNotes);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const getNoteCount = (labelId: string) =>
        notes.filter((n) => n.labels?.includes(labelId)).length;

    const openCreate = () => {
        setEditingLabel(null);
        setLabelName('');
        setShowModal(true);
    };

    const openEdit = (label: Label) => {
        setEditingLabel(label);
        setLabelName(label.name);
        setShowModal(true);
    };

    const handleSave = async () => {
        const trimmed = labelName.trim();
        if (!trimmed) return;
        if (labels.some((l) => l.name.toLowerCase() === trimmed.toLowerCase() && l.id !== editingLabel?.id)) {
            Alert.alert('Duplicate', 'A label with this name already exists.');
            return;
        }
        setSaving(true);
        const label: Label = {
            id: editingLabel?.id || generateId(),
            name: trimmed,
            createdAt: editingLabel?.createdAt || new Date().toISOString(),
        };
        await saveLabel(label);
        await load();
        setSaving(false);
        setShowModal(false);
    };

    const handleDelete = (label: Label) => {
        Alert.alert('Delete Label', `Delete "${label.name}"? It will be removed from all notes.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => { await deleteLabel(label.id); await load(); },
            },
        ]);
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Labels</Text>
                <TouchableOpacity onPress={openCreate} style={s.addBtn}>
                    <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {labels.length === 0 ? (
                <View style={s.empty}>
                    <View style={s.emptyIconBg}><Ionicons name="pricetag-outline" size={44} color={Colors.primary + '80'} /></View>
                    <Text style={s.emptyTitle}>No labels yet</Text>
                    <Text style={s.emptySub}>Tap + to create your first label</Text>
                    <TouchableOpacity style={s.createBtn} onPress={openCreate}>
                        <Text style={s.createBtnText}>Create Label</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={labels}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const count = getNoteCount(item.id);
                        return (
                            <TouchableOpacity
                                style={s.labelRow}
                                onPress={() =>
                                    router.push({ pathname: '/notes/label-notes', params: { labelId: item.id, labelName: item.name } } as any)
                                }
                                activeOpacity={0.8}
                            >
                                <View style={s.labelIcon}>
                                    <Ionicons name="pricetag" size={18} color={Colors.primary} />
                                </View>
                                <View style={s.labelInfo}>
                                    <Text style={s.labelName}>{item.name}</Text>
                                    <Text style={s.labelCount}>{count} note{count !== 1 ? 's' : ''}</Text>
                                </View>
                                <View style={s.labelActions}>
                                    <TouchableOpacity
                                        onPress={() => openEdit(item)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        style={{ marginRight: 12 }}
                                    >
                                        <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(item)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ItemSeparatorComponent={() => <View style={s.separator} />}
                />
            )}

            {/* Create / Edit Modal */}
            <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
                <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
                    <View style={s.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={s.modal}>
                                <Text style={s.modalTitle}>{editingLabel ? 'Rename Label' : 'New Label'}</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="Label name..."
                                    placeholderTextColor={Colors.textSecondary}
                                    value={labelName}
                                    onChangeText={setLabelName}
                                    maxLength={30}
                                    autoFocus
                                    onSubmitEditing={handleSave}
                                    returnKeyType="done"
                                />
                                <Text style={s.charCount}>{labelName.length}/30</Text>
                                <View style={s.modalActions}>
                                    <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                                        <Text style={s.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[s.saveBtn, !labelName.trim() && s.saveBtnDisabled]}
                                        onPress={handleSave}
                                        disabled={!labelName.trim() || saving}
                                    >
                                        <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { ...Typography.headingSmall, fontSize: 20 },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.button },
    list: { padding: Spacing.lg, paddingBottom: 40 },
    labelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm + 2, backgroundColor: Colors.white, borderRadius: Radius.md, paddingHorizontal: Spacing.md, ...Shadows.card, marginBottom: 4 },
    labelIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    labelInfo: { flex: 1 },
    labelName: { ...Typography.body, fontSize: 15, fontFamily: 'Poppins_500Medium' },
    labelCount: { ...Typography.label, fontSize: 12 },
    labelActions: { flexDirection: 'row', alignItems: 'center' },
    separator: { height: 8 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
    emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    emptyTitle: { ...Typography.headingSmall, fontSize: 18, textAlign: 'center', marginBottom: 8 },
    emptySub: { ...Typography.bodySmall, textAlign: 'center', marginBottom: Spacing.lg },
    createBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: Radius.full, ...Shadows.button },
    createBtnText: { ...Typography.button, fontSize: 14 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    modal: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, width: '100%', maxWidth: 360 },
    modalTitle: { ...Typography.headingSmall, fontSize: 17, marginBottom: Spacing.md },
    input: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: 4 },
    charCount: { ...Typography.label, fontSize: 11, textAlign: 'right', marginBottom: Spacing.md },
    modalActions: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    cancelBtnText: { ...Typography.label, fontSize: 14, color: Colors.textSecondary },
    saveBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { ...Typography.button, fontSize: 14 },
});
