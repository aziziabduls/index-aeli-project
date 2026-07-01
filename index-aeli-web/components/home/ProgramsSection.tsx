'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Star, Clock, ArrowRight } from 'lucide-react';
import { Destination, Program } from '@/types';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrency } from '@/lib/CurrencyContext';
import { AnimatedContainer } from '../ui/AnimatedContainer';


interface ProgramsSectionProps {
  programs: Program[];
  destinations: Destination[];
  filteredTours: Program[];
  onCategoryChange: (category: string) => void;
  activeCategory: string;
}

export default function ProgramsSection({ programs, destinations, filteredTours, onCategoryChange, activeCategory }: ProgramsSectionProps) {
  const { formatPrice } = useCurrency();

  // Dynamically extract unique categories from the programs available
  const categories = ['All', ...Array.from(new Set(programs.map(p => p.category).filter(Boolean)))];

  return (
    <section id="program" className="py-24 max-w-7xl mx-auto px-6 md:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary mb-2 block">Curated Journeys</span>
        <h2 className="font-display font-extrabold text-3xl md:text-5xl text-primary-dark mb-4">
          Best Selling Popular Program
        </h2>
        <p className="text-zinc-500">
          Hand-picked itineraries designed by local experts to provide immersive, unforgettable travel memories.
        </p>
      </div>

      {/* Filter Categories */}
      <Tabs
        value={activeCategory}
        onValueChange={(val) => onCategoryChange(val)}
        className="w-full flex flex-col items-center mb-10"
      >
        <TabsList variant="line" className="gap-2 overflow-x-auto pb-2 no-scrollbar max-w-full justify-start md:justify-center p-0 h-auto flex-nowrap">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="px-6 py-2.5 rounded-full font-display font-semibold text-sm cursor-pointer border border-zinc-200 transition-all data-active:bg-primary data-active:text-primary-light data-active:shadow-md data-active:shadow-primary/25 bg-zinc-100 hover:bg-zinc-200/70 text-zinc-600 after:hidden whitespace-nowrap flex-shrink-0"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Programs Grid */}
      <AnimatePresence mode="wait">
        {filteredTours.length > 0 ? (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredTours.map((program) => (
              <motion.div
                layout
                key={program.id}
                className="bg-white rounded-[24px] overflow-hidden shadow-luxury border border-zinc-100/50 hover:shadow-luxury-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
              >
                {/* Program Image */}
                <div className="relative aspect-[16/11] overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Category Tag */}
                  <span className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-md text-primary-dark text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-sm">
                    {program.category}
                  </span>

                  {/* Duration */}
                  <span className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" /> {program.duration}
                  </span>
                </div>

                {/* Program Details */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                        {destinations.find(d => d.id === program.destinationId)?.name || 'Indonesia'}
                      </span>
                      <div className="flex items-center gap-1 text-accent font-bold text-xs">
                        <Star className="w-3.5 h-3.5 text-green-500 fill-green-500" />
                        <span className="text-green-500 font-extrabold">{program.rating}</span>
                        <span className="text-zinc-400 font-normal">({program.reviewsCount})</span>
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-lg text-primary-dark mb-2 line-clamp-2 hover:text-primary transition-colors">
                      <Link href={`/programs/${program.id}`}>{program.name}</Link>
                    </h3>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 mb-6">
                      {program.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Start from</span>
                      <span className="text-xl font-display font-extrabold text-primary-dark">
                        {formatPrice(program.price)} <span className="text-xs font-normal text-zinc-500">/ person</span>
                      </span>
                    </div>
                    <Link
                      href={`/programs/${program.id}`}
                      className={buttonVariants({
                        variant: "cobalt",
                        className: "h-11 px-5 text-xs flex items-center justify-center gap-1.5"
                      })}
                    >
                      <span>Book Program</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-zinc-50 rounded-3xl border border-zinc-100">
            <Compass className="w-12 h-12 text-zinc-300 mx-auto mb-4 animate-bounce" />
            <h3 className="font-display font-semibold text-lg text-zinc-800">No programs matching your filter</h3>
            <p className="text-zinc-500 text-sm mt-1">Please try a different category or search term.</p>
          </div>
        )}
      </AnimatePresence>

      {/* view all programs in center */}
      <AnimatedContainer animation="fadeIn" delay={0.2} className="mt-14 flex justify-center">
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-luxury"
        >
          View All Programs <ArrowRight className="w-4 h-4" />
        </Link>
      </AnimatedContainer>
    </section>
  );
}
