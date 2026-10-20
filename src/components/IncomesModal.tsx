import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, ArrowDownLeft } from 'lucide-react';
import { Income } from '../types';
import { formatCurrency } from '../utils/formatters';

interface IncomesModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomes: Income[];
  onAddIncome: (title: string, amount: number) => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
  monthName: string;
}

export const IncomesModal: React.FC<IncomesModalProps> = ({
  isOpen,
  onClose,
  incomes,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
  monthName,
}) => {
  // New income form
  const [newTitle, setNewTitle] = useState('');
  const [newAmountStr, setNewAmountStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');

  if (!isOpen) return null;

  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = newTitle.trim();
    if (!cleanTitle) {
      setError('Informe a descrição da entrada (ex: Salário, Bico, Freela).');
      return;
    }

    const parsedAmount = parseFloat(newAmountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    onAddIncome(cleanTitle, Math.round(parsedAmount * 100) / 100);
    setNewTitle('');
    setNewAmountStr('');
  };

  const startEdit = (inc: Income) => {
    setEditingId(inc.id);
    setEditTitle(inc.title);
    setEditAmountStr(inc.amount.toString());
  };

  const saveEdit = (id: string) => {
    const cleanTitle = editTitle.trim();
    const parsedAmount = parseFloat(editAmountStr.replace(',', '.'));
    if (!cleanTitle || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const existing = incomes.find((i) => i.id === id);
    if (existing) {
      onEditIncome({
        ...existing,
        title: cleanTitle,
        amount: Math.round(parsedAmount * 100) / 100,
      });
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">
                Entradas do Mês
              </h3>
              <p className="text-2xs text-zinc-500 capitalize">{monthName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form: Add new income */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200">
          <form onSubmit={handleCreate} className="space-y-2">
            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7">
                <label className="block text-2xs font-semibold text-zinc-600 mb-0.5">
                  Descrição da Entrada
                </label>
                <input
                  type="text"
                  placeholder="Ex: Salário, Freela, Venda..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-2xs font-semibold text-zinc-600 mb-0.5">
                  Valor (R$)
                </label>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1.5 text-2xs text-zinc-400 font-medium">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={newAmountStr}
                      onChange={(e) => setNewAmountStr(e.target.value)}
                      className="w-full text-xs pl-7 pr-2 py-1.5 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Adicionar entrada"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Incomes List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 p-2">
          {incomes.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              Nenhuma entrada registrada para este mês.
            </div>
          ) : (
            incomes.map((inc) => (
              <div
                key={inc.id}
                className="flex items-center justify-between p-2.5 hover:bg-zinc-50 rounded-xl transition-colors"
              >
                {editingId === inc.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xs px-2 py-1 border border-zinc-300 rounded-md flex-1"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editAmountStr}
                      onChange={(e) => setEditAmountStr(e.target.value)}
                      className="text-xs px-2 py-1 border border-zinc-300 rounded-md w-24 font-medium"
                    />
                    <button
                      onClick={() => saveEdit(inc.id)}
                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
                      title="Salvar alteração"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-sm font-semibold text-zinc-800 block truncate">
                        {inc.title}
                      </span>
                      <span className="text-2xs text-zinc-400">
                        Entrada financeira
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-emerald-800">
                        {formatCurrency(inc.amount)}
                      </span>
                      <button
                        onClick={() => startEdit(inc)}
                        className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                        title="Editar entrada"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteIncome(inc.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Excluir entrada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer with Total */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <div>
            <span className="text-2xs text-zinc-500 uppercase tracking-wider block font-semibold">
              Total de Entradas
            </span>
            <span className="text-lg font-bold text-emerald-900">
              {formatCurrency(totalIncomes)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
