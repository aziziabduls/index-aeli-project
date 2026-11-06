'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, Compass, ArrowRight } from 'lucide-react';
import { getDestinations } from '@/lib/api';
import { Destination } from '@/types';

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDestinations() {
      try {
        const data = await getDestinations();
        setDestinations(data);
      } catch (err) {
        console.error('Failed to load destinations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDestinations();
  }, []);

  const filteredDestinations = destinations.filter(dest =>
    dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dest.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div className="max-w-xl text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Regional archipelagos</span>
              </div>
              <h1 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
                Explore Popular Destinations
              </h1>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                Experience the rich diversity of Indonesia across our top featured regional hotspots. Find your next tropical paradise.
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full md:max-w-xs shrink-0">
              <label htmlFor="dest-search" className="text-xs font-medium text-white/70 block mb-1.5">
                Search destinations
              </label>
              <div className="relative">
                <input
                  id="dest-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or region..."
                  className="w-full h-11 pl-10 pr-4 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-xl text-white placeholder:text-white/50 text-sm transition-colors outline-none focus:border-white focus:ring-1 focus:ring-white"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/60 pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. DESTINATIONS GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {filteredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredDestinations.map((dest, index) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
              >
                <Link
                  href={`/destinations/${dest.id}`}
                  className="group flex flex-col h-full bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-zinc-300 hover:shadow-sm transition-[border-color,box-shadow] duration-200"
                >
                  {/* Thumbnail Visual (16:10 ratio) */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                    <Image
                      src={dest.image}
                      alt={dest.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Pill Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-medium text-xs">
                        {dest.attractionCount} {dest.attractionCount === 1 ? 'experience' : 'experiences'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div className="space-y-2">
                      <h2 className="font-display font-medium text-lg text-zinc-900 group-hover:text-primary transition-colors">
                        {dest.name}
                      </h2>
                      <p className="text-zinc-600 text-sm leading-relaxed line-clamp-2">
                        {dest.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">
                        {dest.quickFacts?.timezone || 'Archipelago gateway'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">
                        <span>View destination</span>
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
              No destinations found
            </h3>
            <p className="text-zinc-500 text-xs sm:text-sm">
              We couldn&apos;t find any regional destinations matching &ldquo;{searchQuery}&rdquo;.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-medium text-primary hover:underline pt-2 cursor-pointer"
              >
                Clear search filter
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
