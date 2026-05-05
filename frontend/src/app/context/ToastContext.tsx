import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, X, ShoppingBag } from 'lucide-react';

type Toast = {
  id: number;
  title: string;
  description?: string;
  image?: string;
  variant: 'success' | 'error' | 'info';
};

type ToastContextType = {
  showToast: (toast: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="no-print fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 w-80 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl shadow-black/10 animate-[toastIn_0.4s_cubic-bezier(0.16,1,0.3,1)]"
          >
            {t.image ? (
              <img src={t.image} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-green-600" /> {t.title}
              </p>
              {t.description ? (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</p>
              ) : null}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-300 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
