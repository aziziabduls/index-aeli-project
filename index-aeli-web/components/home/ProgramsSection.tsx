'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, Compass, Star, Users } from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';
import { Destination, Program } from '@/types';

function formatQuota(min?: number | null, max?: number | null): string {
  if (min && max) {
    if (min === max) return `${max} guests`;
    return `${min}–${max} guests`;
  }
  if (max) return `Max ${max} guests`;
  if (min) return `Min ${min} guests`;
  return '';
}

interface ProgramsSectionProps {
  programs: Program[];
  destinations: Destination[];
  filteredTours: Program[];
  onCategoryChange: (category: string) => void;
  activeCategory: string;
}

export default function ProgramsSection({
  programs,
  destinations,
  filteredTours,
  onCategoryChange,
  activeCategory,
}: ProgramsSectionProps) {
  const { formatPrice } = useCurrency();

  // Dynamically extract unique categories from the programs available
  const categories = ['All', ...Array.from(new Set(programs.map(p => p.category).filter(Boolean)))];

  return (
    <section id="program" className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/15 text-primary text-xs font-medium">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>Curated journeys</span>
        </div>
        <h2 className="font-display font-medium text-3xl sm:text-4xl text-zinc-900 tracking-tight">
          Featured Expeditions & Programs
        </h2>
        <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
          Hand-picked itineraries designed by certified local guides to provide immersive, unforgettable travel memories.
        </p>
      </div>

      {/* Category Segmented Control */}
      {categories.length > 1 && (
        <div className="w-full flex items-center justify-start sm:justify-center mb-10 overflow-x-auto pb-2 no-scrollbar">
          <div className="inline-flex items-center gap-1.5 p-1 bg-zinc-100 rounded-full border border-zinc-200/70 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Programs Grid */}
      <AnimatePresence mode="wait">
        {filteredTours.length > 0 ? (
          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {filteredTours.map((program) => {
              const destinationName = destinations.find(d => d.id === program.destinationId)?.name || 'Indonesia';
              return (
                <div
                  key={program.id}
                  className="group flex flex-col h-full bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-zinc-300 hover:shadow-sm transition-[border-color,box-shadow] duration-200 text-left"
                >
                  {/* Program Thumbnail */}
                  <Link href={`/programs/${program.id}`} className="block relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                    <Image
                      src={program.image}
                      alt={program.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Category Tag */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-medium text-xs">
                        {program.category}
                      </span>
                    </div>

                    {/* Date Availability Tag */}
                    {program.dateAvailability && program.dateAvailability !== 'all_days' && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-medium">
                          {program.dateAvailability === 'weekends'
                            ? 'Weekends'
                            : program.dateAvailability === 'weekdays'
                              ? 'Weekdays'
                              : 'Scheduled dates'}
                        </span>
                      </div>
                    )}

                    {/* Duration & Quota Badges */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                        <Clock className="size-3 text-white/80" />
                        <span>{program.duration}</span>
                      </span>
                      {(program.minQuota || program.maxQuota || program.maxGuestMin || program.maxGuestMax) ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                          <Users className="size-3 text-white/80" />
                          <span>{formatQuota(program.minQuota ?? program.maxGuestMin, program.maxQuota ?? program.maxGuestMax)}</span>
                        </span>
                      ) : null}
                    </div>
                  </Link>

                  {/* Program Details */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-400">
                          {destinationName}
                        </span>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="size-3 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-zinc-900 tabular-nums">{program.rating ? Number(program.rating).toFixed(1) : '5.0'}</span>
                          <span className="text-zinc-400">({program.reviewsCount || 0})</span>
                        </div>
                      </div>

                      <h3 className="font-display font-medium text-lg text-zinc-900 group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        <Link href={`/programs/${program.id}`}>{program.name}</Link>
                      </h3>

                      <p className="text-zinc-600 text-sm leading-relaxed line-clamp-2 mb-6">
                        {program.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                      <div>
                        <span className="text-[11px] text-zinc-400 block">From</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-display font-medium text-lg sm:text-xl text-zinc-900 tracking-tight tabular-nums">
                            {formatPrice(program.price)}
                          </span>
                          <span className="text-xs text-zinc-500">/ guest</span>
                        </div>
                      </div>

                      <Link
                        href={`/programs/${program.id}`}
                        className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>Book</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-200/80 shadow-xs max-w-md mx-auto p-8 space-y-3">
            <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
              <Compass className="size-5" />
            </div>
            <h3 className="font-display font-medium text-base text-zinc-900">
              No programs found
            </h3>
            <p className="text-zinc-500 text-xs sm:text-sm">
              No itineraries match the selected category filter.
            </p>
          </div>
        )}
      </AnimatePresence>

      {/* View All Programs Action */}
      <div className="mt-14 flex justify-center">
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors shadow-xs"
        >
          <span>View all programs</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
