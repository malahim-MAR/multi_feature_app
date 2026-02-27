import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../../constants/theme';
import { addExpense, ExpenseCategory } from '../../../services/expenseStorage';

const categories: { label: ExpenseCategory; icon: string }[] = [
    { label: 'Food', icon: 'fast-food-outline' },
    { label: 'Rent', icon: 'home-outline' },
    { label: 'Transport', icon: 'car-outline' },
    { label: 'Shopping', icon: 'bag-outline' },
    { label: 'Bills', icon: 'receipt-outline' },
    { label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

export default function AddExpenseScreen() {
    const router = useRouter();
    const [category, setCategory] = useState<ExpenseCategory>('Food');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date());
    const [note, setNote] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) {
            Alert.alert('Error', 'Enter a valid amount');
            return;
        }

        setSaving(true);
        try {
            await addExpense({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
                category,
                amount: num,
                date: date.toISOString(),
                note: note.trim() || undefined,
                createdAt: new Date().toISOString(),
            });
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to save expense');
        } finally {
            setSaving(false);
        }
    };

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Expense</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>{saving ? '...' : 'Save'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Category */}
                <Text style={styles.label}>CATEGORY</Text>
                <View style={styles.categoryGrid}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.label}
                            style={[styles.categoryChip, category === cat.label && styles.categoryChipActive]}
                            onPress={() => setCategory(cat.label)}
                        >
                            <Ionicons
                                name={cat.icon as any}
                                size={20}
                                color={category === cat.label ? Colors.white : Colors.primary}
                            />
                            <Text style={[styles.categoryChipText, category === cat.label && styles.categoryChipTextActive]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Amount */}
                <Text style={styles.label}>AMOUNT (Rs)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />

                {/* Date */}
                <Text style={styles.label}>DATE</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                    <Text style={styles.dateButtonText}>
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
                <Text style={styles.label}>NOTE (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="What was this for?"
                    placeholderTextColor={Colors.textSecondary}
                    value={note}
                    onChangeText={setNote}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { ...Typography.headingSmall, fontSize: 18 },
    saveButton: {
        backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderRadius: Radius.sm,
    },
    saveButtonText: { ...Typography.button, fontSize: 14 },
    content: { flex: 1, padding: Spacing.lg },
    label: {
        ...Typography.label, fontSize: 12, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.md,
    },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    categoryChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
        borderRadius: Radius.md, backgroundColor: Colors.card,
        borderWidth: 1, borderColor: Colors.border,
    },
    categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    categoryChipText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.primary },
    categoryChipTextActive: { color: Colors.white },
    input: {
        backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
        fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary,
        borderWidth: 1, borderColor: Colors.border,
    },
    dateButton: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    dateButtonText: { ...Typography.body },
});
