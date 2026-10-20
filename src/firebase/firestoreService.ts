import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { Expense, ExpenseCategory, Income, MonthData, AppDatabase } from '../types';

export interface RemoteUserData {
  months: Record<string, MonthData>;
  defaultSalary: number;
}

/**
 * Listen to all expenses of a user and invoke callback on real-time update
 */
export function subscribeToUserExpenses(
  userId: string,
  onUpdate: (expenses: (Expense & { monthKey?: string })[]) => void,
  onError?: (err: Error) => void
) {
  const expensesRef = collection(db, 'users', userId, 'expenses');
  return onSnapshot(
    expensesRef,
    (snapshot) => {
      const expenses: (Expense & { monthKey?: string })[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        expenses.push({
          id: data.id || docSnap.id,
          title: data.title,
          amount: Number(data.amount) || 0,
          dueDay: data.dueDay !== undefined ? Number(data.dueDay) : undefined,
          category: data.category as ExpenseCategory,
          isPaid: Boolean(data.isPaid),
          createdAt: data.createdAt || new Date().toISOString(),
          ...(data.monthKey ? { monthKey: data.monthKey } : {}),
        });
      });
      onUpdate(expenses);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/expenses`);
    }
  );
}

/**
 * Listen to all incomes of a user and invoke callback on real-time update
 */
export function subscribeToUserIncomes(
  userId: string,
  onUpdate: (incomes: (Income & { monthKey?: string })[]) => void,
  onError?: (err: Error) => void
) {
  const incomesRef = collection(db, 'users', userId, 'incomes');
  return onSnapshot(
    incomesRef,
    (snapshot) => {
      const incomes: (Income & { monthKey?: string })[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        incomes.push({
          id: data.id || docSnap.id,
          title: data.title,
          amount: Number(data.amount) || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          ...(data.monthKey ? { monthKey: data.monthKey } : {}),
        });
      });
      onUpdate(incomes);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/incomes`);
    }
  );
}

/**
 * Save a single income to Firestore
 */
export async function saveIncome(
  userId: string,
  monthKey: string,
  income: Income
): Promise<void> {
  const path = `users/${userId}/incomes/${income.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'incomes', income.id);
    const payload: Record<string, any> = {
      id: income.id,
      userId,
      monthKey,
      title: income.title.slice(0, 120),
      amount: Math.max(0, income.amount),
      createdAt: income.createdAt || new Date().toISOString(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a single income from Firestore
 */
export async function deleteIncome(userId: string, incomeId: string): Promise<void> {
  const path = `users/${userId}/incomes/${incomeId}`;
  try {
    const docRef = doc(db, 'users', userId, 'incomes', incomeId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Listen to all month summaries (legacy salary & additional income) of a user
 */
export function subscribeToUserMonths(
  userId: string,
  onUpdate: (months: Record<string, { salary: number; additionalIncome: number }>) => void,
  onError?: (err: Error) => void
) {
  const monthsRef = collection(db, 'users', userId, 'months');
  return onSnapshot(
    monthsRef,
    (snapshot) => {
      const monthsMap: Record<string, { salary: number; additionalIncome: number }> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        monthsMap[docSnap.id] = {
          salary: Number(data.salary) || 0,
          additionalIncome: Number(data.additionalIncome) || 0,
        };
      });
      onUpdate(monthsMap);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/months`);
    }
  );
}

/**
 * Save or update salary and additional income for a specific month
 */
export async function saveMonthSummary(
  userId: string,
  monthKey: string,
  salary: number,
  additionalIncome: number
): Promise<void> {
  const path = `users/${userId}/months/${monthKey}`;
  try {
    const docRef = doc(db, 'users', userId, 'months', monthKey);
    await setDoc(
      docRef,
      {
        userId,
        monthKey,
        salary: Math.max(0, salary),
        additionalIncome: Math.max(0, additionalIncome),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save a single expense to Firestore
 */
export async function saveExpense(
  userId: string,
  monthKey: string,
  expense: Expense
): Promise<void> {
  const path = `users/${userId}/expenses/${expense.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'expenses', expense.id);
    const payload: Record<string, any> = {
      id: expense.id,
      userId,
      monthKey,
      title: expense.title.slice(0, 120),
      amount: expense.amount,
      category: expense.category,
      isPaid: Boolean(expense.isPaid),
      createdAt: expense.createdAt || new Date().toISOString(),
    };
    if (expense.dueDay !== undefined && expense.dueDay !== null) {
      payload.dueDay = expense.dueDay;
    }
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a single expense from Firestore
 */
export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  const path = `users/${userId}/expenses/${expenseId}`;
  try {
    const docRef = doc(db, 'users', userId, 'expenses', expenseId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Migrate local database data into Firestore for the signed-in user
 */
export async function migrateLocalDataToCloud(
  userId: string,
  email: string | null,
  localDb: AppDatabase
): Promise<void> {
  try {
    // 1. Save user profile
    const profileRef = doc(db, 'users', userId);
    await setDoc(
      profileRef,
      {
        userId,
        defaultSalary: localDb.defaultSalary || 0,
        email: email || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Iterate each month
    for (const [monthKey, monthData] of Object.entries(localDb.months)) {
      // Save incomes
      if (monthData.incomes && monthData.incomes.length > 0) {
        for (const inc of monthData.incomes) {
          await saveIncome(userId, monthKey, inc);
        }
      } else if (monthData.salary && monthData.salary > 0) {
        // Fallback for legacy
        await saveIncome(userId, monthKey, {
          id: 'inc-sal-' + monthKey,
          title: 'Salário Principal',
          amount: monthData.salary,
          createdAt: new Date().toISOString(),
        });
      }

      // Save expenses
      for (const exp of monthData.expenses) {
        await saveExpense(userId, monthKey, exp);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}
