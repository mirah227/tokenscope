import React from 'react';

interface ToastProps {
  message: string | null;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, visible }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed top-20 left-4 right-4 max-w-md mx-auto z-50 transform transition-all duration-300 ease-out bg-primary text-on-primary p-space-sm rounded-lg shadow-2xl flex items-center justify-between gap-space-sm ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-12 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-space-xs min-w-0">
        <span className="material-symbols-outlined text-secondary-fixed text-[18px]">
          verified
        </span>
        <span className="font-label-sm text-label-sm truncate">
          {message}
        </span>
      </div>
      <span className="font-code-sm text-code-sm text-on-primary-container shrink-0">
        Just now
      </span>
    </div>
  );
};
