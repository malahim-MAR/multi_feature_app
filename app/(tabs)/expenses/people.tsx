import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import {
    deletePerson,
    generateId,
    getAllPersonBalances,
    getAllPersons,
    getInitials,
    getPersonColor,
    Person,
    savePerson,
} from '../../../services/expenseStorage';

export default function PeopleScreen() {
    const router = useRouter();
    const [persons, setPersons] = useState<Person[]>([]);
    const [balances, setBalances] = useState<Record<string, number>>({});
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editPerson, setEditPerson] = useState<Person | null>(null);
    const [nameInput, setNameInput] = useState('');

    const load = useCallback(async () => {
        const [ppl, bals] = await Promise.all([getAllPersons(), getAllPersonBalances()]);
        setPersons(ppl);
        setBalances(bals);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const openCreate = () => { setEditPerson(null); setNameInput(''); setShowModal(true); };
    const openEdit = (p: Person) => { setEditPerson(p); setNameInput(p.name); setShowModal(true); };

    const handleSave = async () => {
        const trimmed = nameInput.trim();
        if (!trimmed) return;
        if (persons.some((p) => p.name.toLowerCase() === trimmed.toLowerCase() && p.id !== editPerson?.id)) {
            Alert.alert('Duplicate', 'A person with this name already exists.');
            return;
        }
        const p: Person = {
            id: editPerson?.id || generateId(),
            name: trimmed,
            createdAt: editPerson?.createdAt || new Date().toISOString(),
        };
        await savePerson(p);
        await load();
        setShowModal(false);
    };

    const handleDelete = (p: Person) => {
        Alert.alert('Delete Person', `Delete "${p.name}" and all their transactions?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deletePerson(p.id); await load(); } },
        ]);
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>People</Text>
                <TouchableOpacity onPress={openCreate} style={s.addBtn}>
                    <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {persons.length === 0 ? (
                <View style={s.empty}>
                    <View style={s.emptyIconBg}><Ionicons name="people-outline" size={44} color={Colors.primary + '80'} /></View>
                    <Text style={s.emptyTitle}>No people yet</Text>
                    <Text style={s.emptySub}>Add a person to track cash in / out</Text>
                    <TouchableOpacity style={s.createBtn} onPress={openCreate}>
                        <Text style={s.createBtnText}>Add Person</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                >
                    <Text style={s.count}>{persons.length} person{persons.length !== 1 ? 's' : ''}</Text>
                    {persons.map((p) => {
                        const bal = balances[p.id] || 0;
                        const positive = bal >= 0;
                        return (
                            <TouchableOpacity
                                key={p.id}
                                style={s.personRow}
                                onPress={() => router.push({ pathname: '/expenses/person-detail', params: { personId: p.id } } as any)}
                                activeOpacity={0.8}
                            >
                                <View style={[s.avatar, { backgroundColor: getPersonColor(p.id) }]}>
                                    <Text style={s.avatarText}>{getInitials(p.name)}</Text>
                                </View>
                                <View style={s.personInfo}>
                                    <Text style={s.personName}>{p.name}</Text>
                                    <Text style={[s.personBal, { color: positive ? Colors.secondary : Colors.danger }]}>
                                        {positive
                                            ? bal === 0 ? 'Settled' : `Owes you Rs ${bal.toLocaleString()}`
                                            : `You owe Rs ${Math.abs(bal).toLocaleString()}`}
                                    </Text>
                                </View>
                                <View style={s.personActions}>
                                    <TouchableOpacity onPress={() => openEdit(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: 12 }}>
                                        <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Create / Edit Modal */}
            <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
                <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
                    <View style={s.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={s.modal}>
                                <Text style={s.modalTitle}>{editPerson ? 'Rename Person' : 'New Person'}</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="Person name…"
                                    placeholderTextColor={Colors.textSecondary}
                                    value={nameInput}
                                    onChangeText={setNameInput}
                                    maxLength={30}
                                    autoFocus
                                    onSubmitEditing={handleSave}
                                    returnKeyType="done"
                                />
                                <View style={s.modalActions}>
                                    <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                                        <Text style={s.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.saveBtn, !nameInput.trim() && { opacity: 0.5 }]} onPress={handleSave} disabled={!nameInput.trim()}>
                                        <Text style={s.saveBtnText}>Save</Text>
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
    count: { ...Typography.label, marginBottom: Spacing.md },

    personRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, ...Shadows.card },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
    personInfo: { flex: 1 },
    personName: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: Colors.textPrimary },
    personBal: { fontFamily: 'Poppins_500Medium', fontSize: 12, marginTop: 2 },
    personActions: { flexDirection: 'row', alignItems: 'center' },

    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
    emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    emptyTitle: { ...Typography.headingSmall, fontSize: 18, textAlign: 'center', marginBottom: 8 },
    emptySub: { ...Typography.bodySmall, textAlign: 'center', marginBottom: Spacing.lg },
    createBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: Radius.full, ...Shadows.button },
    createBtnText: { ...Typography.button, fontSize: 14 },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    modal: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, width: '100%', maxWidth: 360 },
    modalTitle: { ...Typography.headingSmall, fontSize: 17, marginBottom: Spacing.md },
    input: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
    modalActions: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    cancelBtnText: { ...Typography.label, fontSize: 14, color: Colors.textSecondary },
    saveBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' },
    saveBtnText: { ...Typography.button, fontSize: 14 },
});
