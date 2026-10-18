export type ExpenseCategory =
  | 'Moradia'
  | 'Contas'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Lazer'
  | 'Educação'
  | 'Outros';

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
  salary: number;
  additionalIncome: number;
  expenses: Expense[];
}

export interface AppDatabase {
  // Key format: "YYYY-MM" (e.g., "2026-10")
  months: Record<string, MonthData>;
  // Global default salary for newly opened months
  defaultSalary: number;
}
