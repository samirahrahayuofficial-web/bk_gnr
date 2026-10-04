import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const iconConfig = {
          success: {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
            border: 'border-emerald-200 bg-white',
          },
          warning: {
            icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
            border: 'border-amber-200 bg-white',
          },
          error: {
            icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
            border: 'border-rose-200 bg-white',
          },
          info: {
            icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
            border: 'border-blue-200 bg-white',
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 ${iconConfig.border}`}
          >
            {iconConfig.icon}
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-sm">{toast.title}</span>
                <span className="text-[10px] text-slate-400">{toast.timestamp}</span>
              </div>
              {toast.message && <p className="text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
