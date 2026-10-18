import React, { useState, useMemo } from 'react';
import {
  Check,
  Clock,
  Edit2,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Expense } from '../types';
import { formatCurrency, CATEGORIES } from '../utils/formatters';

interface ExpenseListProps {
  expenses: Expense[];
  onTogglePaid: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  currentMonthKey: string;
}

type FilterType = 'all' | 'pending' | 'paid';
type SortType = 'dueDay' | 'amountDesc' | 'amountAsc' | 'title';

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onTogglePaid,
  onEditExpense,
  onDeleteExpense,
  currentMonthKey,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('dueDay');

  // Counts
  const totalCount = expenses.length;
  const paidCount = expenses.filter((e) => e.isPaid).length;
  const pendingCount = totalCount - paidCount;

  // Current day of month if looking at current month
  const now = new Date();
  const currentActualMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
  const isLookingAtCurrentMonth = currentMonthKey === currentActualMonthKey;
  const currentDayOfMonth = now.getDate();

  // Filtered & Sorted list
  const displayedExpenses = useMemo(() => {
    let result = [...expenses];

    // Status filter
    if (filter === 'pending') {
      result = result.filter((e) => !e.isPaid);
    } else if (filter === 'paid') {
      result = result.filter((e) => e.isPaid);
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'dueDay') {
        const dayA = a.dueDay || 999;
        const dayB = b.dueDay || 999;
        return dayA - dayB;
      }
      if (sortBy === 'amountDesc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amountAsc') {
        return a.amount - b.amount;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [expenses, filter, searchTerm, sortBy]);

  const filteredTotal = displayedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const getCategoryStyle = (catName: string) => {
    const found = CATEGORIES.find((c) => c.name === catName);
    return found ? found.color : 'bg-zinc-100 text-zinc-700 border-zinc-200';
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
      {/* Control bar: Tabs, Search, Sort */}
      <div className="p-3 sm:p-4 border-b border-zinc-100 bg-zinc-50/50 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-zinc-200/70 rounded-xl text-xs font-semibold text-zinc-600">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'hover:text-zinc-900'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'hover:text-zinc-900'
              }`}
            >
              Pendentes ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'paid'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'hover:text-zinc-900'
              }`}
            >
              Pagas ({paidCount})
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-800"
              />
            </div>

            <div className="flex items-center gap-1 text-xs text-zinc-600 bg-white border border-zinc-300 rounded-lg px-2 py-1.5">
              <ArrowUpDown className="w-3 h-3 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="bg-transparent text-xs focus:outline-none cursor-pointer"
              >
                <option value="dueDay">Por Vencimento</option>
                <option value="amountDesc">Maior Valor</option>
                <option value="amountAsc">Menor Valor</option>
                <option value="title">Nome (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sub-header info showing current filtered total */}
        {(filter !== 'all' || searchTerm.trim()) && (
          <div className="text-xs text-zinc-500 flex items-center justify-between pt-1">
            <span>
              Exibindo <strong>{displayedExpenses.length}</strong> de{' '}
              {totalCount} despesas
            </span>
            <span>
              Subtotal filtrado:{' '}
              <strong className="text-zinc-800">
                {formatCurrency(filteredTotal)}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Expenses List */}
      {displayedExpenses.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-800 mb-1">
            Nenhuma despesa encontrada
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {expenses.length === 0
              ? 'Você ainda não cadastrou nenhuma conta para este mês. Use o formulário acima para adicionar!'
              : 'Nenhuma conta corresponde ao filtro selecionado.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-xs text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {displayedExpenses.map((expense) => {
            const isLate =
              !expense.isPaid &&
              isLookingAtCurrentMonth &&
              expense.dueDay &&
              expense.dueDay < currentDayOfMonth;

            const isDueToday =
              !expense.isPaid &&
              isLookingAtCurrentMonth &&
              expense.dueDay &&
              expense.dueDay === currentDayOfMonth;

            return (
              <li
                key={expense.id}
                className={`group flex items-center justify-between p-3.5 sm:px-4 sm:py-3 hover:bg-zinc-50/70 transition-colors ${
                  expense.isPaid ? 'bg-zinc-50/40 opacity-75' : 'bg-white'
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  {/* Clickable Status Checkbox */}
                  <button
                    onClick={() => onTogglePaid(expense.id)}
                    aria-label={
                      expense.isPaid
                        ? 'Marcar como não pago'
                        : 'Marcar como pago'
                    }
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      expense.isPaid
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'border-zinc-300 hover:border-emerald-500 text-transparent hover:text-emerald-500 bg-white'
                    }`}
                    title={
                      expense.isPaid
                        ? 'Clique para marcar como pendente'
                        : 'Clique para marcar como pago'
                    }
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  {/* Due Day Badge */}
                  <div
                    className={`shrink-0 text-center px-2 py-1 rounded-md text-2xs font-semibold border ${
                      expense.isPaid
                        ? 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        : isLate
                        ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                        : isDueToday
                        ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                    title={
                      expense.dueDay
                        ? `Vencimento dia ${expense.dueDay}`
                        : 'Sem dia especificado'
                    }
                  >
                    {expense.dueDay ? (
                      <>
                        <span className="block leading-none">Dia</span>
                        <span className="text-xs leading-none">
                          {expense.dueDay}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xs text-zinc-400">Geral</span>
                    )}
                  </div>

                  {/* Expense Title & Category */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold truncate ${
                          expense.isPaid
                            ? 'line-through text-zinc-400'
                            : 'text-zinc-900'
                        }`}
                      >
                        {expense.title}
                      </span>

                      <span
                        className={`text-2xs px-2 py-0.5 rounded-full border ${getCategoryStyle(
                          expense.category
                        )}`}
                      >
                        {expense.category}
                      </span>

                      {/* Overdue alert if applicable */}
                      {isLate && (
                        <span className="text-2xs text-rose-600 font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Atrasado
                        </span>
                      )}
                      {isDueToday && (
                        <span className="text-2xs text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Vence hoje!
                        </span>
                      )}
                    </div>

                    <div className="text-2xs text-zinc-400 mt-0.5 sm:hidden">
                      {expense.isPaid ? 'Pago' : 'Pendente'}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Quick Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm sm:text-base font-bold block ${
                        expense.isPaid ? 'text-zinc-400' : 'text-zinc-900'
                      }`}
                    >
                      {formatCurrency(expense.amount)}
                    </span>
                    <span
                      className={`hidden sm:inline-block text-2xs font-medium px-2 py-0.5 rounded-full ${
                        expense.isPaid
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {expense.isPaid ? 'Pago' : 'Pendente'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditExpense(expense)}
                      aria-label="Editar"
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                      title="Editar despesa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(expense.id)}
                      aria-label="Excluir"
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir despesa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
