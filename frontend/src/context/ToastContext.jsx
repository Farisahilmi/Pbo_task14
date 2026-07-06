import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.12)', border: '#10b981', icon: '#10b981', bar: '#10b981' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: '#ef4444', icon: '#ef4444', bar: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', icon: '#f59e0b', bar: '#f59e0b' },
  info:    { bg: 'rgba(99,179,237,0.12)', border: '#63b3ed', icon: '#63b3ed', bar: '#63b3ed' },
};

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 400);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Container — fixed bottom-right */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const c = COLORS[toast.type] || COLORS.info;
  const Icon = ICONS[toast.type] || Info;
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        pointerEvents: 'all',
        minWidth: '280px',
        maxWidth: '360px',
        background: 'var(--bg-secondary)',
        border: `1px solid ${c.border}`,
        borderLeft: `4px solid ${c.border}`,
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${c.border}22`,
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(60px) scale(0.95)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      }}
      onClick={onClose}
    >
      {/* Icon */}
      <Icon size={20} color={c.icon} style={{ flexShrink: 0, marginTop: '1px' }} />

      {/* Message */}
      <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.4', flex: 1 }}>
        {toast.message}
      </span>

      {/* Close button */}
      <X size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        background: c.bar,
        borderRadius: '0 0 0 8px',
        animation: `toast-progress ${toast.duration}ms linear forwards`
      }} />

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
