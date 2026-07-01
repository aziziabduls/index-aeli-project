'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Star, Compass, Search } from 'lucide-react';
import { getDestinations, getAttractions } from '@/lib/api';
import { Destination, Attraction } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
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
    const matchesSearch = attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attr.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attr.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDest && matchesSearch;
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
        {/* Header and filters row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <AnimatedContainer animation="slideInLeft" className="max-w-xl text-left">
            <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary mb-2 block">Iconic Experience</span>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-primary-dark mb-4">
              Must-Visit Top Experiences
            </h1>
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
              Discover unique heritage sites, volcanic marvels, and breathtaking wildlife sanctuaries across the Indonesian archipelago.
            </p>
          </AnimatedContainer>

          {/* Filters */}
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
                  placeholder="Search experiences..."
                  className="w-full h-12 pl-11 pr-4 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-zinc-800 text-sm transition-all shadow-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
              </div>
            </div>
          </AnimatedContainer>
        </div>

        {/* Attractions Grid */}
        {filteredAttractions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAttractions.map((attr, index) => (
              <AnimatedContainer
                key={attr.id}
                animation="fadeInUp"
                delay={index * 0.05}
              >
                <GlassCard
                  imageSrc={attr.image}
                  imageAlt={attr.name}
                  aspectRatio="video"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {attr.location}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-extrabold">
                      <Star className="w-3.5 h-3.5 text-green-500 fill-green-500" />
                      <span className="text-green-500 font-extrabold">
                        {attr.rating}
                      </span>
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-primary-dark mb-2 line-clamp-1 text-left">{attr.name}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed mb-5 line-clamp-2 text-left">{attr.description}</p>
                  <Link
                    href={`/experience/${attr.id}`}
                    className="inline-flex items-center justify-center w-full h-11 border border-primary/20 hover:border-primary hover:bg-primary/5 text-primary text-sm font-semibold rounded-xl transition-all"
                  >
                    View Details & Program
                  </Link>
                </GlassCard>
              </AnimatedContainer>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-150 max-w-md mx-auto">
            <Compass className="w-12 h-12 text-zinc-300 mx-auto mb-4 animate-pulse" />
            <h3 className="font-display font-semibold text-lg text-zinc-800">No experiences found</h3>
            <p className="text-zinc-500 text-sm mt-1">Try resetting the filters or modifying your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
