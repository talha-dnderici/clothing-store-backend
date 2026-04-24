import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Star, ShoppingCart, ArrowLeft, Check, Shield, Truck, Package, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';
import { mapProduct } from '../utils/mapProduct';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { QuantitySelector } from '../components/QuantitySelector';
import { CatalogProduct } from '../types/catalog';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [activeImage, setActiveImage] = useState('');

  // Review states
  const [publicComments, setPublicComments] = useState<any[]>([]);
  const [ratingSummary, setRatingSummary] = useState({ ratingAverage: 0, ratingCount: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  const fetchReviews = () => {
    if (!id) return;
    Promise.all([
      api.getProductRatings(id),
      api.getProductComments(id)
    ])
      .then(([ratingsRes, commentsRes]) => {
        setRatingSummary(ratingsRes.data);
        setPublicComments(commentsRes.data);
      })
      .catch((err) => console.error('Failed to load reviews:', err));
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setQuantity(1);
    setErrorMessage('');

    api.getProduct(id!)
      .then(res => {
        if (!cancelled) {
          const mapped = mapProduct(res.data);
          setProduct(mapped);
          setActiveImage(mapped.imageUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null);
          setActiveImage('');
          setErrorMessage('This product could not be loaded from the database.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    fetchReviews();

    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-[4/5] rounded-2xl bg-gray-200" />
          <div className="space-y-6 pt-4">
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-5 w-1/3 rounded bg-gray-200" />
            <div className="h-10 w-1/4 rounded bg-gray-200" />
            <div className="h-40 rounded-2xl bg-gray-200" />
            <div className="h-14 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Products
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Product unavailable</h1>
          <p className="text-sm text-red-700">{errorMessage || 'The requested product could not be found.'}</p>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const displayPrice = product.effectivePrice ?? product.price;

  const thumbnails = [
    product.imageUrl,
    product.imageUrl.replace('&w=1080', '&w=1081'),
    product.imageUrl.replace('&w=1080', '&w=1082'),
  ];

  const handleAddToCart = () => {
    const success = addToCart({
      id: product.id,
      name: product.name,
      price: displayPrice,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
    }, quantity);

    if (success) {
      showToast({
        title: `${quantity} × added to cart`,
        description: product.name,
        image: product.imageUrl,
        variant: 'success',
      });
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 2000);
      setQuantity(1);
    }
  };

  const submitReview = async () => {
    if (!reviewRating || !id) return;
    setIsSubmittingReview(true);
    setReviewSuccess('');
    try {
      // Auto-authenticate as a test user
      const loginRes = await api.login({ email: 'customer@aura.test', password: 'password123' });
      const token = loginRes.data.token;

      const payload: Record<string, unknown> = { rating: reviewRating };
      if (reviewText.trim()) payload.content = reviewText;

      await api.submitReview(token, id, payload);

      setReviewSuccess(payload.content ? 'Review submitted and pending manager approval!' : 'Rating submitted directly!');
      setShowReviewForm(false);
      setReviewText('');
      setReviewRating(5);
      fetchReviews();
    } catch (err: any) {
      alert('Failed to submit review: ' + err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-28 lg:pb-12">
      <Link
        to="/"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black mb-8 transition-colors group"
      >
        <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
        Back to Products
      </Link>

      <nav className="mb-6 flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link to="/" className="hover:text-black transition-colors">Home</Link>
        <span>/</span>
        <Link to="/" className="hover:text-black transition-colors">{product.category}</Link>
        <span>/</span>
        <span className="text-gray-900 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Images */}
        <div className="flex flex-col gap-4">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-100 group">
            <img src={activeImage} alt={product.name} className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {thumbnails.map((thumb, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(thumb)}
                className={`aspect-square overflow-hidden rounded-xl bg-gray-50 border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
                  activeImage === thumb
                    ? 'border-black ring-2 ring-black ring-offset-1 shadow-md'
                    : 'border-transparent hover:border-gray-300 hover:shadow-sm opacity-70 hover:opacity-100'
                }`}
              >
                <img src={thumb} alt={`${product.name} angle ${idx + 1}`} className="h-full w-full object-cover object-center" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex flex-col pt-4">
          <div className="mb-6 border-b border-gray-100 pb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={20} className={star <= Math.round(ratingSummary.ratingAverage || product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600">{(ratingSummary.ratingAverage || product.rating).toFixed(1)} out of 5 ({ratingSummary.ratingCount || 0} reviews)</span>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="text-4xl font-bold text-gray-900">${displayPrice.toFixed(2)}</div>
              {product.discountActive ? (
                <>
                  <div className="pb-1 text-lg font-semibold text-gray-400 line-through">
                    ${product.price.toFixed(2)}
                  </div>
                  <span className="mb-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
                    {product.discountRate}% off
                  </span>
                </>
              ) : null}
            </div>
          </div>

          {/* Specs */}
          <div className="mb-8 rounded-2xl bg-gray-50 p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Product Specifications</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
              <div className="flex flex-col">
                <dt className="text-gray-500 mb-1">Model</dt>
                <dd className="font-semibold text-gray-900">{product.model}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-gray-500 mb-1">Serial Number</dt>
                <dd className="font-semibold text-gray-900 uppercase">{product.serialNumber}</dd>
              </div>
              <div className="flex flex-col sm:col-span-2">
                <dt className="text-gray-500 mb-1">Description</dt>
                <dd className="font-medium text-gray-800 leading-relaxed">{product.description}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-gray-500 mb-1">Quantity in Stock</dt>
                <dd className={`font-semibold flex items-center gap-2 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-600' : 'text-green-600'}`}>
                  {isOutOfStock ? (
                    <><AlertTriangle size={16} /> Out of Stock</>
                  ) : isLowStock ? (
                    <><AlertTriangle size={16} /> Only {product.stockQuantity} left!</>
                  ) : (
                    <><Check size={16} /> {product.stockQuantity} Items Available</>
                  )}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-gray-500 mb-1">Warranty Status</dt>
                <dd className="font-semibold text-gray-900 flex items-center gap-2">
                  <Shield size={16} className="text-blue-600" /> {product.warrantyStatus}
                </dd>
              </div>
              <div className="flex flex-col sm:col-span-2 pt-2 border-t border-gray-200">
                <dt className="text-gray-500 mb-1">Distributor Information</dt>
                <dd className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck size={16} className="text-gray-500" /> Shipped directly from {product.distributor}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="mt-auto space-y-4">
            {!isOutOfStock && (
              <QuantitySelector quantity={quantity} maxStock={product.stockQuantity} onChange={setQuantity} />
            )}

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex w-full items-center justify-center gap-3 rounded-xl py-4 px-8 text-lg font-bold shadow-xl shadow-black/10 transition-all focus:outline-none focus:ring-4 focus:ring-gray-200 active:translate-y-0 ${
                isOutOfStock
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : addedFeedback
                    ? 'bg-green-600 text-white'
                    : 'bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5'
              }`}
            >
              {addedFeedback ? (
                <><Check size={24} /> Added to Cart!</>
              ) : (
                <><ShoppingCart size={24} /> {isOutOfStock ? 'Out of Stock' : `Add to Cart — $${(displayPrice * quantity).toFixed(2)}`}</>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-green-800 bg-green-50 py-3 rounded-lg border border-green-100">
              <Package size={18} />
              <span>Free standard shipping on all orders over $100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-24 pt-16 border-t border-gray-200">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Comments & Reviews</h2>
          <button 
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="text-sm font-bold text-black border-b-2 border-black hover:text-gray-600 hover:border-gray-600 transition-colors pb-1"
          >
            {showReviewForm ? 'Cancel Review' : 'Write a Review'}
          </button>
        </div>

        {reviewSuccess && (
          <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800 flex items-center gap-2">
            <Check size={18} />
            {reviewSuccess}
          </div>
        )}

        {showReviewForm && (
          <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Share Your Experience</h3>
            <div className="mb-6 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  className={`h-12 w-12 rounded-xl border-2 transition-all flex items-center justify-center
                    ${value <= reviewRating
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-500'
                      : 'border-gray-100 bg-white text-gray-300 hover:border-yellow-200 hover:text-yellow-400'
                    }`}
                >
                  <Star size={20} className={value <= reviewRating ? 'fill-yellow-400' : ''} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you love about this product? (Optional)"
              rows={4}
              className="mb-4 w-full rounded-xl border-2 border-gray-100 p-4 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-0 transition-colors resize-none"
            />
            <button
              onClick={submitReview}
              disabled={isSubmittingReview}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-black px-8 py-4 text-sm font-bold text-white hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {publicComments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500 lg:col-span-2">
              <Star size={32} className="mx-auto mb-4 text-gray-300" />
              <p className="font-semibold text-gray-900">No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts on this product!</p>
            </div>
          ) : (
            publicComments.map((comment) => (
              <div key={comment.id} className="flex gap-5 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold overflow-hidden ring-2 ring-offset-2 ring-gray-100">
                  {comment.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-gray-900 text-lg">{comment.customerName}</h4>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full uppercase tracking-wider">
                        <Check size={10} strokeWidth={3} /> Verified
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} className={star <= (comment.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">
              ${(displayPrice * quantity).toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black py-3 px-4 text-sm font-bold text-white active:scale-95 transition-transform disabled:bg-gray-200 disabled:text-gray-500"
          >
            <ShoppingCart size={16} />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
