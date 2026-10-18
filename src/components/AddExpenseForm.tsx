import React, { useState } from 'react';
import { Plus, Tag, Calendar, DollarSign, Check } from 'lucide-react';
import { ExpenseCategory } from '../types';
import { CATEGORIES } from '../utils/formatters';

interface AddExpenseFormProps {
  onAddExpense: (expense: {
    title: string;
    amount: number;
    dueDay?: number;
    category: ExpenseCategory;
    isPaid: boolean;
  }) => void;
}

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  onAddExpense,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDayStr, setDueDayStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Contas');
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Por favor, informe o nome ou descrição da despesa.');
      return;
    }

    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    let parsedDueDay: number | undefined = undefined;
    if (dueDayStr.trim()) {
      const day = parseInt(dueDayStr, 10);
      if (day >= 1 && day <= 31) {
        parsedDueDay = day;
      }
    }

    onAddExpense({
      title: cleanTitle,
      amount: Math.round(parsedAmount * 100) / 100,
      dueDay: parsedDueDay,
      category,
      isPaid,
    });

    // Reset form
    setTitle('');
    setAmountStr('');
    setDueDayStr('');
    setIsPaid(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
      {/* Header bar of the form: always compact and accessible */}
      <div className="p-4 bg-zinc-50/60 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            +
          </div>
          <h2 className="text-sm font-bold text-zinc-900">
            Nova Despesa / Conta do Mês
          </h2>
        </div>
        <span className="text-xs text-zinc-500">
          Adicione gastos fixos ou variáveis
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {error && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Nome da Despesa */}
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Descrição / Nome da Conta *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aluguel, Luz, Supermercado..."
              className="w-full text-sm px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900"
            />
          </div>

          {/* Valor */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Valor (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-zinc-400 font-medium">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full text-sm pl-8 pr-3 py-2 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 font-medium"
              />
            </div>
          </div>

          {/* Dia de Vencimento */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Dia Venc.
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={dueDayStr}
              onChange={(e) => setDueDayStr(e.target.value)}
              placeholder="Ex: 10"
              className="w-full text-sm px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900"
              title="Dia do vencimento no mês (1 a 31)"
            />
          </div>

          {/* Categoria */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full text-sm px-2 py-2 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-800"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha inferior com checkbox de já pago e botão de adicionar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-zinc-100">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
            />
            <span>Já paguei esta despesa neste mês</span>
          </label>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Despesa</span>
          </button>
        </div>
      </form>
    </div>
  );
};
