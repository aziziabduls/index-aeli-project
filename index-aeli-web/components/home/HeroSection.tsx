'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Compass,
  MapPin,
  Calendar as CalendarIcon,
  Search,
  ChevronDown,
  Users,
  Leaf,
  ShieldCheck,
} from 'lucide-react';
import { Destination, Attraction, Program } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface HeroSectionProps {
  destinations: Destination[];
  attractions: Attraction[];
  programs: Program[];
  onSearchResults: (results: Program[]) => void;
}

export default function HeroSection({ destinations, attractions, programs, onSearchResults }: HeroSectionProps) {
  const router = useRouter();
  const [searchDest, setSearchDest] = useState('');
  const [searchAttr, setSearchAttr] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const searchAttractions = searchDest
    ? attractions.filter((attr) => attr.destinationId === searchDest)
    : attractions;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchDest && searchDest !== 'all') {
      params.set('destinationId', searchDest);
    }
    if (searchAttr && searchAttr !== 'all') {
      params.set('attractionId', searchAttr);
    }
    if (searchDate) {
      params.set('date', searchDate);
    }

    router.push(`/programs?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[100svh] w-full flex items-center justify-center overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 md:py-32">
      {/* Background Image & Atmospheric Neutral Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero_banner.png"
          alt="Indonesian Archipelago Coastal Horizon"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Calm tinted dark overlay for text contrast without muddying the visual */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white flex flex-col items-center justify-center w-full">
        {/* Signature Eyebrow Badge */}
        {/* <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 font-medium mb-6"
        >
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span>Curated Indonesian Expeditions & Community Journeys</span>
        </motion.div> */}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-medium text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.08] max-w-4xl mb-4 sm:mb-6"
        >
          Explore every destination, <br className="hidden sm:inline" />
          experience the real Indonesia
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl leading-relaxed mb-8 sm:mb-10 font-normal"
        >
          Bukan sekadar perjalanan biasa — temukan petualangan bermakna yang menghubungkan Anda dengan alam, budaya, dan komunitas lokal.
        </motion.p>

        {/* FLOATING SEARCH CARD */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl bg-black/45 backdrop-blur-xl border border-white/15 rounded-2xl p-3 sm:p-4 shadow-2xl"
        >
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
            {/* Destination Dropdown */}
            <div className="flex flex-col text-left">
              <label className="text-xs font-medium text-white/75 flex items-center gap-1.5 mb-1.5">
                <Compass className="size-3.5 text-white/60" />
                <span>Destination</span>
              </label>
              <Select
                value={searchDest}
                onValueChange={(val) => {
                  setSearchDest(val === 'all' ? '' : val || '');
                  setSearchAttr('');
                }}
              >
                <SelectTrigger className="w-full bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-white h-11 px-3.5 text-sm transition-colors focus-visible:ring-1 focus-visible:ring-white/30">
                  <span className="truncate">
                    {searchDest && searchDest !== 'all'
                      ? destinations.find((d) => d.id === searchDest)?.name
                      : 'All destinations'}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-200 shadow-xl rounded-xl p-1 z-50">
                  <SelectItem value="all" className="text-zinc-900 font-medium">All destinations</SelectItem>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-zinc-800">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attraction Dropdown */}
            <div className="flex flex-col text-left">
              <label className="text-xs font-medium text-white/75 flex items-center gap-1.5 mb-1.5">
                <MapPin className="size-3.5 text-white/60" />
                <span>Experience</span>
              </label>
              <Select
                value={searchAttr}
                onValueChange={(val) => setSearchAttr(val === 'all' ? '' : val || '')}
              >
                <SelectTrigger className="w-full bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-white h-11 px-3.5 text-sm transition-colors focus-visible:ring-1 focus-visible:ring-white/30">
                  <span className="truncate">
                    {searchAttr && searchAttr !== 'all'
                      ? searchAttractions.find((a) => a.id === searchAttr)?.name
                      : 'All experiences'}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-200 shadow-xl rounded-xl p-1 z-50">
                  <SelectItem value="all" className="text-zinc-900 font-medium">All experiences</SelectItem>
                  {searchAttractions.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-zinc-800">
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Travel Date */}
            <div className="flex flex-col text-left">
              <label className="text-xs font-medium text-white/75 flex items-center gap-1.5 mb-1.5">
                <CalendarIcon className="size-3.5 text-white/60" />
                <span>Travel date</span>
              </label>
              <Popover>
                <PopoverTrigger className="w-full bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-white h-11 px-3.5 text-sm transition-colors focus-visible:ring-1 focus-visible:ring-white/30 text-left flex items-center justify-between cursor-pointer">
                  <span className={searchDate ? 'font-medium text-white truncate' : 'text-white/60 truncate'}>
                    {searchDate
                      ? new Date(searchDate).toLocaleDateString(undefined, { dateStyle: 'medium' })
                      : 'Pick a date'}
                  </span>
                  <ChevronDown className="size-4 text-white/50 shrink-0" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-white border border-zinc-200 shadow-xl rounded-xl">
                  <CalendarComponent
                    mode="single"
                    selected={searchDate ? new Date(searchDate) : undefined}
                    onSelect={(date) => {
                      if (!date) {
                        setSearchDate('');
                        return;
                      }
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setSearchDate(`${year}-${month}-${day}`);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Button */}
            <div className="pt-1 sm:pt-0">
              <Button
                type="submit"
                size="lg"
                className="w-full h-11 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Search className="size-4" />
                <span>Search programs</span>
              </Button>
            </div>
          </form>
        </motion.div>

        {/* VALUE PILLARS & TRUST DOCK */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl mt-8 sm:mt-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Discover */}
            <div className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center size-9 rounded-lg bg-white/10 text-white/90 mb-2.5">
                <MapPin className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Discover</h3>
              <p className="text-xs text-white/65 leading-snug">Hidden gems across the archipelago</p>
            </div>

            {/* Explore */}
            <div className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center size-9 rounded-lg bg-white/10 text-white/90 mb-2.5">
                <Compass className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Explore</h3>
              <p className="text-xs text-white/65 leading-snug">Curated tours with certified local guides</p>
            </div>

            {/* Connect */}
            <div className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center size-9 rounded-lg bg-white/10 text-white/90 mb-2.5">
                <Users className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Connect</h3>
              <p className="text-xs text-white/65 leading-snug">Immersive heritage & local communities</p>
            </div>

            {/* Sustain */}
            <div className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center size-9 rounded-lg bg-white/10 text-white/90 mb-2.5">
                <Leaf className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Sustain</h3>
              <p className="text-xs text-white/65 leading-snug">Responsible travel empowering locals</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
