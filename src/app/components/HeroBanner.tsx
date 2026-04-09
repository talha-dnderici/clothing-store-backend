import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  bgImage: string;
  bgColor: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Spring Collection 2026',
    subtitle: 'Refresh your wardrobe with vibrant new arrivals designed for the season.',
    cta: 'Shop Now',
    bgImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80',
    bgColor: 'from-black/60 to-black/20',
  },
  {
    id: 2,
    title: 'Up to 40% Off',
    subtitle: 'Limited-time sale on premium essentials. Don\'t miss out.',
    cta: 'View Sale',
    bgImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&q=80',
    bgColor: 'from-black/70 to-black/10',
  },
  {
    id: 3,
    title: 'Curated for You',
    subtitle: 'Hand-picked styles that define modern elegance.',
    cta: 'Explore',
    bgImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80',
    bgColor: 'from-black/60 to-transparent',
  },
];

export const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = useCallback((idx: number) => setCurrent(idx), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), []);
  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), []);

  return (
    <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[500px] overflow-hidden rounded-2xl mx-auto max-w-7xl mt-6 group">
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={slide.bgImage}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgColor}`} />

          <div className="relative z-10 flex h-full items-center px-8 sm:px-14 lg:px-20">
            <div className="max-w-lg">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight drop-shadow-lg">
                {slide.title}
              </h2>
              <p className="text-base sm:text-lg text-gray-200 mb-8 leading-relaxed drop-shadow-sm">
                {slide.subtitle}
              </p>
              <button className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black shadow-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95">
                {slide.cta}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
