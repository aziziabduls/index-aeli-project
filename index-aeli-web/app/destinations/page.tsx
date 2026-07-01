'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, Compass, ArrowRight } from 'lucide-react';
import { getDestinations } from '@/lib/api';
import { Destination } from '@/types';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <AnimatedContainer animation="slideInLeft" className="max-w-xl text-left">
            <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary mb-2 block">Tropical Archipelagos</span>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-primary-dark mb-4">
              Explore Popular Destinations
            </h1>
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
              Experience the rich diversity of Indonesia across our top featured regional hotspots. Find your next tropical paradise.
            </p>
          </AnimatedContainer>

          {/* Search bar */}
          <AnimatedContainer animation="fadeIn" delay={0.2} className="w-full md:max-w-xs shrink-0 text-left">
            <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-1.5 mb-1.5">
              Search Destination
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or desc..."
                className="w-full h-12 pl-11 pr-4 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-zinc-800 text-sm transition-all shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
            </div>
          </AnimatedContainer>
        </div>

        {/* Destinations Grid */}
        {filteredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDestinations.map((dest, index) => (
              <AnimatedContainer
                key={dest.id}
                animation="fadeInUp"
                delay={index * 0.05}
              >
                <Link href={`/destinations/${dest.id}`} className="block group">
                  <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden shadow-luxury transition-all duration-500 hover:shadow-luxury-hover hover:-translate-y-1">
                    <Image
                      src={dest.image}
                      alt={dest.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Graduated Dark Glass Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/95 via-primary-dark/20 to-black/10 transition-opacity duration-300" />

                    {/* Content Over the Image */}
                    <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end text-white text-left">
                      <span className="text-xs uppercase tracking-widest text-secondary-light font-bold mb-1">
                        {dest.attractionCount} Experience{dest.attractionCount !== 1 ? 's' : ''}
                      </span>
                      <h3 className="font-display font-bold text-2xl mb-3">{dest.name}</h3>
                      <p className="text-zinc-300 text-xs line-clamp-2 mb-4 leading-relaxed font-light">
                        {dest.description}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white group-hover:text-secondary-light transition-colors">
                        Explore Destination <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimatedContainer>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-150 max-w-md mx-auto">
            <Compass className="w-12 h-12 text-zinc-300 mx-auto mb-4 animate-pulse" />
            <h3 className="font-display font-semibold text-lg text-zinc-800">No destinations found</h3>
            <p className="text-zinc-500 text-sm mt-1">Try searching with a different keyword.</p>
          </div>
        )}
      </div>
    </div>
  );
}
