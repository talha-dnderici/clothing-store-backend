import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        {icon ?? <SearchX size={36} className="text-gray-400" />}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 active:scale-95 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
