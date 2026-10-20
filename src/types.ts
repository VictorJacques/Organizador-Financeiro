export type ExpenseCategory =
  | 'Moradia'
  | 'Contas'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Lazer'
  | 'Educação'
  | 'Outros';

export interface Income {
  id: string;
  title: string;
  amount: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  dueDay?: number; // 1 to 31
  category: ExpenseCategory;
  isPaid: boolean;
  createdAt: string;
}

export interface MonthData {
  incomes: Income[];
  expenses: Expense[];
  // Backwards compatibility
  salary?: number;
  additionalIncome?: number;
}

export interface AppDatabase {
  // Key format: "YYYY-MM" (e.g., "2026-10")
  months: Record<string, MonthData>;
  // Global default salary for newly opened months
  defaultSalary: number;
}
