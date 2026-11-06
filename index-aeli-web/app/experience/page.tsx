'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Star, Compass, Search, ArrowRight, Clock } from 'lucide-react';
import { getDestinations, getAttractions } from '@/lib/api';
import { Destination, Attraction } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExperienceListPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedDestId, setSelectedDestId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dests, attrs] = await Promise.all([
          getDestinations(),
          getAttractions()
        ]);
        setDestinations(dests);
        setAttractions(attrs);
      } catch (err) {
        console.error('Failed to load experiences:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter attractions based on destination and search query
  const filteredAttractions = attractions.filter(attr => {
    const matchesDest = selectedDestId === 'all' || attr.destinationId === selectedDestId;
    const matchesSearch =
      attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attr.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attr.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDest && matchesSearch;
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
                <span>Iconic attractions</span>
              </div>
              <h1 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
                Must-Visit Top Experiences
              </h1>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                Discover unique heritage sites, volcanic marvels, and breathtaking wildlife sanctuaries across the Indonesian archipelago.
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
                <label htmlFor="search-input" className="text-xs font-medium text-white/70 block mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search experiences..."
                    className="w-full h-11 pl-10 pr-4 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-xl text-white placeholder:text-white/50 text-sm transition-colors outline-none focus:border-white focus:ring-1 focus:ring-white"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/60 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. ATTRACTIONS GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {filteredAttractions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredAttractions.map((attr, index) => (
              <motion.div
                key={attr.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
              >
                <Link
                  href={`/experience/${attr.id}`}
                  className="group flex flex-col h-full bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-zinc-300 hover:shadow-sm transition-[border-color,box-shadow] duration-200"
                >
                  {/* Thumbnail Visual (16:10 ratio) */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                    <Image
                      src={attr.image}
                      alt={attr.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-medium text-xs">
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                        <span className="tabular-nums">{attr.rating ? Number(attr.rating).toFixed(1) : '5.0'}</span>
                      </span>
                    </div>

                    {/* Location Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-medium max-w-[220px] truncate">
                        <MapPin className="size-3 text-white/80 shrink-0" />
                        <span className="truncate">{attr.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div className="space-y-2">
                      <h2 className="font-display font-medium text-lg text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
                        {attr.name}
                      </h2>
                      <p className="text-zinc-600 text-sm leading-relaxed line-clamp-2">
                        {attr.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                        {attr.openingHours ? (
                          <>
                            <Clock className="size-3 text-zinc-400" />
                            <span className="truncate max-w-[130px]">{attr.openingHours}</span>
                          </>
                        ) : (
                          'Guided access'
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">
                        <span>View experience</span>
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200/80 shadow-xs max-w-md mx-auto p-8 space-y-3">
            <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
              <Compass className="size-5" />
            </div>
            <h3 className="font-display font-medium text-base text-zinc-900">
              No experiences found
            </h3>
            <p className="text-zinc-500 text-xs sm:text-sm">
              We couldn&apos;t find any attractions matching your current filters.
            </p>
            {(selectedDestId !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
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
      </main>
    </div>
  );
}
