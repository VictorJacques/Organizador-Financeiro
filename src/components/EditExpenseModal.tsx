import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';
import { CATEGORIES } from '../utils/formatters';

interface EditExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Expense) => void;
  onDelete: (id: string) => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDayStr, setDueDayStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Contas');
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmountStr(expense.amount.toString());
      setDueDayStr(expense.dueDay ? expense.dueDay.toString() : '');
      setCategory(expense.category);
      setIsPaid(expense.isPaid);
      setError(null);
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('A despesa precisa de um nome.');
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

    onSave({
      ...expense,
      title: cleanTitle,
      amount: Math.round(parsedAmount * 100) / 100,
      dueDay: parsedDueDay,
      category,
      isPaid,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir "${expense.title}"?`)) {
      onDelete(expense.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 text-base">Editar Despesa</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Descrição / Nome da Despesa
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Dia de Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDayStr}
                onChange={(e) => setDueDayStr(e.target.value)}
                placeholder="1 a 31"
                className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
              />
              <span>Marcar como paga neste mês</span>
            </label>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
