'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, Compass, Search, Star, Users } from 'lucide-react';
import { getDestinations, getPrograms } from '@/lib/api';
import { useCurrency } from '@/lib/CurrencyContext';
import { Destination, Program } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatQuota(min?: number | null, max?: number | null): string {
  if (min && max) {
    if (min === max) return `${max} guests`;
    return `${min}–${max} guests`;
  }
  if (max) return `Max ${max} guests`;
  if (min) return `Min ${min} guests`;
  return '';
}

function ProgramsListContent() {
  const { formatPrice } = useCurrency();
  const searchParams = useSearchParams();

  const urlDestId = searchParams.get('destinationId') || 'all';
  const urlAttrId = searchParams.get('attractionId') || 'all';

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedDestId, setSelectedDestId] = useState(urlDestId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dests, progs] = await Promise.all([
          getDestinations(),
          getPrograms()
        ]);
        setDestinations(dests);
        setPrograms(progs);
      } catch (err) {
        console.error('Failed to load programs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Keep selected destination in sync with URL search parameter if it changes
  useEffect(() => {
    if (urlDestId) {
      setSelectedDestId(urlDestId);
    }
  }, [urlDestId]);

  const categories = ['All', ...Array.from(new Set(programs.map(p => p.category).filter(Boolean)))];

  // Filter programs based on category, destination, attraction, and search query
  const filteredPrograms = programs.filter(program => {
    const matchesCategory = activeCategory === 'All' || program.category === activeCategory;
    const matchesDest = selectedDestId === 'all' || program.destinationId === selectedDestId;
    const matchesAttr = urlAttrId === 'all' || program.attractionId === urlAttrId;
    const matchesSearch =
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDest && matchesAttr && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#FAFAFA]">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      {/* 1. HERO HEADER (Dark surface provides contrast for fixed transparent navbar) */}
      <section className="bg-primary-dark text-white pt-32 pb-16 sm:pb-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
          >
            <div className="max-w-xl text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Curated journeys</span>
              </div>
              <h1 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
                Best Selling Tour Programs
              </h1>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                Hand-picked itineraries designed by local experts to provide immersive, unforgettable travel memories across Indonesia.
              </p>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3.5 w-full lg:max-w-lg shrink-0 text-left">
              {/* Filter by Destination */}
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium text-white/70 block mb-1.5">
                  Destination
                </label>
                <Select
                  value={selectedDestId}
                  onValueChange={(val) => setSelectedDestId(val || 'all')}
                >
                  <SelectTrigger className="w-full h-11 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-3.5 text-sm font-medium text-white shadow-none transition-colors outline-none focus:border-white focus:ring-1 focus:ring-white">
                    <SelectValue placeholder="All destinations">
                      {selectedDestId === 'all'
                        ? 'All destinations'
                        : destinations.find(d => d.id === selectedDestId)?.name || 'All destinations'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-1 z-50 text-zinc-900">
                    <SelectItem value="all">All destinations</SelectItem>
                    {destinations.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div className="flex flex-col flex-1">
                <label htmlFor="program-search" className="text-xs font-medium text-white/70 block mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <input
                    id="program-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search programs..."
                    className="w-full h-11 pl-10 pr-4 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-xl text-white placeholder:text-white/50 text-sm transition-colors outline-none focus:border-white focus:ring-1 focus:ring-white"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/60 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Category Tabs Segmented Control */}
        {categories.length > 1 && (
          <div className="w-full flex items-center justify-start sm:justify-center mb-10 overflow-x-auto pb-2 no-scrollbar">
            <div className="inline-flex items-center gap-1.5 p-1 bg-zinc-100 rounded-full border border-zinc-200/70 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
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
          {filteredPrograms.length > 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {filteredPrograms.map((program) => {
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

                        <h2 className="font-display font-medium text-lg text-zinc-900 group-hover:text-primary transition-colors line-clamp-2 mb-2">
                          <Link href={`/programs/${program.id}`}>{program.name}</Link>
                        </h2>

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
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200/80 shadow-xs max-w-md mx-auto p-8 space-y-3">
              <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
                <Compass className="size-5" />
              </div>
              <h3 className="font-display font-medium text-base text-zinc-900">
                No tour programs found
              </h3>
              <p className="text-zinc-500 text-xs sm:text-sm">
                We couldn&apos;t find any expedition programs matching your current filter criteria.
              </p>
              {(activeCategory !== 'All' || selectedDestId !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('All');
                    setSelectedDestId('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-medium text-primary hover:underline pt-2 cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function ProgramsListPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#FAFAFA]">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProgramsListContent />
    </Suspense>
  );
}
