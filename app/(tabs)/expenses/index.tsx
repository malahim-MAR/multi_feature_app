import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet, Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import {
    deleteExpense,
    Expense, ExpenseCategory,
    getCurrentMonthExpenses,
    getMonthlyTotal,
    getSalary, setSalary as saveSalary,
} from '../../../services/expenseStorage';

const categoryIcons: Record<ExpenseCategory, string> = {
    Food: 'fast-food-outline',
    Rent: 'home-outline',
    Transport: 'car-outline',
    Shopping: 'bag-outline',
    Bills: 'receipt-outline',
    Other: 'ellipsis-horizontal-circle-outline',
};

const categoryColors: Record<ExpenseCategory, string> = {
    Food: Colors.categoryFood,
    Rent: Colors.categoryRent,
    Transport: Colors.categoryTransport,
    Shopping: Colors.categoryShopping,
    Bills: Colors.categoryBills,
    Other: Colors.categoryOther,
};

export default function ExpensesDashboard() {
    const router = useRouter();
    const [salary, setSalaryState] = useState(0);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [salaryInput, setSalaryInput] = useState('');

    const loadData = useCallback(async () => {
        const s = await getSalary();
        setSalaryState(s);
        const exp = await getCurrentMonthExpenses();
        setExpenses(exp);
        const total = await getMonthlyTotal();
        setTotalSpent(total);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const remaining = salary - totalSpent;
    const percentSpent = salary > 0 ? Math.min((totalSpent / salary) * 100, 100) : 0;

    const handleSaveSalary = async () => {
        const num = parseFloat(salaryInput);
        if (isNaN(num) || num <= 0) {
            Alert.alert('Error', 'Enter a valid salary amount');
            return;
        }
        await saveSalary(num);
        setSalaryState(num);
        setShowSalaryModal(false);
    };

    const handleDeleteExpense = (expense: Expense) => {
        Alert.alert('Delete', `Delete this ${expense.category} expense?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => { await deleteExpense(expense.id); await loadData(); },
            },
        ]);
    };

    const getProgressColor = () => {
        if (percentSpent >= 90) return Colors.danger;
        if (percentSpent >= 70) return Colors.warning;
        return Colors.secondary;
    };

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const renderExpense = ({ item }: { item: Expense }) => (
        <View style={styles.expenseCard}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColors[item.category] }]} />
            <View style={styles.expenseInfo}>
                <Text style={styles.expenseCategory}>{item.category}</Text>
                <Text style={styles.expenseNote}>
                    {item.note || new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
            </View>
            <Text style={styles.expenseAmount}>-Rs {item.amount.toLocaleString()}</Text>
            <TouchableOpacity onPress={() => handleDeleteExpense(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Expenses</Text>
                <Text style={styles.monthLabel}>{currentMonth}</Text>
            </View>

            <FlatList
                data={expenses}
                keyExtractor={(item) => item.id}
                renderItem={renderExpense}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* Salary Card */}
                        <TouchableOpacity style={styles.salaryCard} onPress={() => { setSalaryInput(salary > 0 ? salary.toString() : ''); setShowSalaryModal(true); }}>
                            <View>
                                <Text style={styles.salaryLabel}>Monthly Salary</Text>
                                <Text style={styles.salaryAmount}>Rs {salary.toLocaleString()}</Text>
                            </View>
                            <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
                        </TouchableOpacity>

                        {/* Balance & Progress */}
                        <View style={styles.balanceCard}>
                            <View style={styles.balanceRow}>
                                <View>
                                    <Text style={styles.balanceLabel}>Remaining</Text>
                                    <Text style={[styles.balanceAmount, remaining < 0 && { color: Colors.danger }]}>
                                        Rs {remaining.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.balanceLabel}>Spent</Text>
                                    <Text style={styles.spentAmount}>Rs {totalSpent.toLocaleString()}</Text>
                                </View>
                            </View>
                            {/* Progress Bar */}
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${percentSpent}%`, backgroundColor: getProgressColor() }]} />
                            </View>
                            <Text style={styles.progressText}>{percentSpent.toFixed(0)}% of salary spent</Text>
                        </View>

                        {/* Recent Label + Add Button */}
                        <View style={styles.recentHeader}>
                            <Text style={styles.recentTitle}>Recent Expenses</Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => router.push('/expenses/add' as any)}
                            >
                                <Ionicons name="add" size={20} color={Colors.white} />
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="wallet-outline" size={40} color={Colors.border} />
                        <Text style={styles.emptyText}>No expenses this month</Text>
                    </View>
                }
            />

            {/* Salary Modal */}
            <Modal visible={showSalaryModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Set Monthly Salary</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. 50000"
                            placeholderTextColor={Colors.textSecondary}
                            value={salaryInput}
                            onChangeText={setSalaryInput}
                            keyboardType="numeric"
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowSalaryModal(false)} style={styles.modalCancelBtn}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveSalary} style={styles.modalSaveBtn}>
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.sm,
    },
    title: { ...Typography.heading, fontSize: 26 },
    monthLabel: { ...Typography.bodySmall, marginTop: 2 },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
    salaryCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
        marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    },
    salaryLabel: { ...Typography.label, fontSize: 12 },
    salaryAmount: { ...Typography.heading, fontSize: 22, marginTop: 2 },
    balanceCard: {
        backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
        marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.card,
    },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    balanceLabel: { ...Typography.label, fontSize: 12 },
    balanceAmount: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: Colors.secondary, marginTop: 2 },
    spentAmount: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: Colors.textPrimary, marginTop: 2 },
    progressBarBg: {
        height: 8, backgroundColor: Colors.card, borderRadius: 4, marginTop: Spacing.md, overflow: 'hidden',
    },
    progressBarFill: { height: 8, borderRadius: 4 },
    progressText: { ...Typography.label, fontSize: 11, marginTop: Spacing.xs, textAlign: 'right' },
    recentHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: Spacing.lg, marginBottom: Spacing.md,
    },
    recentTitle: { ...Typography.headingSmall, fontSize: 18 },
    addButton: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderRadius: Radius.sm,
    },
    addButtonText: { ...Typography.button, fontSize: 13 },
    expenseCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
        borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
        borderWidth: 1, borderColor: Colors.border,
    },
    categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
    expenseInfo: { flex: 1 },
    expenseCategory: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Colors.textPrimary },
    expenseNote: { ...Typography.label, fontSize: 11 },
    expenseAmount: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.danger, marginRight: Spacing.sm },
    emptyContainer: { alignItems: 'center', paddingTop: Spacing.xl },
    emptyText: { ...Typography.bodySmall, marginTop: Spacing.sm },
    modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: Spacing.lg },
    modalContent: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg },
    modalTitle: { ...Typography.headingSmall, marginBottom: Spacing.md },
    modalInput: {
        backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
        fontFamily: 'Poppins_400Regular', fontSize: 18, color: Colors.textPrimary,
        borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md },
    modalCancelBtn: { padding: Spacing.sm },
    modalCancelText: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: Colors.textSecondary },
    modalSaveBtn: {
        backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
        borderRadius: Radius.sm,
    },
    modalSaveText: { ...Typography.button, fontSize: 15 },
});
