import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  maxStock: number;
  onChange: (qty: number) => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({ quantity, maxStock, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Qty</span>
      <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
        <button
          onClick={() => onChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus size={16} />
        </button>
        <span className="flex h-10 w-12 items-center justify-center border-x border-gray-300 text-sm font-bold text-gray-900 bg-white">
          {quantity}
        </span>
        <button
          onClick={() => onChange(Math.min(maxStock, quantity + 1))}
          disabled={quantity >= maxStock}
          className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase quantity"
        >
          <Plus size={16} />
        </button>
      </div>
      {quantity >= maxStock && (
        <span className="text-xs font-medium text-amber-600">Max stock reached</span>
      )}
    </div>
  );
};
