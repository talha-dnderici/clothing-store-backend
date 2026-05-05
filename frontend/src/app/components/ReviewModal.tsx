import React, { useEffect, useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

interface ReviewModalProps {
  productId: string;
  productName: string;
  productImage?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

/**
 * Modal that lets a customer leave a star rating + written comment for a
 * delivered product. Submits via `api.submitReview` (which posts to
 * `/products/:id/reviews`). The comment portion follows the manager-approval
 * flow on the backend, so a friendly note is shown to set expectations.
 */
export function ReviewModal({
  productId,
  productName,
  productImage,
  isOpen,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever modal re-opens for a different product.
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setComment('');
      setError(null);
    }
  }, [isOpen, productId]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('token') ?? '' : '';
    if (!token) {
      setError('You need to be signed in to leave a review.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setError('Please pick a rating between 1 and 5 stars.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { rating };
      if (comment.trim()) payload.comment = comment.trim();
      await api.submitReview(token, productId, payload);
      showToast({
        title: 'Review submitted',
        description: comment.trim()
          ? 'Your comment will be visible after manager approval.'
          : 'Thanks for rating!',
        variant: 'success',
      });
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close review modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      />

      {/* Panel */}
      <div className="relative w-full sm:w-[480px] max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl ring-1 ring-black/5 animate-[fadeIn_0.25s_ease-out]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8">
          <h2
            id="review-modal-title"
            className="text-2xl font-extrabold tracking-tight text-gray-900 pr-8"
          >
            Rate your purchase
          </h2>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
            {productImage && (
              <img
                src={productImage}
                alt={productName}
                className="h-12 w-12 rounded-xl object-cover"
              />
            )}
            <p className="text-sm font-semibold text-gray-900 line-clamp-2">{productName}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" data-testid="review-form">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your rating
              </label>
              <div
                className="flex items-center gap-1.5"
                role="radiogroup"
                aria-label="Star rating"
              >
                {[1, 2, 3, 4, 5].map((value) => {
                  const filled = value <= (hoverRating || rating);
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={value === rating}
                      aria-label={`${value} star${value === 1 ? '' : 's'}`}
                      data-testid={`star-${value}`}
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 -m-1 rounded transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={32}
                        className={
                          filled
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-transparent text-gray-300'
                        }
                      />
                    </button>
                  );
                })}
                <span className="ml-3 text-sm font-bold tabular-nums text-gray-700">
                  {rating}/5
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Comment <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Share what you loved (or didn't) about this product…"
                className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <p className="mt-1 text-xs text-gray-500">
                {comment.length}/500 — comments are reviewed by a manager before they
                appear publicly.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                data-testid="review-submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800 active:scale-95 transition disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send size={14} /> Submit review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
