import AsyncStorage from '@react-native-async-storage/async-storage';

const SALARY_KEY = 'expense_salary';
const EXPENSES_KEY = 'expense_list';

export type ExpenseCategory = 'Food' | 'Rent' | 'Transport' | 'Shopping' | 'Bills' | 'Other';

export interface Expense {
    id: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
    note?: string;
    createdAt: string;
}

export const getSalary = async (): Promise<number> => {
    try {
        const val = await AsyncStorage.getItem(SALARY_KEY);
        return val ? parseFloat(val) : 0;
    } catch (e) {
        console.error("AsyncStorage error in getSalary", e);
        return 0;
    }
};

export const setSalary = async (amount: number): Promise<void> => {
    try {
        await AsyncStorage.setItem(SALARY_KEY, amount.toString());
    } catch (e) {
        console.error("AsyncStorage error in setSalary", e);
    }
};

export const getAllExpenses = async (): Promise<Expense[]> => {
    try {
        const json = await AsyncStorage.getItem(EXPENSES_KEY);
        if (!json) return [];
        return JSON.parse(json) as Expense[];
    } catch (e) {
        console.error("AsyncStorage error in getAllExpenses", e);
        return [];
    }
};

export const getCurrentMonthExpenses = async (): Promise<Expense[]> => {
    try {
        const all = await getAllExpenses();
        const now = new Date();
        return all.filter((e) => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
        console.error('Error fetching current month expenses:', e);
        return [];
    }
};

export const addExpense = async (expense: Expense): Promise<void> => {
    try {
        const all = await getAllExpenses();
        all.unshift(expense);
        await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
    } catch (e) {
        console.error("AsyncStorage error in addExpense", e);
    }
};

export const deleteExpense = async (id: string): Promise<void> => {
    try {
        const all = await getAllExpenses();
        const filtered = all.filter(e => e.id !== id);
        await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.error("AsyncStorage error in deleteExpense", e);
    }
};

export const getMonthlyTotal = async (): Promise<number> => {
    try {
        const expenses = await getCurrentMonthExpenses();
        return expenses.reduce((sum, e) => sum + e.amount, 0);
    } catch (e) {
        return 0;
    }
};

export const getCategoryTotals = async (): Promise<Record<ExpenseCategory, number>> => {
    try {
        const expenses = await getCurrentMonthExpenses();
        const totals: Record<ExpenseCategory, number> = {
            Food: 0, Rent: 0, Transport: 0, Shopping: 0, Bills: 0, Other: 0,
        };
        expenses.forEach(e => { totals[e.category] += e.amount; });
        return totals;
    } catch (e) {
        return { Food: 0, Rent: 0, Transport: 0, Shopping: 0, Bills: 0, Other: 0 };
    }
};

export const resetExpenseData = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(SALARY_KEY);
        await AsyncStorage.removeItem(EXPENSES_KEY);
    } catch (e) {
        console.error("AsyncStorage error resetting data", e);
    }
};

export const getPreviousMonthsExpenses = async (): Promise<Record<string, Expense[]>> => {
    try {
        const all = await getAllExpenses();
        const now = new Date();
        const history: Record<string, Expense[]> = {};
        
        all.forEach(e => {
            const d = new Date(e.date);
            // Skip current month
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                return;
            }
            
            const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!history[monthKey]) history[monthKey] = [];
            history[monthKey].push(e);
        });
        
        return history;
    } catch (e) {
        console.error('Error fetching history:', e);
        return {};
    }
};
