/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { FinancialSummary } from './components/FinancialSummary';
import { AddExpenseForm } from './components/AddExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { EditExpenseModal } from './components/EditExpenseModal';
import { BackupModal } from './components/BackupModal';
import { IncomesModal } from './components/IncomesModal';
import { Expense, ExpenseCategory, Income, AppDatabase, MonthData } from './types';
import {
  loadDatabase,
  saveDatabase,
  getOrCreateMonth,
  getDefaultDatabase,
} from './utils/storage';
import {
  getCurrentMonthKey,
  getAdjacentMonthKey,
  formatMonthName,
} from './utils/formatters';
import { auth, googleProvider } from './firebase/config';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  subscribeToUserExpenses,
  subscribeToUserIncomes,
  subscribeToUserMonths,
  saveExpense,
  saveIncome,
  deleteExpense as deleteFirestoreExpense,
  deleteIncome as deleteFirestoreIncome,
  migrateLocalDataToCloud,
} from './firebase/firestoreService';
import { Check, Cloud } from 'lucide-react';

export default function App() {
  const [database, setDatabase] = useState<AppDatabase>(() => loadDatabase());
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(() =>
    getCurrentMonthKey()
  );
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isIncomesModalOpen, setIsIncomesModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication & Cloud Sync
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudSyncedOnce, setCloudSyncedOnce] = useState(false);

  // Keep a ref to database for migration without stale closure
  const dbRef = useRef(database);
  useEffect(() => {
    dbRef.current = database;
  }, [database]);

  // Flash toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to localStorage as offline fallback / backup
  useEffect(() => {
    saveDatabase(database);
  }, [database]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsSyncing(true);
        showToast(
          `Conectado à nuvem como ${currentUser.displayName || currentUser.email}!`
        );
      } else {
        setCloudSyncedOnce(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore real-time updates when user is logged in
  useEffect(() => {
    if (!user) return;

    let remoteMonthsMap: Record<string, { salary: number; additionalIncome: number }> = {};
    let remoteExpensesList: (Expense & { monthKey?: string })[] = [];
    let remoteIncomesList: (Income & { monthKey?: string })[] = [];

    const updateCombinedData = () => {
      setDatabase((prev) => {
        const hasRemoteData =
          Object.keys(remoteMonthsMap).length > 0 ||
          remoteExpensesList.length > 0 ||
          remoteIncomesList.length > 0;

        const newMonths: Record<string, MonthData> = hasRemoteData
          ? {}
          : { ...prev.months };

        // 1. Group remote expenses by month
        const groupedExpenses: Record<string, Expense[]> = {};
        remoteExpensesList.forEach((exp) => {
          const mKey = exp.monthKey || currentMonthKey;
          if (!groupedExpenses[mKey]) groupedExpenses[mKey] = [];
          groupedExpenses[mKey].push({
            id: exp.id,
            title: exp.title,
            amount: exp.amount,
            dueDay: exp.dueDay,
            category: exp.category,
            isPaid: exp.isPaid,
            createdAt: exp.createdAt,
          });
        });

        // 2. Group remote incomes by month
        const groupedIncomes: Record<string, Income[]> = {};
        remoteIncomesList.forEach((inc) => {
          const mKey = inc.monthKey || currentMonthKey;
          if (!groupedIncomes[mKey]) groupedIncomes[mKey] = [];
          groupedIncomes[mKey].push({
            id: inc.id,
            title: inc.title,
            amount: inc.amount,
            createdAt: inc.createdAt,
          });
        });

        // 3. Populate months from remote summaries and grouped data
        const allKnownMonthKeys = new Set([
          ...Object.keys(remoteMonthsMap),
          ...Object.keys(groupedExpenses),
          ...Object.keys(groupedIncomes),
          currentMonthKey,
        ]);

        allKnownMonthKeys.forEach((mKey) => {
          let incomesForMonth = groupedIncomes[mKey] || [];
          // If no incomes stored but remote has legacy salary
          if (incomesForMonth.length === 0 && remoteMonthsMap[mKey]?.salary) {
            incomesForMonth = [
              {
                id: 'inc-legacy-' + mKey,
                title: 'Salário Principal',
                amount: remoteMonthsMap[mKey].salary,
                createdAt: new Date().toISOString(),
              },
            ];
          }

          newMonths[mKey] = {
            incomes: incomesForMonth,
            expenses: groupedExpenses[mKey] || [],
          };
        });

        // 4. Initial migration only if the cloud account is completely fresh and empty
        if (
          !cloudSyncedOnce &&
          Object.keys(remoteMonthsMap).length === 0 &&
          remoteExpensesList.length === 0 &&
          remoteIncomesList.length === 0
        ) {
          migrateLocalDataToCloud(user.uid, user.email, dbRef.current)
            .then(() => {
              showToast('Seus dados foram sincronizados com sua conta Google!');
            })
            .catch((err) => {
              console.error('Migration error:', err);
            });
        }

        setCloudSyncedOnce(true);
        setIsSyncing(false);

        return {
          ...prev,
          months: newMonths,
        };
      });
    };

    const unsubMonths = subscribeToUserMonths(
      user.uid,
      (months) => {
        remoteMonthsMap = months;
        updateCombinedData();
      },
      (err) => console.error(err)
    );

    const unsubExpenses = subscribeToUserExpenses(
      user.uid,
      (expenses) => {
        remoteExpensesList = expenses;
        updateCombinedData();
      },
      (err) => console.error(err)
    );

    const unsubIncomes = subscribeToUserIncomes(
      user.uid,
      (incomes) => {
        remoteIncomesList = incomes;
        updateCombinedData();
      },
      (err) => console.error(err)
    );

    return () => {
      unsubMonths();
      unsubExpenses();
      unsubIncomes();
    };
  }, [user, cloudSyncedOnce, currentMonthKey]);

  // Handle Google Login
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        showToast(
          `Domínio não autorizado: adicione "${domain}" nos Domínios Autorizados do Firebase Console.`
        );
      } else if (err.code === 'auth/popup-blocked') {
        showToast('O navegador bloqueou a janela de login. Por favor, permita pop-ups.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        showToast('Não foi possível entrar com o Google.');
      }
    }
  };

  // Handle Logout
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Desconectado. Usando modo local.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Get current active month data
  const currentMonthData: MonthData = useMemo(() => {
    return getOrCreateMonth(database, currentMonthKey);
  }, [database, currentMonthKey]);

  // Calculate totals
  const totalExpenses = useMemo(() => {
    return currentMonthData.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentMonthData.expenses]);

  const paidExpenses = useMemo(() => {
    return currentMonthData.expenses
      .filter((e) => e.isPaid)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentMonthData.expenses]);

  const pendingExpenses = totalExpenses - paidExpenses;

  // Add Income
  const handleAddIncome = (title: string, amount: number) => {
    const newIncome: Income = {
      id: 'inc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title,
      amount,
      createdAt: new Date().toISOString(),
    };

    setDatabase((prev) => {
      const existing = getOrCreateMonth(prev, currentMonthKey);
      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonthKey]: {
            ...existing,
            incomes: [...existing.incomes, newIncome],
          },
        },
      };
    });

    if (user) {
      saveIncome(user.uid, currentMonthKey, newIncome).catch((err) =>
        console.error('Cloud saveIncome error:', err)
      );
    }

    showToast(`Entrada "${title}" adicionada.`);
  };

  // Edit Income
  const handleEditIncome = (updatedIncome: Income) => {
    setDatabase((prev) => {
      const existing = getOrCreateMonth(prev, currentMonthKey);
      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonthKey]: {
            ...existing,
            incomes: existing.incomes.map((i) =>
              i.id === updatedIncome.id ? updatedIncome : i
            ),
          },
        },
      };
    });

    if (user) {
      saveIncome(user.uid, currentMonthKey, updatedIncome).catch((err) =>
        console.error('Cloud saveIncome error:', err)
      );
    }

    showToast('Entrada atualizada.');
  };

  // Delete Income
  const handleDeleteIncome = (incomeId: string) => {
    setDatabase((prev) => {
      const existing = getOrCreateMonth(prev, currentMonthKey);
      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonthKey]: {
            ...existing,
            incomes: existing.incomes.filter((i) => i.id !== incomeId),
          },
        },
      };
    });

    if (user) {
      deleteFirestoreIncome(user.uid, incomeId).catch((err) =>
        console.error('Cloud deleteIncome error:', err)
      );
    }

    showToast('Entrada removida.');
  };

  // Add new expense
  const handleAddExpense = (newExpData: {
    title: string;
    amount: number;
    dueDay?: number;
    category: ExpenseCategory;
    isPaid: boolean;
  }) => {
    const newExpense: Expense = {
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: newExpData.title,
      amount: newExpData.amount,
      dueDay: newExpData.dueDay,
      category: newExpData.category,
      isPaid: newExpData.isPaid,
      createdAt: new Date().toISOString(),
    };

    setDatabase((prev) => {
      const existing = getOrCreateMonth(prev, currentMonthKey);
      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonthKey]: {
            ...existing,
            expenses: [newExpense, ...existing.expenses],
          },
        },
      };
    });

    if (user) {
      saveExpense(user.uid, currentMonthKey, newExpense).catch((err) =>
        console.error('Cloud saveExpense error:', err)
      );
    }

    showToast(`"${newExpData.title}" adicionado.`);
  };

  // Toggle paid status
  const handleTogglePaid = (id: string) => {
    const existingExpense = currentMonthData.expenses.find((exp) => exp.id === id);
    if (!existingExpense) return;

    const nextState = !existingExpense.isPaid;
    const targetExpense: Expense = {
      ...existingExpense,
      isPaid: nextState,
    };

    setDatabase((prev) => {
      const existing = getOrCreateMonth(prev, currentMonthKey);
      const updatedExpenses = existing.expenses.map((exp) =>
        exp.id === id ? targetExpense : exp
      );

      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonthKey]: {
            ...existing,
            expenses: updatedExpenses,
          },
        },
      };
    });

    if (user) {
      saveExpense(user.uid, currentMonthKey, targetExpense).catch((err) =>
        console.error('Cloud saveExpense error:', err)
      );
    }

    showToast(nextState ? 'Marcado como pago!' : 'Marcado como pendente.');
  };

  // Save edited expense
  const handleSaveEditedExpense = (updated: Expense) => {
    setDatabase((prev) => {
      const existing = getOrCreateMonth(prev, currentMonthKey);
      const updatedExpenses = existing.expenses.map((exp) =>
        exp.id === updated.id ? updated : exp
      );

      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonthKey]: {
            ...existing,
            expenses: updatedExpenses,
          },
        },
      };
    });

    if (user) {
      saveExpense(user.uid, currentMonthKey, updated).catch((err) =>
        console.error('Cloud saveExpense error:', err)
      );
    }

    showToast('Despesa atualizada.');
  };

  // Delete expense
  const handleDeleteExpense = (id: string) => {
    setDatabase((prev) => {
      const existing = getOrCreateMonth(prev, currentMonthKey);
      const updatedExpenses = existing.expenses.filter((exp) => exp.id !== id);

      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonthKey]: {
            ...existing,
            expenses: updatedExpenses,
          },
        },
      };
    });

    if (user) {
      deleteFirestoreExpense(user.uid, id).catch((err) =>
        console.error('Cloud deleteExpense error:', err)
      );
    }

    showToast('Despesa excluída.');
  };

  // Copy from previous month
  const handleCopyFromPreviousMonth = () => {
    const prevMonthKey = getAdjacentMonthKey(currentMonthKey, -1);
    const prevMonthData = database.months[prevMonthKey];

    if (!prevMonthData || (prevMonthData.expenses.length === 0 && (!prevMonthData.incomes || prevMonthData.incomes.length === 0))) {
      alert(
        `Não foram encontradas despesas ou entradas em ${formatMonthName(
          prevMonthKey
        )} para copiar.`
      );
      return;
    }

    const copiedExpenses: Expense[] = (prevMonthData.expenses || []).map((exp) => ({
      ...exp,
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      isPaid: false,
      createdAt: new Date().toISOString(),
    }));

    const copiedIncomes: Income[] = (prevMonthData.incomes || []).map((inc) => ({
      ...inc,
      id: 'inc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
    }));

    setDatabase((prev) => {
      const current = getOrCreateMonth(prev, currentMonthKey);
      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonthKey]: {
            ...current,
            incomes: current.incomes.length > 0 ? current.incomes : copiedIncomes,
            expenses: [...copiedExpenses, ...current.expenses],
          },
        },
      };
    });

    if (user) {
      copiedExpenses.forEach((exp) => {
        saveExpense(user.uid, currentMonthKey, exp).catch((err) =>
          console.error(err)
        );
      });
      if (currentMonthData.incomes.length === 0) {
        copiedIncomes.forEach((inc) => {
          saveIncome(user.uid, currentMonthKey, inc).catch((err) =>
            console.error(err)
          );
        });
      }
    }

    showToast('Dados copiados do mês anterior!');
  };

  // Clear current month
  const handleClearMonth = () => {
    if (user) {
      currentMonthData.expenses.forEach((exp) => {
        deleteFirestoreExpense(user.uid, exp.id).catch((err) =>
          console.error(err)
        );
      });
      currentMonthData.incomes.forEach((inc) => {
        deleteFirestoreIncome(user.uid, inc.id).catch((err) =>
          console.error(err)
        );
      });
    }

    setDatabase((prev) => {
      const current = getOrCreateMonth(prev, currentMonthKey);
      return {
        ...prev,
        months: {
          ...prev.months,
          [currentMonthKey]: {
            ...current,
            incomes: [],
            expenses: [],
          },
        },
      };
    });
  };

  // Reset all to sample defaults
  const handleResetToDefault = () => {
    const initial = getDefaultDatabase();
    setDatabase(initial);
    if (user) {
      migrateLocalDataToCloud(user.uid, user.email, initial).catch((err) =>
        console.error(err)
      );
    }
  };

  // Restore imported database
  const handleRestoreDatabase = (imported: AppDatabase) => {
    setDatabase(imported);
    if (user) {
      migrateLocalDataToCloud(user.uid, user.email, imported).catch((err) =>
        console.error(err)
      );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        currentMonthKey={currentMonthKey}
        onMonthChange={setCurrentMonthKey}
        onCopyFromPreviousMonth={handleCopyFromPreviousMonth}
        hasExpensesInCurrentMonth={currentMonthData.expenses.length > 0}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        user={user}
        isSyncing={isSyncing}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Cloud status banner (gentle, unobtrusive) */}
      {!user && (
        <div className="bg-emerald-50 border-b border-emerald-100 py-2 px-4 text-xs text-emerald-800">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Para acessar de múltiplos dispositivos sem risco de perder dados, conecte sua conta Google.
              </span>
            </div>
            <button
              onClick={handleSignIn}
              className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer shrink-0"
            >
              Conectar e Salvar na Nuvem
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 sm:px-6 space-y-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Financial Summary */}
        <FinancialSummary
          incomes={currentMonthData.incomes}
          totalExpenses={totalExpenses}
          paidExpenses={paidExpenses}
          pendingExpenses={pendingExpenses}
          onOpenIncomesModal={() => setIsIncomesModalOpen(true)}
        />

        {/* Add Expense Form */}
        <AddExpenseForm onAddExpense={handleAddExpense} />

        {/* Expenses List */}
        <ExpenseList
          expenses={currentMonthData.expenses}
          onTogglePaid={handleTogglePaid}
          onEditExpense={(exp) => setEditingExpense(exp)}
          onDeleteExpense={handleDeleteExpense}
          currentMonthKey={currentMonthKey}
        />
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-zinc-200 text-center text-xs text-zinc-500 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Controle Simples de Salário & Despesas</span>
          <span>
            {user
              ? `Conectado na nuvem (${user.email})`
              : 'Armazenamento local • Conecte o Google para sincronizar'}
          </span>
        </div>
      </footer>

      {/* Incomes Management Modal */}
      <IncomesModal
        isOpen={isIncomesModalOpen}
        onClose={() => setIsIncomesModalOpen(false)}
        incomes={currentMonthData.incomes}
        onAddIncome={handleAddIncome}
        onEditIncome={handleEditIncome}
        onDeleteIncome={handleDeleteIncome}
        monthName={formatMonthName(currentMonthKey)}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        expense={editingExpense}
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        onSave={handleSaveEditedExpense}
        onDelete={handleDeleteExpense}
      />

      {/* Backup & Management Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        database={database}
        onRestoreDatabase={handleRestoreDatabase}
        onResetToDefault={handleResetToDefault}
        onClearMonth={handleClearMonth}
        currentMonthName={formatMonthName(currentMonthKey)}
      />
    </div>
  );
}
