import { AppDatabase, Expense, Income, MonthData } from '../types';
import { getCurrentMonthKey } from './formatters';

const STORAGE_KEY = 'controle_salario_despesas_v1';

export function getDefaultDatabase(): AppDatabase {
  const currentKey = getCurrentMonthKey();

  const sampleExpenses: Expense[] = [
    {
      id: 'exp-1',
      title: 'Aluguel / Financiamento',
      amount: 1200.0,
      dueDay: 10,
      category: 'Moradia',
      isPaid: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      title: 'Energia Elétrica',
      amount: 145.5,
      dueDay: 15,
      category: 'Contas',
      isPaid: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-3',
      title: 'Internet Fibra',
      amount: 99.9,
      dueDay: 18,
      category: 'Contas',
      isPaid: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-4',
      title: 'Supermercado do Mês',
      amount: 750.0,
      dueDay: 20,
      category: 'Alimentação',
      isPaid: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-5',
      title: 'Combustível / Passagem',
      amount: 280.0,
      dueDay: 25,
      category: 'Transporte',
      isPaid: false,
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    defaultSalary: 3800.0,
    months: {
      [currentKey]: {
        incomes: [
          {
            id: 'inc-1',
            title: 'Salário Principal',
            amount: 3800.0,
            createdAt: new Date().toISOString(),
          },
        ],
        expenses: sampleExpenses,
      },
    },
  };
}

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultDatabase();
      saveDatabase(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppDatabase;
    if (!parsed.months) {
      return getDefaultDatabase();
    }
    return parsed;
  } catch (err) {
    console.error('Error loading database from localStorage', err);
    return getDefaultDatabase();
  }
}

export function saveDatabase(data: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving database to localStorage', err);
  }
}

export function getOrCreateMonth(db: AppDatabase, monthKey: string): MonthData {
  const existing = db.months[monthKey];
  if (existing) {
    let incomes = existing.incomes || [];
    // Migrate legacy salary/additionalIncome fields if incomes is empty
    if (incomes.length === 0 && (existing.salary || existing.additionalIncome)) {
      incomes = [];
      if (existing.salary && existing.salary > 0) {
        incomes.push({
          id: 'inc-sal-' + monthKey,
          title: 'Salário Principal',
          amount: existing.salary,
          createdAt: new Date().toISOString(),
        });
      }
      if (existing.additionalIncome && existing.additionalIncome > 0) {
        incomes.push({
          id: 'inc-extra-' + monthKey,
          title: 'Renda Extra',
          amount: existing.additionalIncome,
          createdAt: new Date().toISOString(),
        });
      }
    }
    return {
      ...existing,
      incomes,
      expenses: existing.expenses || [],
    };
  }

  const initialIncomes: Income[] =
    db.defaultSalary > 0
      ? [
          {
            id: 'inc-' + Date.now(),
            title: 'Salário Principal',
            amount: db.defaultSalary,
            createdAt: new Date().toISOString(),
          },
        ]
      : [];

  return {
    incomes: initialIncomes,
    expenses: [],
  };
}
