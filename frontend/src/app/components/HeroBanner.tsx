import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroBanner() {
  const scrollToProducts = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  };
  return (
    <>
      <section className="relative w-full overflow-hidden bg-[#0a0a0a] text-white">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
              <Sparkles size={12} /> New Season 2026
            </span>
            <h1 className="mt-6 text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95]">
              Wear your<br />
              <span className="italic font-light text-white/90">aura.</span>
            </h1>
            <p className="mt-6 max-w-md text-base sm:text-lg text-white/70 leading-relaxed">
              Timeless silhouettes. Modern comfort. Pieces that move with your story.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#products"
                onClick={scrollToProducts}
                className="group inline-flex items-center gap-2 rounded-full bg-white text-black font-bold px-8 py-4 text-sm tracking-wide shadow-2xl hover:bg-gray-100 transition-all hover:-translate-y-0.5 hover:scale-[1.03] cursor-pointer"
              >
                Shop the collection
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5" />
              </a>
              <a
                href="#new-arrivals"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('new-arrivals');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    // Fallback to products grid if New Arrivals isn't mounted
                    // (e.g. when a category filter is active).
                    document
                      .getElementById('products')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white font-semibold px-8 py-4 text-sm tracking-wide transition-colors hover:border-white hover:bg-white hover:text-black cursor-pointer"
              >
                Explore new arrivals
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Announcement marquee */}
      <div className="bg-black text-white text-xs font-semibold uppercase tracking-[0.2em] py-3 overflow-hidden border-b border-white/10">
        <div className="flex gap-12 animate-[marquee_28s_linear_infinite] whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <React.Fragment key={i}>
              <span>✦ Free shipping over $100</span>
              <span>✦ 30-day easy returns</span>
              <span>✦ Crafted in Europe</span>
              <span>✦ New season drops every Friday</span>
              <span>✦ Carbon-neutral delivery</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
