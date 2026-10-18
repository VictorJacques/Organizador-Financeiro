export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const CATEGORIES: Array<{
  name: import('../types').ExpenseCategory;
  color: string;
}> = [
  { name: 'Moradia', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { name: 'Contas', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: 'Alimentação', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { name: 'Transporte', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: 'Saúde', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { name: 'Educação', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { name: 'Lazer', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { name: 'Outros', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
];

export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseRawAmount(input: string): number {
  if (!input) return 0;
  // Cleans up any characters except numbers, comma, dot, and minus
  const cleaned = input
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.round(val * 100) / 100;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthName(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || monthStr;
  return `${monthName} de ${yearStr}`;
}

export function getAdjacentMonthKey(monthKey: string, offset: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + offset, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
