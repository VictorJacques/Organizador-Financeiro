import React from 'react';
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Edit2,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
} from 'lucide-react';
import { Income } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FinancialSummaryProps {
  incomes: Income[];
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  onOpenIncomesModal: () => void;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  incomes,
  totalExpenses,
  paidExpenses,
  pendingExpenses,
  onOpenIncomesModal,
}) => {
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpenses;
  const percentageUsed = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const roundedPercent = Math.min(Math.round(percentageUsed), 999);

  return (
    <div className="space-y-3">
      {/* 3 Main Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Entradas */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Entradas
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-2xl font-bold text-zinc-900 tracking-tight">
                {formatCurrency(totalIncome)}
              </span>
              <button
                onClick={onOpenIncomesModal}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                title="Adicionar ou editar entradas deste mês"
              >
                <Plus className="w-3 h-3" />
                <span>Gerenciar</span>
              </button>
            </div>

            <div className="text-xs text-zinc-500 mt-1 flex items-center justify-between">
              {incomes.length === 0 ? (
                <span className="text-zinc-400">Nenhuma entrada</span>
              ) : incomes.length === 1 ? (
                <span className="truncate max-w-[200px]">{incomes[0].title}</span>
              ) : (
                <span>{incomes.length} fontes de entrada</span>
              )}

              {incomes.length > 0 && (
                <span className="text-2xs text-emerald-600 font-medium">
                  {formatCurrency(totalIncome)}
                </span>
              )}
            </div>
          </div>
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
                    ? `${100 - Math.round((totalExpenses / totalIncome) * 100)}% das entradas disponíveis`
                    : 'Adicione suas entradas'}
                </span>
              ) : (
                <span className="text-rose-600 font-medium">
                  Despesas ultrapassaram as entradas
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
