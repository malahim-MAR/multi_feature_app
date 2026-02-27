import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
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
    deleteExpense,
    deleteIncome,
    deleteTransaction,
    Expense,
    ExpenseCategory,
    generateId,
    getAllIncomes,
    getAllPersonBalances,
    getAllPersons,
    getCurrentMonthExpenses,
    getCurrentMonthTransactions,
    getInitials,
    getMonthlyTotal,
    getMonthlyTransactionTotals,
    getPersonColor,
    getPreviousMonthsExpenses,
    getTotalIncome,
    INCOME_COLORS,
    INCOME_ICONS,
    IncomeSource,
    IncomeType,
    Person,
    resetExpenseData,
    saveIncome,
    Transaction,
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

// Unified list item
type ListItem =
    | { kind: 'expense'; data: Expense }
    | { kind: 'transaction'; data: Transaction; personName: string };

const INCOME_TYPES: IncomeType[] = ['Salary', 'Freelance', 'Business', 'Investment', 'Other'];

export default function ExpensesDashboard() {
    const router = useRouter();
    const [totalIncome, setTotalIncome] = useState(0);
    const [incomes, setIncomes] = useState<IncomeSource[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [balances, setBalances] = useState<Record<string, number>>({});
    const [totalSpent, setTotalSpent] = useState(0);
    const [txnTotals, setTxnTotals] = useState({ totalIn: 0, totalOut: 0 });

    // Income modal
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
    const [incomeLabel, setIncomeLabel] = useState('');
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeType, setIncomeType] = useState<IncomeType>('Salary');

    const [historyGroups, setHistoryGroups] = useState<Record<string, Expense[]>>({});
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const loadData = useCallback(async () => {
        const [allIncomes, total, exp, txns, ppl, bals, spent, totals, hGroups] = await Promise.all([
            getAllIncomes(),
            getTotalIncome(),
            getCurrentMonthExpenses(),
            getCurrentMonthTransactions(),
            getAllPersons(),
            getAllPersonBalances(),
            getMonthlyTotal(),
            getMonthlyTransactionTotals(),
            getPreviousMonthsExpenses(),
        ]);
        setIncomes(allIncomes);
        setTotalIncome(total);
        setExpenses(exp);
        setTransactions(txns);
        setPersons(ppl);
        setBalances(bals);
        setTotalSpent(spent);
        setTxnTotals(totals);
        setHistoryGroups(hGroups);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    // Calculations
    const totalOut = totalSpent + txnTotals.totalOut;
    const totalIn = txnTotals.totalIn;
    const remaining = totalIncome + totalIn - totalOut;
    const percentSpent = totalIncome > 0 ? Math.min((totalOut / totalIncome) * 100, 100) : 0;

    const getProgressColor = () => {
        if (percentSpent >= 90) return Colors.danger;
        if (percentSpent >= 70) return Colors.warning;
        return Colors.secondary;
    };

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Merge expenses + transactions into unified list
    const personMap = new Map(persons.map((p) => [p.id, p]));
    const unified: ListItem[] = [
        ...expenses.map((e): ListItem => ({ kind: 'expense', data: e })),
        ...transactions.map((t): ListItem => ({
            kind: 'transaction',
            data: t,
            personName: personMap.get(t.personId)?.name || 'Unknown',
        })),
    ].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

    // Income modal handlers
    const openAddIncome = () => {
        setEditingIncome(null);
        setIncomeLabel('');
        setIncomeAmount('');
        setIncomeType('Freelance');
        setShowIncomeModal(true);
    };

    const openEditIncome = (inc: IncomeSource) => {
        setEditingIncome(inc);
        setIncomeLabel(inc.label);
        setIncomeAmount(inc.amount.toString());
        setIncomeType(inc.type);
        setShowIncomeModal(true);
    };

    const handleSaveIncome = async () => {
        const num = parseFloat(incomeAmount);
        if (!incomeLabel.trim()) { Alert.alert('Error', 'Enter an income label'); return; }
        if (isNaN(num) || num <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
        await saveIncome({
            id: editingIncome?.id || generateId(),
            label: incomeLabel.trim(),
            type: incomeType,
            amount: num,
            createdAt: editingIncome?.createdAt || new Date().toISOString(),
        });
        setShowIncomeModal(false);
        await loadData();
    };

    const handleDeleteIncome = (inc: IncomeSource) => {
        Alert.alert('Delete Income', `Remove "${inc.label}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteIncome(inc.id); await loadData(); } },
        ]);
    };

    const handleDeleteExpense = (expense: Expense) => {
        Alert.alert('Delete', `Delete this ${expense.category} expense?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExpense(expense.id); await loadData(); } },
        ]);
    };

    const handleDeleteTransaction = (txn: Transaction, personName: string) => {
        Alert.alert('Delete', `Delete this ${txn.type === 'cashin' ? 'cash in' : 'cash out'} with ${personName}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTransaction(txn.id); await loadData(); } },
        ]);
    };

    const handleReset = () => {
        Alert.alert('Reset All Data', 'Delete all incomes, expenses, transactions, and people?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: async () => { await resetExpenseData(); await loadData(); } },
        ]);
    };

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.kind === 'expense') {
            const e = item.data;
            return (
                <View style={st.txnCard}>
                    <View style={[st.categoryDot, { backgroundColor: categoryColors[e.category] }]} />
                    <View style={st.txnInfo}>
                        <Text style={st.txnTitle}>{e.category}</Text>
                        <Text style={st.txnSub}>
                            {e.note || new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                    <Text style={[st.txnAmount, { color: Colors.danger }]}>-Rs {e.amount.toLocaleString()}</Text>
                    <TouchableOpacity onPress={() => handleDeleteExpense(e)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close-circle-outline" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            );
        }
        const t = item.data;
        const pName = item.personName;
        const isCashIn = t.type === 'cashin';
        return (
            <View style={st.txnCard}>
                <View style={[st.personDot, { backgroundColor: getPersonColor(t.personId) }]}>
                    <Text style={st.personDotText}>{getInitials(pName)}</Text>
                </View>
                <View style={st.txnInfo}>
                    <Text style={st.txnTitle}>
                        {isCashIn ? `Received from ${pName}` : `Paid to ${pName}`}
                    </Text>
                    <Text style={st.txnSub}>
                        {t.note || t.category} · {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                </View>
                <Text style={[st.txnAmount, { color: isCashIn ? Colors.secondary : Colors.danger }]}>
                    {isCashIn ? '+' : '-'}Rs {t.amount.toLocaleString()}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteTransaction(t, pName)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={st.container}>
            {/* Header */}
            <View style={st.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={st.title}>Wallet</Text>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => router.push('/expenses/people' as any)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="people-outline" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleReset} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="refresh" size={22} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={st.monthLabel}>{currentMonth}</Text>
            </View>

            <FlatList
                data={unified}
                keyExtractor={(item) => item.kind === 'expense' ? `e-${item.data.id}` : `t-${item.data.id}`}
                renderItem={renderItem}
                contentContainerStyle={st.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* ──── Income Sources Section ──── */}
                        <View style={st.incomeSection}>
                            <View style={st.incomeTitleRow}>
                                <Text style={st.sectionTitle}>Income Sources</Text>
                                <TouchableOpacity onPress={openAddIncome} style={st.addIncomeBtn}>
                                    <Ionicons name="add" size={16} color="#fff" />
                                    <Text style={st.addIncomeBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>

                            {incomes.length === 0 ? (
                                <TouchableOpacity style={st.emptyIncomeCard} onPress={openAddIncome}>
                                    <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
                                    <Text style={st.emptyIncomeText}>Add your first income source</Text>
                                    <Text style={st.emptyIncomeSub}>Salary, Freelance, Business…</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    {/* Total Income Banner */}
                                    <View style={st.totalIncomeBanner}>
                                        <Text style={st.totalIncomeLabel}>Total Monthly Income</Text>
                                        <Text style={st.totalIncomeAmount}>Rs {totalIncome.toLocaleString()}</Text>
                                    </View>

                                    {/* Income Cards */}
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.incomeScroll}>
                                        {incomes.map((inc) => {
                                            const iconName = INCOME_ICONS[inc.type] || 'cash-outline';
                                            const accent = INCOME_COLORS[inc.type] || '#6C63FF';
                                            return (
                                                <TouchableOpacity
                                                    key={inc.id}
                                                    style={st.incomeCard}
                                                    onPress={() => openEditIncome(inc)}
                                                    onLongPress={() => handleDeleteIncome(inc)}
                                                    activeOpacity={0.85}
                                                >
                                                    <View style={[st.incomeIcon, { backgroundColor: accent + '20' }]}>
                                                        <Ionicons name={iconName as any} size={20} color={accent} />
                                                    </View>
                                                    <Text style={st.incomeCardLabel} numberOfLines={1}>{inc.label}</Text>
                                                    <Text style={st.incomeCardType}>{inc.type}</Text>
                                                    <Text style={[st.incomeCardAmount, { color: accent }]}>Rs {inc.amount.toLocaleString()}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </>
                            )}
                        </View>

                        {/* Balance Overview */}
                        <View style={st.balanceCard}>
                            <View style={st.balanceRow}>
                                <View>
                                    <Text style={st.balanceLabel}>Remaining</Text>
                                    <Text style={[st.balanceAmountLg, remaining < 0 && { color: Colors.danger }]}>
                                        Rs {remaining.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={st.balanceLabel}>Total Out</Text>
                                    <Text style={st.spentAmountLg}>Rs {totalOut.toLocaleString()}</Text>
                                </View>
                            </View>
                            <View style={st.progressBarBg}>
                                <View style={[st.progressBarFill, { width: `${percentSpent}%`, backgroundColor: getProgressColor() }]} />
                            </View>
                            <View style={st.balanceChips}>
                                <View style={[st.miniChip, { backgroundColor: Colors.secondary + '18' }]}>
                                    <Ionicons name="arrow-down" size={12} color={Colors.secondary} />
                                    <Text style={[st.miniChipText, { color: Colors.secondary }]}>In: Rs {totalIn.toLocaleString()}</Text>
                                </View>
                                <View style={[st.miniChip, { backgroundColor: Colors.danger + '18' }]}>
                                    <Ionicons name="arrow-up" size={12} color={Colors.danger} />
                                    <Text style={[st.miniChipText, { color: Colors.danger }]}>Out: Rs {totalOut.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>

                        {/* People Section */}
                        {persons.length > 0 && (
                            <View style={st.peopleSection}>
                                <View style={st.peopleTitleRow}>
                                    <Text style={st.sectionTitle}>People</Text>
                                    <TouchableOpacity onPress={() => router.push('/expenses/people' as any)}>
                                        <Text style={st.seeAllText}>See All</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.peopleScroll}>
                                    {persons.slice(0, 10).map((p) => {
                                        const bal = balances[p.id] || 0;
                                        const positive = bal >= 0;
                                        return (
                                            <TouchableOpacity
                                                key={p.id}
                                                style={st.personCard}
                                                onPress={() => router.push({ pathname: '/expenses/person-detail', params: { personId: p.id } } as any)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={[st.personAvatar, { backgroundColor: getPersonColor(p.id) }]}>
                                                    <Text style={st.personAvatarText}>{getInitials(p.name)}</Text>
                                                </View>
                                                <Text style={st.personName} numberOfLines={1}>{p.name}</Text>
                                                <Text style={[st.personBal, { color: positive ? Colors.secondary : Colors.danger }]}>
                                                    {positive ? '+' : ''}{bal.toLocaleString()}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        {/* Recent label + buttons */}
                        <View style={st.recentHeader}>
                            <Text style={st.sectionTitle}>Recent</Text>
                            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                                <TouchableOpacity
                                    style={[st.actionBtn, { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border }]}
                                    onPress={() => setShowHistoryModal(true)}
                                >
                                    <Ionicons name="time-outline" size={16} color={Colors.textPrimary} />
                                    <Text style={[st.actionBtnText, { color: Colors.textPrimary }]}>History</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={st.actionBtn}
                                    onPress={() => router.push('/expenses/add' as any)}
                                >
                                    <Ionicons name="add" size={18} color="#fff" />
                                    <Text style={st.actionBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={st.emptyContainer}>
                        <Ionicons name="wallet-outline" size={40} color={Colors.border} />
                        <Text style={st.emptyText}>No transactions this month</Text>
                    </View>
                }
            />

            {/* ──── Add / Edit Income Modal ──── */}
            <Modal visible={showIncomeModal} transparent animationType="fade" onRequestClose={() => setShowIncomeModal(false)}>
                <TouchableWithoutFeedback onPress={() => setShowIncomeModal(false)}>
                    <View style={st.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={st.modalContent}>
                                <Text style={st.modalTitle}>{editingIncome ? 'Edit Income' : 'Add Income Source'}</Text>

                                {/* Income Type */}
                                <Text style={st.modalLabel}>TYPE</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        {INCOME_TYPES.map((type) => {
                                            const active = incomeType === type;
                                            const accent = INCOME_COLORS[type];
                                            return (
                                                <TouchableOpacity
                                                    key={type}
                                                    style={[st.typeChip, active && { backgroundColor: accent, borderColor: accent }]}
                                                    onPress={() => {
                                                        setIncomeType(type);
                                                        if (!incomeLabel.trim() || INCOME_TYPES.includes(incomeLabel.trim() as IncomeType)) {
                                                            setIncomeLabel(type);
                                                        }
                                                    }}
                                                >
                                                    <Ionicons name={INCOME_ICONS[type] as any} size={16} color={active ? '#fff' : accent} />
                                                    <Text style={[st.typeChipText, { color: active ? '#fff' : accent }]}>{type}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </ScrollView>

                                {/* Label */}
                                <Text style={st.modalLabel}>LABEL</Text>
                                <TextInput
                                    style={st.modalInput}
                                    placeholder="e.g. Main Job, Fiverr, etc."
                                    placeholderTextColor={Colors.textSecondary}
                                    value={incomeLabel}
                                    onChangeText={setIncomeLabel}
                                    maxLength={30}
                                />

                                {/* Amount */}
                                <Text style={st.modalLabel}>MONTHLY AMOUNT (Rs)</Text>
                                <TextInput
                                    style={st.modalInput}
                                    placeholder="e.g. 50000"
                                    placeholderTextColor={Colors.textSecondary}
                                    value={incomeAmount}
                                    onChangeText={setIncomeAmount}
                                    keyboardType="numeric"
                                />

                                <View style={st.modalActions}>
                                    <TouchableOpacity onPress={() => setShowIncomeModal(false)} style={st.modalCancelBtn}>
                                        <Text style={st.modalCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSaveIncome} style={st.modalSaveBtn}>
                                        <Text style={st.modalSaveText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* History Modal */}
            <Modal visible={showHistoryModal} transparent animationType="slide">
                <View style={st.fullModalOverlay}>
                    <View style={st.fullModalContent}>
                        <View style={st.fullModalHeader}>
                            <Text style={st.fullModalTitle}>Expense History</Text>
                            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                                <Ionicons name="close" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={Object.keys(historyGroups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())}
                            keyExtractor={(item) => item}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item: month }) => (
                                <View style={{ marginBottom: Spacing.xl }}>
                                    <Text style={st.historyMonth}>{month}</Text>
                                    <View style={{ backgroundColor: Colors.white, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: Colors.border }}>
                                        {historyGroups[month].map((exp) => (
                                            <View key={exp.id} style={[st.txnCard, { borderWidth: 0, marginBottom: 0, borderBottomWidth: 1, borderBottomColor: Colors.border, borderRadius: 0, paddingHorizontal: 0 }]}>
                                                <View style={[st.categoryDot, { backgroundColor: categoryColors[exp.category] }]} />
                                                <View style={st.txnInfo}>
                                                    <Text style={st.txnTitle}>{exp.category}</Text>
                                                    <Text style={st.txnSub}>{exp.note || new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                                                </View>
                                                <Text style={[st.txnAmount, { color: Colors.danger }]}>-Rs {exp.amount.toLocaleString()}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={st.emptyContainer}>
                                    <Ionicons name="time-outline" size={40} color={Colors.border} />
                                    <Text style={st.emptyText}>No previous history found</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: Spacing.sm },
    title: { ...Typography.heading, fontSize: 28 },
    monthLabel: { ...Typography.bodySmall, marginTop: 2 },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

    /* Income section */
    incomeSection: { marginTop: Spacing.md },
    incomeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    sectionTitle: { ...Typography.headingSmall, fontSize: 18 },
    addIncomeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
    addIncomeBtnText: { ...Typography.button, fontSize: 12 },

    emptyIncomeCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1.5, borderColor: Colors.primary + '40', borderStyle: 'dashed' },
    emptyIncomeText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Colors.primary, marginTop: Spacing.sm },
    emptyIncomeSub: { ...Typography.label, fontSize: 12, marginTop: 2 },

    totalIncomeBanner: { backgroundColor: Colors.primary + '10', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '25' },
    totalIncomeLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.primary },
    totalIncomeAmount: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: Colors.primary },

    incomeScroll: { gap: 10, paddingBottom: 4 },
    incomeCard: { width: 130, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.sm + 2, borderWidth: 1, borderColor: Colors.border, ...Shadows.card },
    incomeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    incomeCardLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.textPrimary },
    incomeCardType: { ...Typography.label, fontSize: 10, marginBottom: 4 },
    incomeCardAmount: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },

    /* Balance */
    balanceCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.card },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    balanceLabel: { ...Typography.label, fontSize: 12 },
    balanceAmountLg: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: Colors.secondary, marginTop: 2 },
    spentAmountLg: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: Colors.textPrimary, marginTop: 2 },
    progressBarBg: { height: 8, backgroundColor: Colors.card, borderRadius: 4, marginTop: Spacing.md, overflow: 'hidden' },
    progressBarFill: { height: 8, borderRadius: 4 },
    balanceChips: { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
    miniChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    miniChipText: { fontFamily: 'Poppins_500Medium', fontSize: 12 },

    /* People */
    peopleSection: { marginTop: Spacing.lg },
    peopleTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    seeAllText: { ...Typography.label, color: Colors.primary, fontSize: 13 },
    peopleScroll: { gap: 12 },
    personCard: { alignItems: 'center', width: 72 },
    personAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    personAvatarText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
    personName: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: Colors.textPrimary, textAlign: 'center' },
    personBal: { fontFamily: 'Poppins_600SemiBold', fontSize: 11 },

    /* Recent */
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.md },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm },
    actionBtnText: { ...Typography.button, fontSize: 13 },

    /* Transaction card */
    txnCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
    personDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
    personDotText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
    txnInfo: { flex: 1 },
    txnTitle: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Colors.textPrimary },
    txnSub: { ...Typography.label, fontSize: 11 },
    txnAmount: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, marginRight: Spacing.sm },
    emptyContainer: { alignItems: 'center', paddingTop: Spacing.xl },
    emptyText: { ...Typography.bodySmall, marginTop: Spacing.sm },

    /* Modals */
    modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: Spacing.lg },
    modalContent: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg },
    modalTitle: { ...Typography.headingSmall, marginBottom: Spacing.md },
    modalLabel: { ...Typography.label, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: Spacing.sm },
    modalInput: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, fontFamily: 'Poppins_400Regular', fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.sm },
    modalCancelBtn: { padding: Spacing.sm },
    modalCancelText: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: Colors.textSecondary },
    modalSaveBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.sm },
    modalSaveText: { ...Typography.button, fontSize: 15 },

    typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
    typeChipText: { fontFamily: 'Poppins_500Medium', fontSize: 12 },

    fullModalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
    fullModalContent: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, padding: Spacing.lg, height: '85%' },
    fullModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    fullModalTitle: { ...Typography.headingSmall, fontSize: 20 },
    historyMonth: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.sm },
});
