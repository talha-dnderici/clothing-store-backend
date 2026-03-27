import React, { useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router';
import { Star, ShoppingCart, ArrowLeft, Check, Shield, Truck, Package } from 'lucide-react';
import { mockProducts } from '../data/mockProducts';

export default function ProductDetail() {
  const { id } = useParams();
  const product = mockProducts.find(p => p.id === id) || mockProducts[0];
  const { setCartCount } = useOutletContext<{ setCartCount: React.Dispatch<React.SetStateAction<number>> }>();
  
  // Create 3 thumbnails using the same base image but varying parameters slightly 
  // to mock multiple product angles/shots
  const thumbnails = [
    product.imageUrl,
    product.imageUrl.replace('&w=1080', '&w=1081'),
    product.imageUrl.replace('&w=1080', '&w=1082'),
  ];
  
  const [activeImage, setActiveImage] = useState(thumbnails[0]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link 
        to="/" 
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black mb-8 transition-colors group"
      >
        <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" /> 
        Back to Products
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        
        {/* Left Column: Images */}
        <div className="flex flex-col gap-4">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-100">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="h-full w-full object-cover object-center transition-opacity duration-300"
            />
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
                aria-label={`View thumbnail ${idx + 1}`}
              >
                <img 
                  src={thumb} 
                  alt={`${product.name} angle ${idx + 1}`} 
                  className="h-full w-full object-cover object-center" 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Product Details */}
        <div className="flex flex-col pt-4">
          <div className="mb-6 border-b border-gray-100 pb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              {product.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={20} className={star <= Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600 hover:text-black cursor-pointer underline underline-offset-4 transition-colors">
                (128 Reviews)
              </span>
            </div>

            <div className="text-4xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </div>
          </div>

          {/* Structured Details Section */}
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
                <dd className="font-medium text-gray-800 leading-relaxed">
                  {product.description}
                </dd>
              </div>
              
              <div className="flex flex-col">
                <dt className="text-gray-500 mb-1">Quantity in Stock</dt>
                <dd className={"font-semibold flex items-center gap-2 " + (product.stockQuantity > 0 ? "text-green-600" : "text-red-500")}>
                  {product.stockQuantity > 0 && <Check size={16} />} 
                  {product.stockQuantity > 0 ? `${product.stockQuantity} Items Available` : 'Out of Stock'}
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
                  <Truck size={16} className="text-gray-500" /> 
                  Shipped directly from {product.distributor}
                </dd>
              </div>
            </dl>
          </div>

          {/* Call to Action */}
          <div className="mt-auto">
            <button 
              onClick={() => setCartCount(prev => prev + 1)}
              disabled={product.stockQuantity === 0}
              className={`flex w-full items-center justify-center gap-3 rounded-xl py-4 px-8 text-lg font-bold shadow-xl shadow-black/10 transition-all focus:outline-none focus:ring-4 focus:ring-gray-200 active:translate-y-0 ${
                product.stockQuantity === 0 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5'
              }`}
            >
              <ShoppingCart size={24} />
              {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 bg-green-50 text-green-800 py-3 rounded-lg border border-green-100">
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
          <button className="text-sm font-bold text-black border-b-2 border-black hover:text-gray-600 hover:border-gray-600 transition-colors pb-1">
            Write a Review
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sample Review */}
          <div className="flex gap-5 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-200 overflow-hidden ring-2 ring-offset-2 ring-gray-100">
              <img 
                src="https://images.unsplash.com/photo-1563237023-b1e970526dcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMGhlYWRzaG90JTIwdXNlcnxlbnwxfHx8fDE3NzQ1MzU2Njh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                alt="Sarah Jenkins" 
                className="h-full w-full object-cover" 
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-gray-900 text-lg">Sarah Jenkins</h4>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full uppercase tracking-wider">
                    <Check size={10} strokeWidth={3} /> Verified Buyer
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-medium">2 days ago</span>
              </div>
              
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Absolutely in love with this! The quality exceeded my expectations. 
                The material feels premium and the fit is just perfect. I've received 
                so many compliments since I started wearing it. Shipping was incredibly 
                fast too. Highly recommend AURA for their excellent products and service!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
