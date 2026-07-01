'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Compass, MapPin, Calendar, Search,
  ChevronDown, MapPinned, CompassIcon, Users, Trees
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
    ? attractions.filter(attr => attr.destinationId === searchDest)
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
    <section className="relative h-[100vh] md:h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image Parallax */}
      <div className="absolute inset-0 z-0">
        <Image
          src={'/hero_banner.png'}
          alt="Beautiful Indonesian Tropical Shoreline"
          fill
          priority
          className="object-cover"
        />
        {/* Elegant Dark Tropical Gradient Overlay color primary-dark/10 via primary-dark/40 to luxury-bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/10 via-primary-dark/10 to-black" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white flex flex-col items-center justify-end md:justify-center w-full h-full pt-20 pb-10 md:pb-0 md:pt-0">

        {/* title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display italic font-extrabold text-2xl sm:text-4xl md:text-5xl leading-tight sm:leading-none tracking-tight mb-4 sm:mb-6 mt-16 sm:mt-20 md:mt-0"
        >
          EXPLORE EVERY DESTINATION
          <br />
          {/* larger than font-extrabold */}
          <span className="text-3xl sm:text-5xl md:text-7xl">EXPERIENCE THE REAL</span> <br />
          <span className="text-4xl sm:text-6xl md:text-8xl block mt-1">INDONESIA!</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display italic text-sm sm:text-xl md:text-2xl leading-normal tracking-wide mb-4 sm:mb-6"
        >
          Bukan Sekadar Perjalanan. Ini Adalah Petualangan Bermakna.
        </motion.p>

        {/* FLOATING SEARCH CARD */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl p-2 sm:p-3 md:p-4 rounded-3xl sm:rounded-[20px] shadow-2xl text-zinc-800 backdrop-blur-sm mt-4 sm:mt-8 border border-white/10"
        >
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-end">
            {/* Destination Dropdown */}
            <div className="flex flex-col text-left px-2 py-1">
              <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-white flex items-center gap-1.5 mb-1.5">
                <Compass className="w-3.5 h-3.5 text-white" /> Destination
              </label>
              <Select
                value={searchDest}
                onValueChange={(val) => {
                  setSearchDest(val === "all" ? "" : val || "");
                  setSearchAttr(''); // Reset attraction selection on change
                }}
              >
                <SelectTrigger className="w-full bg-transparent border rounded-xl border-zinc-200 py-2 sm:py-3 font-semibold text-white h-10 sm:h-12 hover:bg-transparent shadow-none px-3 sm:px-4 text-xs sm:text-sm">
                  <span className="truncate">
                    {searchDest && searchDest !== "all"
                      ? destinations.find(d => d.id === searchDest)?.name
                      : "All Destinations"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-1 z-50">
                  <SelectItem value="all" className="text-primary">All Destinations</SelectItem>
                  {destinations.map(d => (
                    <SelectItem key={d.id} value={d.id} className="text-primary">{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attraction Dropdown */}
            <div className="flex flex-col text-left px-2 py-1">
              <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-white flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-white" /> Attraction
              </label>
              <Select
                value={searchAttr}
                onValueChange={(val) => setSearchAttr(val === "all" ? "" : val || "")}
              >
                <SelectTrigger className="w-full bg-transparent border rounded-xl border-zinc-200 py-2 sm:py-3 font-semibold text-white h-10 sm:h-12 hover:bg-transparent shadow-none px-3 sm:px-4 text-xs sm:text-sm">
                  <span className="truncate">
                    {searchAttr && searchAttr !== "all"
                      ? searchAttractions.find(a => a.id === searchAttr)?.name
                      : "All Experience"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-1 z-50">
                  <SelectItem value="all">All Experience </SelectItem>
                  {searchAttractions.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Travel Date */}
            <div className="flex flex-col text-left px-2 py-1">
              <label className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-white flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-white" /> Travel Date
              </label>
              <Popover>
                <PopoverTrigger className="w-full bg-transparent border rounded-xl border-zinc-200 py-2 sm:py-3 text-white h-10 sm:h-12 hover:bg-transparent shadow-none text-left flex items-center justify-between cursor-pointer px-3 sm:px-4 text-xs sm:text-sm">
                  <span className={searchDate ? "font-semibold text-white" : "font-normal text-zinc-400"}>
                    {searchDate ? new Date(searchDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Pick a date'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-zinc-400 opacity-70 shrink-0" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-white border border-zinc-200 shadow-xl rounded-2xl">
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
            <div className="pt-2 sm:pt-0 sm:col-span-2 md:col-span-1">
              <Button
                type="submit"
                variant="marketing"
                size="xl"
                className="w-full border border-white/90 hover:border-white/0 text-white flex items-center justify-center gap-2 h-10 sm:h-12 rounded-xl text-xs sm:text-sm hover:bg-primary-dark/90"
              >
                <Search className="w-5 h-5" />
                <span>Search Programs</span>
              </Button>
            </div>
          </form>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="w-full max-w-4xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-5 hidden md:grid">
            {/* Discover - Sky Blue */}
            <div className="flex flex-col items-center group cursor-pointer p-6 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/5 hover:backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]">
              <div className="flex items-center justify-center w-16 h-16 bg-sky-500/10 text-sky-400 backdrop-blur-xl rounded-full mb-4 border border-sky-500/20 shadow-lg shadow-sky-500/5 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-hover:bg-sky-500/20 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.5)]">
                <MapPinned className="w-8 h-8" />
              </div>
              <div className="flex flex-col items-center transition-transform duration-300 group-hover:rotate-2">
                <h3 className="text-[32px] font-extrabold mb-2 text-white uppercase tracking-wide transition-colors duration-300 group-hover:text-sky-300">Discover</h3>
                <p className="text-center text-sm text-zinc-300 font-medium transition-colors duration-300 group-hover:text-white">Hidden Gems Across Indonesia</p>
              </div>
            </div>

            {/* Explore - Amber/Gold */}
            <div className="flex flex-col items-center group cursor-pointer p-6 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/5 hover:backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]">
              <div className="flex items-center justify-center w-16 h-16 bg-amber-500/10 text-amber-400 backdrop-blur-xl rounded-full mb-4 border border-amber-500/20 shadow-lg shadow-amber-500/5 transition-all duration-300 group-hover:-rotate-12 group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]">
                <CompassIcon className="w-8 h-8" />
              </div>
              <div className="flex flex-col items-center transition-transform duration-300 group-hover:-rotate-2">
                <h3 className="text-[32px] font-extrabold mb-2 text-white uppercase tracking-wide transition-colors duration-300 group-hover:text-amber-300">Explore</h3>
                <p className="text-center text-sm text-zinc-300 font-medium transition-colors duration-300 group-hover:text-white">Hidden Gems Across Indonesia</p>
              </div>
            </div>

            {/* Connect - Indigo */}
            <div className="flex flex-col items-center group cursor-pointer p-6 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/5 hover:backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-500/10 text-indigo-400 backdrop-blur-xl rounded-full mb-4 border border-indigo-500/20 shadow-lg shadow-indigo-500/5 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                <Users className="w-8 h-8" />
              </div>
              <div className="flex flex-col items-center transition-transform duration-300 group-hover:rotate-2">
                <h3 className="text-[32px] font-extrabold mb-2 text-white uppercase tracking-wide transition-colors duration-300 group-hover:text-indigo-300">Connect</h3>
                <p className="text-center text-sm text-zinc-300 font-medium transition-colors duration-300 group-hover:text-white">Local Culture and Community</p>
              </div>
            </div>

            {/* Sustain - Emerald Green */}
            <div className="flex flex-col items-center group cursor-pointer p-6 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/5 hover:backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]">
              <div className="flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-400 backdrop-blur-xl rounded-full mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 transition-all duration-300 group-hover:-rotate-12 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_25px_rgba(52,211,153,0.5)]">
                <Trees className="w-8 h-8" />
              </div>
              <div className="flex flex-col items-center transition-transform duration-300 group-hover:-rotate-2">
                <h3 className="text-[32px] font-extrabold mb-2 text-white uppercase tracking-wide transition-colors duration-300 group-hover:text-emerald-300">Sustain</h3>
                <p className="text-center text-sm text-zinc-300 font-medium transition-colors duration-300 group-hover:text-white">For a Better Future Together</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
