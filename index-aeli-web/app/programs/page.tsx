'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, ArrowRight, Compass, Search } from 'lucide-react';
import { getDestinations, getPrograms } from '@/lib/api';
import { Destination, Program } from '@/types';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/lib/CurrencyContext';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

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
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDest && matchesAttr && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden bg-zinc-50 pt-0 pb-24 min-h-screen">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-primary/5 rounded-bl-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-[500px] bg-blue-500/5 rounded-tr-full blur-3xl -z-10" />
      <div className="h-24 bg-primary-dark mb-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <AnimatedContainer animation="slideInLeft" className="max-w-xl text-left">
            <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary mb-2 block">Curated Journeys</span>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-primary-dark mb-4">
              Best Selling Tour Programs
            </h1>
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
              Hand-picked itineraries designed by local experts to provide immersive, unforgettable travel memories across Indonesia.
            </p>
          </AnimatedContainer>

          {/* Filters Row */}
          <AnimatedContainer animation="fadeIn" delay={0.2} className="flex flex-col sm:flex-row gap-4 w-full lg:max-w-xl shrink-0 text-left">
            {/* Filter by Destination */}
            <div className="flex flex-col flex-1">
              <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Compass className="w-3.5 h-3.5 text-primary" /> Destination
              </label>
              <Select
                value={selectedDestId}
                onValueChange={(val) => setSelectedDestId(val || 'all')}
              >
                <SelectTrigger className="w-full bg-white border rounded-xl border-zinc-200 py-3 font-semibold text-zinc-900 h-12 shadow-sm px-4 text-sm hover:bg-transparent">
                  <SelectValue placeholder="All Destinations">
                    {selectedDestId === 'all'
                      ? 'All Destinations'
                      : destinations.find(d => d.id === selectedDestId)?.name || 'All Destinations'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-1 z-50">
                  <SelectItem value="all">All Destinations</SelectItem>
                  {destinations.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="flex flex-col flex-1">
              <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Search className="w-3.5 h-3.5 text-primary" /> Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search programs..."
                  className="w-full h-12 pl-11 pr-4 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-zinc-800 text-sm transition-all shadow-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
              </div>
            </div>
          </AnimatedContainer>
        </div>

        {/* Category Tabs Filter */}
        <AnimatedContainer animation="fadeIn" delay={0.1} className="w-full flex flex-col items-center mb-10 text-left">
          <Tabs
            value={activeCategory}
            onValueChange={(val) => setActiveCategory(val)}
            className="w-full"
          >
            <TabsList variant="line" className="gap-2 overflow-x-auto pb-2 no-scrollbar max-w-full justify-start md:justify-center p-0 h-auto flex-nowrap bg-transparent">
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
        </AnimatedContainer>

        {/* Programs Grid */}
        <AnimatePresence mode="wait">
          {filteredPrograms.length > 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredPrograms.map((program) => (
                <motion.div
                  layout
                  key={program.id}
                  className="bg-white rounded-[24px] overflow-hidden shadow-luxury border border-zinc-100/50 hover:shadow-luxury-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full text-left"
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
            <div className="text-center py-16 bg-white rounded-3xl border border-zinc-150 max-w-md mx-auto">
              <Compass className="w-12 h-12 text-zinc-300 mx-auto mb-4 animate-pulse" />
              <h3 className="font-display font-semibold text-lg text-zinc-800">No programs found</h3>
              <p className="text-zinc-500 text-sm mt-1">Try resetting the filters or modifying your search query.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ProgramsListPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <ProgramsListContent />
    </Suspense>
  );
}
