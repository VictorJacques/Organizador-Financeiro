import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { AppDatabase } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: AppDatabase;
  onRestoreDatabase: (db: AppDatabase) => void;
  onResetToDefault: () => void;
  onClearMonth: () => void;
  currentMonthName: string;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  database,
  onRestoreDatabase,
  onResetToDefault,
  onClearMonth,
  currentMonthName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(database, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `minhas_despesas_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSuccessMsg('Arquivo de backup baixado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e) {
      setErrorMsg('Não foi possível gerar o arquivo de backup.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object' && parsed.months) {
          onRestoreDatabase(parsed);
          setSuccessMsg('Dados restaurados com sucesso a partir do arquivo!');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1500);
        } else {
          setErrorMsg('O arquivo enviado não é um backup válido do aplicativo.');
        }
      } catch (err) {
        setErrorMsg('Erro ao ler o arquivo JSON selecionado.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetConfirm = () => {
    if (
      window.confirm(
        'Deseja restaurar os dados de exemplo padrão? Isso sobrescreverá as alterações não salvas em backup.'
      )
    ) {
      onResetToDefault();
      setSuccessMsg('Dados de exemplo restaurados.');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    }
  };

  const handleClearMonthConfirm = () => {
    if (
      window.confirm(
        `Tem certeza de que deseja apagar todas as despesas cadastradas em ${currentMonthName}?`
      )
    ) {
      onClearMonth();
      setSuccessMsg(`Despesas de ${currentMonthName} apagadas.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 text-base">
            Backup & Gerenciamento
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {successMsg && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Seus Dados Ficam Seguros no Navegador
            </h4>
            <p className="text-xs text-zinc-600">
              Todos os seus salários e despesas ficam salvos automaticamente no seu
              navegador (sem necessidade de cadastro). Você pode baixar uma cópia
              ou transferir para outro celular/computador quando desejar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-zinc-600" />
              <span>Baixar Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-zinc-600" />
              <span>Restaurar Arquivo</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="border-t border-zinc-100 pt-3 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Ações Rápidas
            </h4>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleClearMonthConfirm}
                className="w-full text-left text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Limpar apenas as contas de <strong>{currentMonthName}</strong>
              </button>

              <button
                onClick={handleResetConfirm}
                className="w-full text-left text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 p-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Restaurar dados de exemplo iniciais
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
