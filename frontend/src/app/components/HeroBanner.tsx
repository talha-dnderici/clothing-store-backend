import React from 'react';

export function HeroBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 flex flex-col items-center text-center gap-6">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Discover <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">AURA</span>
        </h1>
        <p className="max-w-xl text-lg text-gray-300 leading-relaxed">
          Premium clothing designed for the modern individual. Timeless style meets everyday comfort.
        </p>
        <a
          href="#products"
          className="mt-4 inline-block rounded-full bg-white text-black font-bold px-8 py-3 text-sm tracking-wide shadow-lg hover:bg-gray-100 hover:shadow-xl transition-all hover:-translate-y-0.5"
        >
          Shop Now
        </a>
      </div>
    </section>
  );
}
