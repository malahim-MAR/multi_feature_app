import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import {
    deleteTransaction,
    ExpenseCategory,
    getAllPersons,
    getInitials,
    getPersonBalance,
    getPersonColor,
    getTransactionsByPerson,
    Person,
    Transaction,
} from '../../../services/expenseStorage';

const categoryColors: Record<ExpenseCategory, string> = {
    Food: Colors.categoryFood,
    Rent: Colors.categoryRent,
    Transport: Colors.categoryTransport,
    Shopping: Colors.categoryShopping,
    Bills: Colors.categoryBills,
    Other: Colors.categoryOther,
};

export default function PersonDetailScreen() {
    const router = useRouter();
    const { personId } = useLocalSearchParams<{ personId: string }>();
    const [person, setPerson] = useState<Person | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [balance, setBalance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const ppl = await getAllPersons();
        const p = ppl.find((pp) => pp.id === personId) || null;
        setPerson(p);
        if (p) {
            const [txns, bal] = await Promise.all([
                getTransactionsByPerson(p.id),
                getPersonBalance(p.id),
            ]);
            setTransactions(txns);
            setBalance(bal);
        }
    }, [personId]);

    useFocusEffect(useCallback(() => { load(); }, [load]));
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleDeleteTxn = (txn: Transaction) => {
        Alert.alert('Delete', 'Delete this transaction?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTransaction(txn.id); await load(); } },
        ]);
    };

    if (!person) {
        return (
            <View style={s.container}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
                    <Text style={s.headerTitle}>Person</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={s.empty}><Text style={s.emptyText}>Person not found</Text></View>
            </View>
        );
    }

    const positive = balance >= 0;
    const totalIn = transactions.filter((t) => t.type === 'cashin').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = transactions.filter((t) => t.type === 'cashout').reduce((sum, t) => sum + t.amount, 0);

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>{person.name}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/expenses/add', params: { prefillPerson: person.name } } as any)}>
                    <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Person Summary Card */}
                <View style={s.summaryCard}>
                    <View style={[s.avatarLg, { backgroundColor: getPersonColor(person.id) }]}>
                        <Text style={s.avatarLgText}>{getInitials(person.name)}</Text>
                    </View>
                    <Text style={s.personNameLg}>{person.name}</Text>

                    <View style={s.balanceRow}>
                        <Text style={s.balLabel}>Net Balance</Text>
                        <Text style={[s.balAmount, { color: positive ? Colors.secondary : Colors.danger }]}>
                            {positive ? '+' : ''}Rs {balance.toLocaleString()}
                        </Text>
                        <Text style={s.balHint}>
                            {positive
                                ? `${person.name} owes you Rs ${balance.toLocaleString()}`
                                : `You owe ${person.name} Rs ${Math.abs(balance).toLocaleString()}`}
                        </Text>
                    </View>

                    <View style={s.statsRow}>
                        <View style={[s.statChip, { backgroundColor: Colors.secondary + '15' }]}>
                            <Ionicons name="arrow-down" size={14} color={Colors.secondary} />
                            <Text style={[s.statText, { color: Colors.secondary }]}>In: Rs {totalIn.toLocaleString()}</Text>
                        </View>
                        <View style={[s.statChip, { backgroundColor: Colors.danger + '15' }]}>
                            <Ionicons name="arrow-up" size={14} color={Colors.danger} />
                            <Text style={[s.statText, { color: Colors.danger }]}>Out: Rs {totalOut.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Transaction list */}
                <Text style={s.sectionTitle}>Transactions ({transactions.length})</Text>

                {transactions.length === 0 ? (
                    <View style={s.empty}>
                        <Ionicons name="swap-horizontal-outline" size={40} color={Colors.border} />
                        <Text style={s.emptyText}>No transactions yet</Text>
                    </View>
                ) : (
                    transactions.map((txn) => {
                        const isCashIn = txn.type === 'cashin';
                        return (
                            <View key={txn.id} style={s.txnCard}>
                                <View style={[s.txnIcon, { backgroundColor: isCashIn ? Colors.secondary + '18' : Colors.danger + '18' }]}>
                                    <Ionicons name={isCashIn ? 'arrow-down' : 'arrow-up'} size={18} color={isCashIn ? Colors.secondary : Colors.danger} />
                                </View>
                                <View style={s.txnInfo}>
                                    <Text style={s.txnTitle}>{isCashIn ? 'Cash In' : 'Cash Out'}</Text>
                                    <Text style={s.txnSub}>
                                        {txn.note || txn.category} · {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </Text>
                                </View>
                                <Text style={[s.txnAmount, { color: isCashIn ? Colors.secondary : Colors.danger }]}>
                                    {isCashIn ? '+' : '-'}Rs {txn.amount.toLocaleString()}
                                </Text>
                                <TouchableOpacity onPress={() => handleDeleteTxn(txn)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name="close-circle-outline" size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { ...Typography.headingSmall, fontSize: 20 },
    scroll: { padding: Spacing.lg, paddingBottom: 40 },

    /* Summary */
    summaryCard: { alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadows.card, marginBottom: Spacing.lg },
    avatarLg: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
    avatarLgText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 24 },
    personNameLg: { ...Typography.headingSmall, fontSize: 20, marginBottom: Spacing.md },
    balanceRow: { alignItems: 'center', marginBottom: Spacing.md },
    balLabel: { ...Typography.label, fontSize: 12 },
    balAmount: { fontFamily: 'Poppins_600SemiBold', fontSize: 28, marginTop: 2 },
    balHint: { ...Typography.bodySmall, fontSize: 13, marginTop: 4, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 12 },
    statChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full },
    statText: { fontFamily: 'Poppins_500Medium', fontSize: 13 },

    /* Section */
    sectionTitle: { ...Typography.headingSmall, fontSize: 16, marginBottom: Spacing.md },

    /* Transaction card */
    txnCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    txnIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
    txnInfo: { flex: 1 },
    txnTitle: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Colors.textPrimary },
    txnSub: { ...Typography.label, fontSize: 11 },
    txnAmount: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, marginRight: Spacing.sm },

    empty: { alignItems: 'center', paddingTop: Spacing.xl },
    emptyText: { ...Typography.bodySmall, marginTop: Spacing.sm },
});
