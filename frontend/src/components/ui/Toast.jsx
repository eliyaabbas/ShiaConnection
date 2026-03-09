import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

let toastIdCounter = 0;
let globalShowToast = null;

export function useToast() {
  return {
    success: (msg) => globalShowToast?.({ type: 'success', message: msg }),
    error:   (msg) => globalShowToast?.({ type: 'error',   message: msg }),
    info:    (msg) => globalShowToast?.({ type: 'info',    message: msg }),
    warning: (msg) => globalShowToast?.({ type: 'warning', message: msg }),
  };
}

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error:   <XCircle    className="w-5 h-5 text-red-500"     />,
  warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
  info:    <Info        className="w-5 h-5 text-blue-500"   />,
};

const BORDERS = {
  success: 'border-emerald-200',
  error:   'border-red-200',
  warning: 'border-amber-200',
  info:    'border-blue-200',
};

function ToastItem({ id, type, message, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 3500);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <div className={`slide-in-right flex items-start gap-3 bg-white rounded-xl shadow-lg border ${BORDERS[type]} px-4 py-3 min-w-[280px] max-w-sm`}>
      <span className="flex-shrink-0 mt-0.5">{ICONS[type]}</span>
      <p className="text-sm text-slate-700 font-medium flex-1 leading-snug">{message}</p>
      <button onClick={() => onRemove(id)} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    globalShowToast = (toast) => {
      const id = ++toastIdCounter;
      setToasts(prev => [...prev, { id, ...toast }]);
    };
    return () => { globalShowToast = null; };
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onRemove={remove} />
      ))}
    </div>
  );
}
