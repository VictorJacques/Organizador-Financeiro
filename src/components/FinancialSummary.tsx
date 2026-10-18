import React, { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Edit2,
  Check,
  X,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface FinancialSummaryProps {
  salary: number;
  additionalIncome: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  onUpdateSalary: (newSalary: number, newAdditionalIncome: number) => void;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  salary,
  additionalIncome,
  totalExpenses,
  paidExpenses,
  pendingExpenses,
  onUpdateSalary,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [salaryInput, setSalaryInput] = useState(salary.toString());
  const [extraInput, setExtraInput] = useState(additionalIncome.toString());
  const [showExtraField, setShowExtraField] = useState(additionalIncome > 0);

  const totalIncome = salary + additionalIncome;
  const balance = totalIncome - totalExpenses;
  const percentageUsed = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const roundedPercent = Math.min(Math.round(percentageUsed), 999);

  const handleStartEditing = () => {
    setSalaryInput(salary > 0 ? salary.toString() : '');
    setExtraInput(additionalIncome > 0 ? additionalIncome.toString() : '');
    setIsEditing(true);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedSalary = parseFloat(salaryInput.replace(',', '.')) || 0;
    const parsedExtra = parseFloat(extraInput.replace(',', '.')) || 0;
    onUpdateSalary(Math.max(0, parsedSalary), Math.max(0, parsedExtra));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      {/* 3 Main Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Salário / Entradas */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Salário / Entradas
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          {!isEditing ? (
            <div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-2xl font-bold text-zinc-900 tracking-tight">
                  {formatCurrency(totalIncome)}
                </span>
                <button
                  onClick={handleStartEditing}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                  title="Alterar valor do salário deste mês"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs text-zinc-500 mt-1 flex items-center justify-between">
                <span>Líquido: {formatCurrency(salary)}</span>
                {additionalIncome > 0 && (
                  <span className="text-emerald-700 font-medium">
                    +{formatCurrency(additionalIncome)} extra
                  </span>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="mt-1 space-y-2">
              <div>
                <label className="text-2xs text-zinc-500 font-medium block">
                  Salário Líquido (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  placeholder="Ex: 3500.00"
                  className="w-full text-base font-semibold px-2 py-1 bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {showExtraField ? (
                <div>
                  <label className="text-2xs text-zinc-500 font-medium block">
                    Renda Extra / Bônus (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={extraInput}
                    onChange={(e) => setExtraInput(e.target.value)}
                    placeholder="Ex: 300.00"
                    className="w-full text-sm px-2 py-1 bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowExtraField(true)}
                  className="text-xs text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" /> Adicionar renda extra
                </button>
              )}

              <div className="flex gap-1.5 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1 px-2 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Salvar
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs py-1 px-2 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Card 2: Total de Despesas */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Despesas do Mês
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>

            <div className="text-xs text-zinc-500 mt-1 flex items-center justify-between">
              <span className="text-emerald-700 font-medium">
                {formatCurrency(paidExpenses)} pagas
              </span>
              <span className="text-amber-700 font-medium">
                {formatCurrency(pendingExpenses)} a pagar
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Saldo / Sobra do Mês */}
        <div
          className={`rounded-xl p-4 border shadow-xs flex flex-col justify-between ${
            balance >= 0
              ? 'bg-emerald-50/50 border-emerald-200/70'
              : 'bg-rose-50/70 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                balance >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {balance >= 0 ? 'Sobra Livre' : 'Saldo Negativo'}
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                balance >= 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {balance >= 0 ? (
                <PiggyBank className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
          </div>

          <div>
            <div
              className={`text-2xl font-bold tracking-tight ${
                balance >= 0 ? 'text-emerald-900' : 'text-rose-700'
              }`}
            >
              {formatCurrency(balance)}
            </div>

            <div className="text-xs mt-1">
              {balance >= 0 ? (
                <span className="text-emerald-700">
                  {totalIncome > 0
                    ? `${100 - Math.round((totalExpenses / totalIncome) * 100)}% do salário disponível`
                    : 'Defina seu salário acima'}
                </span>
              ) : (
                <span className="text-rose-600 font-medium">
                  Despesas ultrapassaram o salário
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compromisso de Renda: Barra simples e informativa */}
      {totalIncome > 0 && (
        <div className="bg-white rounded-xl p-3 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="w-full sm:w-1/2 flex items-center gap-2">
            <span className="font-semibold text-zinc-700 whitespace-nowrap">
              Comprometido: {roundedPercent}%
            </span>
            <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  roundedPercent > 100
                    ? 'bg-rose-600'
                    : roundedPercent > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(roundedPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="text-zinc-500 flex items-center gap-4 text-2xs sm:text-xs">
            <span>
              Pagas:{' '}
              <strong className="text-zinc-800">
                {totalIncome > 0
                  ? Math.round((paidExpenses / totalIncome) * 100)
                  : 0}
                %
              </strong>
            </span>
            <span>
              Restante a pagar:{' '}
              <strong className="text-zinc-800">
                {totalIncome > 0
                  ? Math.round((pendingExpenses / totalIncome) * 100)
                  : 0}
                %
              </strong>
            </span>
            <span>
              Sobra:{' '}
              <strong
                className={
                  balance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }
              >
                {totalIncome > 0
                  ? Math.max(
                      0,
                      Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
                    )
                  : 0}
                %
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
