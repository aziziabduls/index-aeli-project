'use client';

import { useState, useEffect } from 'react';
import { getDestinations, getAttractions, getPrograms } from '@/lib/api';
import { Destination, Attraction, Program } from '@/types';
import HeroSection from '@/components/home/HeroSection';
import DestinationsSection from '@/components/home/DestinationsSection';
import AttractionsSection from '@/components/home/AttractionsSection';
import ProgramsSection from '@/components/home/ProgramsSection';
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection';
import StatsSection from '@/components/home/StatsSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CtaSection from '@/components/home/CtaSection';

export default function Home() {
  // Data State
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Programs filter state (shared between Hero search and Programs section)
  const [filteredTours, setFilteredTours] = useState<Program[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        const [dests, attrs, progs] = await Promise.all([
          getDestinations(),
          getAttractions(),
          getPrograms()
        ]);
        setDestinations(dests);
        setAttractions(attrs);
        setPrograms(progs);
        setFilteredTours(progs.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchResults = (results: Program[]) => {
    setFilteredTours(results);
    setActiveCategory('All');
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (cat === 'All') {
      setFilteredTours(programs.slice(0, 6));
    } else {
      setFilteredTours(programs.filter(t => t.category === cat));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden">
      <HeroSection
        destinations={destinations}
        attractions={attractions}
        programs={programs}
        onSearchResults={handleSearchResults}
      />
      <DestinationsSection destinations={destinations} />
      <AttractionsSection attractions={attractions} />
      <ProgramsSection
        programs={programs}
        destinations={destinations}
        filteredTours={filteredTours}
        onCategoryChange={handleCategoryChange}
        activeCategory={activeCategory}
      />
      <WhyChooseUsSection />
      <StatsSection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  );
}
