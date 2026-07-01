'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const reviews = [
  { id: '1', name: 'Sarah Jenkins', country: 'United Kingdom', rating: 5, text: 'Our trip to Komodo was absolutely magical. The guides were incredibly knowledgeable and the yacht was pristine.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop' },
  { id: '2', name: 'Michael Chen', country: 'Singapore', rating: 5, text: 'The Ubud cultural tour exceeded our expectations. Our local guide made sure we experienced the authentic side of Bali.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop' },
  { id: '3', name: 'Emma Watson', country: 'Australia', rating: 4, text: 'Trekking Rinjani was challenging but the views from the crater lake were worth every step. Highly recommended for adventurers.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop' },
];

export default function TestimonialsSection() {
  const [currentReview, setCurrentReview] = useState(0);

  const handleNextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const handlePrevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <section className="py-24 max-w-5xl mx-auto px-6 md:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary mb-2 block">Customer Stories</span>
        <h2 className="font-display font-extrabold text-3xl md:text-5xl text-primary-dark">
          What Our Travelers Say
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative bg-white border border-zinc-100 rounded-[30px] p-8 md:p-12 shadow-luxury overflow-hidden">
        <div className="relative h-64 md:h-48 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentReview}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-6 items-center text-left"
            >
              {/* Avatar */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0 mx-auto md:mx-0">
                <Image
                  src={reviews[currentReview].avatar}
                  alt={reviews[currentReview].name}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Review Text */}
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-accent">
                  {Array.from({ length: reviews[currentReview].rating }).map((_, i) => (
                    <Star key={i} className="w-4.5 h-4.5 text-green-500 fill-green-500" />
                  ))}
                </div>
                <p className="text-zinc-600 text-sm md:text-base italic leading-relaxed">
                  &quot;{reviews[currentReview].text}&quot;
                </p>
                <div>
                  <h4 className="font-display font-bold text-primary-dark text-base">{reviews[currentReview].name}</h4>
                  <span className="text-zinc-400 text-xs font-semibold">{reviews[currentReview].country}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slider navigation buttons */}
        <div className="flex justify-end gap-3.5 mt-8 md:-mt-4 relative z-10">
          <button
            onClick={handlePrevReview}
            className="w-11 h-11 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextReview}
            className="w-11 h-11 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
