import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Copy,
  Download,
  Cloud,
  CloudOff,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import {
  formatMonthName,
  getAdjacentMonthKey,
  getCurrentMonthKey,
} from '../utils/formatters';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentMonthKey: string;
  onMonthChange: (key: string) => void;
  onCopyFromPreviousMonth: () => void;
  hasExpensesInCurrentMonth: boolean;
  onOpenBackupModal: () => void;
  user: User | null;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMonthKey,
  onMonthChange,
  onCopyFromPreviousMonth,
  hasExpensesInCurrentMonth,
  onOpenBackupModal,
  user,
  isSyncing,
  onSignIn,
  onSignOut,
}) => {
  const currentActualKey = getCurrentMonthKey();
  const isCurrentMonth = currentMonthKey === currentActualKey;

  const handlePrevMonth = () => {
    onMonthChange(getAdjacentMonthKey(currentMonthKey, -1));
  };

  const handleNextMonth = () => {
    onMonthChange(getAdjacentMonthKey(currentMonthKey, 1));
  };

  const handleGoToCurrentMonth = () => {
    onMonthChange(currentActualKey);
  };

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand / Title & Cloud status */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            $
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight leading-none">
              Salário & Despesas
            </h1>
            {user ? (
              <span className="inline-flex items-center gap-1 text-2xs text-emerald-700 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Salvo na Nuvem
              </span>
            ) : (
              <span className="text-2xs text-zinc-400 mt-0.5">
                Armazenamento local
              </span>
            )}
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-white transition-colors cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-4 h-4 text-zinc-500 hidden sm:inline" />
            <span className="font-semibold text-sm text-zinc-800 capitalize min-w-[140px] text-center">
              {formatMonthName(currentMonthKey)}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-white transition-colors cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={handleGoToCurrentMonth}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg ml-1 transition-colors cursor-pointer"
            >
              Hoje
            </button>
          )}
        </div>

        {/* Action Tools & User Session */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!hasExpensesInCurrentMonth && (
            <button
              onClick={onCopyFromPreviousMonth}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Copiar as contas cadastradas no mês anterior para este mês"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
              <span>Copiar mês anterior</span>
            </button>
          )}

          <button
            onClick={onOpenBackupModal}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Backup ou restaurar arquivo"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {/* User Auth Cloud Sync */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-zinc-200">
              <div
                className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold border border-emerald-300 overflow-hidden"
                title={`Conectado como ${user.email || user.displayName}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuário'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Desconectar da conta Google"
                aria-label="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Conectar com o Google para sincronizar entre computadores e celulares"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Salvar na Nuvem</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
