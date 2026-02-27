import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../../constants/theme';
import {
    addExpense,
    addTransaction,
    ExpenseCategory,
    generateId,
    getAllPersons,
    getInitials,
    getOrCreatePerson,
    getPersonColor,
    Person,
} from '../../../services/expenseStorage';

type TxnType = 'expense' | 'cashin' | 'cashout';

const categories: { label: ExpenseCategory; icon: string }[] = [
    { label: 'Food', icon: 'fast-food-outline' },
    { label: 'Rent', icon: 'home-outline' },
    { label: 'Transport', icon: 'car-outline' },
    { label: 'Shopping', icon: 'bag-outline' },
    { label: 'Bills', icon: 'receipt-outline' },
    { label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

export default function AddTransactionScreen() {
    const router = useRouter();
    const [txnType, setTxnType] = useState<TxnType>('expense');
    const [category, setCategory] = useState<ExpenseCategory>('Other');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date());
    const [note, setNote] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    // Person
    const [persons, setPersons] = useState<Person[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [personSearch, setPersonSearch] = useState('');
    const [showPersonList, setShowPersonList] = useState(false);

    useEffect(() => {
        (async () => {
            const ppl = await getAllPersons();
            setPersons(ppl);
        })();
    }, []);

    const filteredPersons = personSearch.trim()
        ? persons.filter((p) => p.name.toLowerCase().includes(personSearch.toLowerCase()))
        : persons;

    const handleSelectPerson = (p: Person) => {
        setSelectedPerson(p);
        setPersonSearch(p.name);
        setShowPersonList(false);
    };

    const handleSave = async () => {
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }

        setSaving(true);
        try {
            if (txnType === 'expense') {
                await addExpense({
                    id: generateId(),
                    category,
                    amount: num,
                    date: date.toISOString(),
                    note: note.trim() || undefined,
                    createdAt: new Date().toISOString(),
                });
            } else {
                // Cash in or Cash out → requires a person
                let person = selectedPerson;
                if (!person) {
                    if (!personSearch.trim()) {
                        Alert.alert('Error', 'Select or enter a person name');
                        setSaving(false);
                        return;
                    }
                    person = await getOrCreatePerson(personSearch.trim());
                }
                await addTransaction({
                    id: generateId(),
                    type: txnType,
                    amount: num,
                    personId: person.id,
                    category,
                    note: note.trim() || undefined,
                    date: date.toISOString(),
                    createdAt: new Date().toISOString(),
                });
            }
            router.back();
        } catch {
            Alert.alert('Error', 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const onDateChange = (_e: DateTimePickerEvent, d?: Date) => {
        setShowDatePicker(false);
        if (d) setDate(d);
    };

    const typeOptions: { key: TxnType; label: string; icon: string; color: string }[] = [
        { key: 'expense', label: 'Expense', icon: 'wallet-outline', color: Colors.textPrimary },
        { key: 'cashin', label: 'Cash In', icon: 'arrow-down-circle-outline', color: Colors.secondary },
        { key: 'cashout', label: 'Cash Out', icon: 'arrow-up-circle-outline', color: Colors.danger },
    ];

    return (
        <View style={st.container}>
            {/* Header */}
            <View style={st.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={st.headerTitle}>Add Transaction</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={st.saveButton}>
                    <Text style={st.saveButtonText}>{saving ? '…' : 'Save'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={st.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Type toggle */}
                <Text style={st.label}>TYPE</Text>
                <View style={st.typeRow}>
                    {typeOptions.map((opt) => (
                        <TouchableOpacity
                            key={opt.key}
                            style={[
                                st.typeChip,
                                txnType === opt.key && { backgroundColor: opt.color, borderColor: opt.color },
                            ]}
                            onPress={() => setTxnType(opt.key)}
                        >
                            <Ionicons
                                name={opt.icon as any}
                                size={18}
                                color={txnType === opt.key ? '#fff' : opt.color}
                            />
                            <Text style={[
                                st.typeChipText,
                                txnType === opt.key ? { color: '#fff' } : { color: opt.color },
                            ]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Person selector (for cashin/cashout) */}
                {txnType !== 'expense' && (
                    <>
                        <Text style={st.label}>PERSON</Text>
                        <View style={st.personInputWrap}>
                            <Ionicons name="person-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={st.personInput}
                                placeholder="Search or add person…"
                                placeholderTextColor={Colors.textSecondary}
                                value={personSearch}
                                onChangeText={(t) => {
                                    setPersonSearch(t);
                                    setSelectedPerson(null);
                                    setShowPersonList(true);
                                }}
                                onFocus={() => setShowPersonList(true)}
                            />
                            {personSearch.length > 0 && (
                                <TouchableOpacity onPress={() => { setPersonSearch(''); setSelectedPerson(null); }}>
                                    <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {showPersonList && (
                            <View style={st.personDropdown}>
                                {filteredPersons.length > 0 ? (
                                    filteredPersons.slice(0, 5).map((p) => (
                                        <TouchableOpacity key={p.id} style={st.personRow} onPress={() => handleSelectPerson(p)}>
                                            <View style={[st.personDot, { backgroundColor: getPersonColor(p.id) }]}>
                                                <Text style={st.personDotText}>{getInitials(p.name)}</Text>
                                            </View>
                                            <Text style={st.personRowName}>{p.name}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : null}
                                {personSearch.trim() && !filteredPersons.some((p) => p.name.toLowerCase() === personSearch.trim().toLowerCase()) && (
                                    <TouchableOpacity
                                        style={st.personRow}
                                        onPress={() => {
                                            setShowPersonList(false);
                                            // Will auto-create on save
                                        }}
                                    >
                                        <View style={[st.personDot, { backgroundColor: Colors.primary + '30' }]}>
                                            <Ionicons name="add" size={16} color={Colors.primary} />
                                        </View>
                                        <Text style={[st.personRowName, { color: Colors.primary }]}>
                                            Create "{personSearch.trim()}"
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </>
                )}

                {/* Category */}
                <Text style={st.label}>CATEGORY</Text>
                <View style={st.categoryGrid}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.label}
                            style={[st.categoryChip, category === cat.label && st.categoryChipActive]}
                            onPress={() => setCategory(cat.label)}
                        >
                            <Ionicons name={cat.icon as any} size={20} color={category === cat.label ? '#fff' : Colors.primary} />
                            <Text style={[st.categoryChipText, category === cat.label && st.categoryChipTextActive]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Amount */}
                <Text style={st.label}>AMOUNT (Rs)</Text>
                <TextInput
                    style={st.input}
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />

                {/* Date */}
                <Text style={st.label}>DATE</Text>
                <TouchableOpacity style={st.dateButton} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                    <Text style={st.dateButtonText}>
                        {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                    />
                )}

                {/* Note */}
                <Text style={st.label}>NOTE (Optional)</Text>
                <TextInput
                    style={st.input}
                    placeholder="What was this for?"
                    placeholderTextColor={Colors.textSecondary}
                    value={note}
                    onChangeText={setNote}
                />

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { ...Typography.headingSmall, fontSize: 18 },
    saveButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm },
    saveButtonText: { ...Typography.button, fontSize: 14 },
    content: { flex: 1, padding: Spacing.lg },
    label: { ...Typography.label, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.md },

    /* Type toggle */
    typeRow: { flexDirection: 'row', gap: Spacing.sm },
    typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm + 4, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
    typeChipText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },

    /* Person */
    personInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderWidth: 1, borderColor: Colors.border },
    personInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary },
    personDropdown: { backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginTop: -4, marginBottom: Spacing.sm, overflow: 'hidden' },
    personRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
    personDot: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    personDotText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
    personRowName: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Colors.textPrimary },

    /* Category */
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
    categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    categoryChipText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.primary },
    categoryChipTextActive: { color: '#fff' },

    input: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
    dateButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    dateButtonText: { ...Typography.body },
});
