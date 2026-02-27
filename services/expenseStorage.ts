import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
//  Storage Keys
// ─────────────────────────────────────────────
const SALARY_KEY = 'expense_salary';
const INCOMES_KEY = 'wallet_incomes';
const EXPENSES_KEY = 'expense_list';
const PERSONS_KEY = 'wallet_persons';
const TRANSACTIONS_KEY = 'wallet_transactions';

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
export type ExpenseCategory = 'Food' | 'Rent' | 'Transport' | 'Shopping' | 'Bills' | 'Other';

export interface Expense {
    id: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
    note?: string;
    createdAt: string;
}

export interface Person {
    id: string;
    name: string;
    avatar?: string; // initials-based, generated from name
    createdAt: string;
}

export interface Transaction {
    id: string;
    type: 'cashin' | 'cashout';
    amount: number;
    personId: string;
    category: ExpenseCategory;
    note?: string;
    date: string;
    createdAt: string;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
export const generateId = (): string =>
    Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

export const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

// Person avatar colors
export const PERSON_COLORS = [
    '#6C63FF', '#FF6B6B', '#00D4AA', '#FFD700', '#FF8C42',
    '#A29BFE', '#55E6C1', '#F368E0', '#48DBFB', '#FF6348',
];

export const getPersonColor = (id: string): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return PERSON_COLORS[Math.abs(hash) % PERSON_COLORS.length];
};

// ─────────────────────────────────────────────
//  Income Sources (multi-income)
// ─────────────────────────────────────────────

export type IncomeType = 'Salary' | 'Freelance' | 'Business' | 'Investment' | 'Other';

export const INCOME_ICONS: Record<IncomeType, string> = {
    Salary: 'briefcase-outline',
    Freelance: 'laptop-outline',
    Business: 'storefront-outline',
    Investment: 'trending-up-outline',
    Other: 'cash-outline',
};

export const INCOME_COLORS: Record<IncomeType, string> = {
    Salary: '#6C63FF',
    Freelance: '#00D4AA',
    Business: '#FF8C42',
    Investment: '#48DBFB',
    Other: '#A29BFE',
};

export interface IncomeSource {
    id: string;
    label: string;       // user-defined name e.g. "Main Job", "Fiverr"
    type: IncomeType;
    amount: number;
    createdAt: string;
}

export const getAllIncomes = async (): Promise<IncomeSource[]> => {
    try {
        const json = await AsyncStorage.getItem(INCOMES_KEY);
        if (json) return JSON.parse(json);
        // Migration: if old salary key exists, migrate it
        const oldSalary = await AsyncStorage.getItem(SALARY_KEY);
        if (oldSalary && parseFloat(oldSalary) > 0) {
            const migrated: IncomeSource[] = [{
                id: generateId(),
                label: 'Salary',
                type: 'Salary',
                amount: parseFloat(oldSalary),
                createdAt: new Date().toISOString(),
            }];
            await AsyncStorage.setItem(INCOMES_KEY, JSON.stringify(migrated));
            await AsyncStorage.removeItem(SALARY_KEY);
            return migrated;
        }
        return [];
    } catch { return []; }
};

export const saveIncome = async (income: IncomeSource): Promise<void> => {
    const all = await getAllIncomes();
    const idx = all.findIndex((i) => i.id === income.id);
    if (idx >= 0) all[idx] = income;
    else all.unshift(income);
    await AsyncStorage.setItem(INCOMES_KEY, JSON.stringify(all));
};

export const deleteIncome = async (id: string): Promise<void> => {
    const all = await getAllIncomes();
    await AsyncStorage.setItem(INCOMES_KEY, JSON.stringify(all.filter((i) => i.id !== id)));
};

export const getTotalIncome = async (): Promise<number> => {
    const all = await getAllIncomes();
    return all.reduce((sum, i) => sum + i.amount, 0);
};

// Backward-compat shims
export const getSalary = async (): Promise<number> => getTotalIncome();
export const setSalary = async (amount: number): Promise<void> => {
    const all = await getAllIncomes();
    const salarySource = all.find((i) => i.type === 'Salary');
    if (salarySource) {
        salarySource.amount = amount;
        await AsyncStorage.setItem(INCOMES_KEY, JSON.stringify(all));
    } else {
        await saveIncome({ id: generateId(), label: 'Salary', type: 'Salary', amount, createdAt: new Date().toISOString() });
    }
};

// ─────────────────────────────────────────────
//  Legacy Expense CRUD (backward compat)
// ─────────────────────────────────────────────
export const getAllExpenses = async (): Promise<Expense[]> => {
    try {
        const json = await AsyncStorage.getItem(EXPENSES_KEY);
        return json ? JSON.parse(json) : [];
    } catch { return []; }
};

export const getCurrentMonthExpenses = async (): Promise<Expense[]> => {
    const all = await getAllExpenses();
    const now = new Date();
    return all
        .filter((e) => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addExpense = async (expense: Expense): Promise<void> => {
    const all = await getAllExpenses();
    all.unshift(expense);
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
};

export const deleteExpense = async (id: string): Promise<void> => {
    const all = await getAllExpenses();
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(all.filter((e) => e.id !== id)));
};

export const getMonthlyTotal = async (): Promise<number> => {
    const expenses = await getCurrentMonthExpenses();
    return expenses.reduce((sum, e) => sum + e.amount, 0);
};

export const getCategoryTotals = async (): Promise<Record<ExpenseCategory, number>> => {
    const expenses = await getCurrentMonthExpenses();
    const t: Record<ExpenseCategory, number> = { Food: 0, Rent: 0, Transport: 0, Shopping: 0, Bills: 0, Other: 0 };
    expenses.forEach((e) => { t[e.category] += e.amount; });
    return t;
};

export const resetExpenseData = async (): Promise<void> => {
    await AsyncStorage.multiRemove([SALARY_KEY, INCOMES_KEY, EXPENSES_KEY, TRANSACTIONS_KEY, PERSONS_KEY]);
};

export const getPreviousMonthsExpenses = async (): Promise<Record<string, Expense[]>> => {
    const all = await getAllExpenses();
    const now = new Date();
    const history: Record<string, Expense[]> = {};
    all.forEach((e) => {
        const d = new Date(e.date);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) return;
        const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!history[key]) history[key] = [];
        history[key].push(e);
    });
    return history;
};

// ─────────────────────────────────────────────
//  Person CRUD
// ─────────────────────────────────────────────
export const getAllPersons = async (): Promise<Person[]> => {
    try {
        const json = await AsyncStorage.getItem(PERSONS_KEY);
        return json ? JSON.parse(json) : [];
    } catch { return []; }
};

export const savePerson = async (person: Person): Promise<void> => {
    const all = await getAllPersons();
    const idx = all.findIndex((p) => p.id === person.id);
    if (idx >= 0) all[idx] = person;
    else all.unshift(person);
    await AsyncStorage.setItem(PERSONS_KEY, JSON.stringify(all));
};

export const deletePerson = async (id: string): Promise<void> => {
    const all = await getAllPersons();
    await AsyncStorage.setItem(PERSONS_KEY, JSON.stringify(all.filter((p) => p.id !== id)));
    // Also delete all transactions linked to this person
    const txns = await getAllTransactions();
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txns.filter((t) => t.personId !== id)));
};

export const getOrCreatePerson = async (name: string): Promise<Person> => {
    const all = await getAllPersons();
    const existing = all.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;
    const person: Person = { id: generateId(), name: name.trim(), createdAt: new Date().toISOString() };
    await savePerson(person);
    return person;
};

// ─────────────────────────────────────────────
//  Transaction CRUD
// ─────────────────────────────────────────────
export const getAllTransactions = async (): Promise<Transaction[]> => {
    try {
        const json = await AsyncStorage.getItem(TRANSACTIONS_KEY);
        return json ? JSON.parse(json) : [];
    } catch { return []; }
};

export const addTransaction = async (txn: Transaction): Promise<void> => {
    const all = await getAllTransactions();
    all.unshift(txn);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(all));
};

export const deleteTransaction = async (id: string): Promise<void> => {
    const all = await getAllTransactions();
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(all.filter((t) => t.id !== id)));
};

export const getTransactionsByPerson = async (personId: string): Promise<Transaction[]> => {
    const all = await getAllTransactions();
    return all
        .filter((t) => t.personId === personId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getCurrentMonthTransactions = async (): Promise<Transaction[]> => {
    const all = await getAllTransactions();
    const now = new Date();
    return all
        .filter((t) => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ─────────────────────────────────────────────
//  Per-Person Balance
// ─────────────────────────────────────────────
/** Positive = person owes you, Negative = you owe person */
export const getPersonBalance = async (personId: string): Promise<number> => {
    const txns = await getTransactionsByPerson(personId);
    return txns.reduce((bal, t) => {
        if (t.type === 'cashin') return bal + t.amount;  // money received from them
        return bal - t.amount; // money given to them
    }, 0);
};

/** All-person balances in one call */
export const getAllPersonBalances = async (): Promise<Record<string, number>> => {
    const txns = await getAllTransactions();
    const balances: Record<string, number> = {};
    txns.forEach((t) => {
        if (!balances[t.personId]) balances[t.personId] = 0;
        if (t.type === 'cashin') balances[t.personId] += t.amount;
        else balances[t.personId] -= t.amount;
    });
    return balances;
};

// ─────────────────────────────────────────────
//  Monthly summaries (transactions)
// ─────────────────────────────────────────────
export const getMonthlyTransactionTotals = async (): Promise<{ totalIn: number; totalOut: number }> => {
    const txns = await getCurrentMonthTransactions();
    let totalIn = 0;
    let totalOut = 0;
    txns.forEach((t) => {
        if (t.type === 'cashin') totalIn += t.amount;
        else totalOut += t.amount;
    });
    return { totalIn, totalOut };
};
