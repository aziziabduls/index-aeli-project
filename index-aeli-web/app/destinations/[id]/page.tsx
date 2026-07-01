'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Compass, MapPin, Calendar, Star, CloudSun, Clock, Info,
  ArrowLeft, ArrowRight, Image as ImageIcon, Map
} from 'lucide-react';
import { getDestinationById, getAttractions } from '@/lib/api';
import { Destination, Attraction } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { buttonVariants } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DestinationDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const destId = resolvedParams.id;

  const [destination, setDestination] = useState<Destination | null>(null);
  const [destAttractions, setDestAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dest, attrs] = await Promise.all([
          getDestinationById(destId),
          getAttractions(destId)
        ]);
        setDestination(dest);
        setDestAttractions(attrs);
      } catch (error) {
        console.error('Failed to fetch destination data', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [destId]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-luxury-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!destination) {
    return notFound();
  }

  return (
    <div className="w-full relative overflow-hidden bg-luxury-bg min-h-screen pb-20">
      {/* 1. HERO BANNER */}
      <section className="relative h-[65vh] md:h-[75vh] w-full flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            priority
            className="object-cover"
          />
          {/* Dark Glass Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/35 to-black/20" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8 pb-16 md:pb-24 text-white">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-secondary-light mb-6 transition-colors bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight mb-4">
            {destination.name}
          </h1>
          <p className="text-zinc-200 text-sm md:text-base max-w-xl leading-relaxed font-light">
            {destination.description}
          </p>
        </div>
      </section>

      {/* 2. OVERVIEW & QUICK FACTS GRID */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Overview text & Weather info */}
        <div className="lg:col-span-2 space-y-10">
          <AnimatedContainer animation="fadeInUp">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-dark mb-4">Destination Overview</h2>
            <div className="text-zinc-600 text-base leading-relaxed space-y-4">
              <p>
                {destination.name} stands as one of the most remarkable travel hubs in Indonesia, offering travelers a vibrant mix of sights, sounds, culture, and nature. From the warm welcoming locals to the rich ancestral heritage, visiting this region offers a completely immersive tropical escape.
              </p>
              <p>
                Whether you seek thrilling volcanic mountaineering, deep-sea coral diving, or simply relaxing inside luxury eco-resorts, {destination.name} is meticulously prepared to accommodate your exact holiday dreams with unparalleled natural assets.
              </p>
            </div>
          </AnimatedContainer>

          {/* Weather & Best Time to Visit */}
          <AnimatedContainer animation="fadeInUp" delay={0.1} className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {/* Weather Card */}
            <div className="bg-white border border-zinc-100 rounded-[20px] p-6 shadow-luxury flex items-start gap-4">
              <div className="p-3 bg-secondary/15 rounded-2xl text-primary">
                <CloudSun className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Current Weather</h3>
                <div className="font-display font-bold text-2xl text-primary-dark">{destination.weather.temperature}</div>
                <p className="text-zinc-500 text-sm">{destination.weather.condition}</p>
              </div>
            </div>

            {/* Best Time Card */}
            <div className="bg-white border border-zinc-100 rounded-[20px] p-6 shadow-luxury flex items-start gap-4">
              <div className="p-3 bg-accent/10 rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Best Time to Visit</h3>
                <div className="font-display font-bold text-lg text-primary-dark">{destination.bestTimeToVisit}</div>
                <p className="text-zinc-500 text-xs font-light">Ideal months for sightseeing</p>
              </div>
            </div>
          </AnimatedContainer>
        </div>

        {/* Right: Quick Facts Card */}
        <AnimatedContainer animation="slideInRight" className="lg:col-span-1">
          <div className="bg-primary-dark text-white rounded-[24px] p-8 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-display font-bold text-xl text-white mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-secondary" /> Quick Facts
            </h3>
            <ul className="space-y-6 text-sm">
              {[
                { label: 'Regional Capital', value: destination.quickFacts.capital },
                { label: 'Estimated Population', value: destination.quickFacts.population },
                { label: 'Spoken Languages', value: destination.quickFacts.language },
                { label: 'Timezone', value: destination.quickFacts.timezone }
              ].map((fact) => (
                <li key={fact.label} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <span className="text-zinc-400 block text-xs uppercase tracking-wider mb-1">{fact.label}</span>
                  <span className="font-semibold text-white text-base">{fact.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </AnimatedContainer>
      </section>

      {/* 3. PHOTO GALLERY */}
      <section className="bg-white py-16 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-dark mb-8 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary" /> Photo Gallery
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(destination.gallery ?? []).map((img, idx) => (
              <AnimatedContainer
                key={idx}
                animation="scaleIn"
                delay={idx * 0.05}
                className={`relative overflow-hidden rounded-[20px] shadow-sm hover:shadow-md transition-all group ${idx === 0 ? 'col-span-2 row-span-2 aspect-[4/3] md:aspect-auto' : 'aspect-square'
                  }`}
              >
                <Image
                  src={img}
                  alt={`${destination.name} scenery ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MAP PLACEHOLDER */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-dark mb-6 flex items-center gap-2">
          <Map className="w-6 h-6 text-primary" /> Destination Map
        </h2>
        <div className="relative aspect-[21/9] w-full rounded-[24px] overflow-hidden border border-zinc-200 shadow-luxury">
          {/* Map Image Placeholder */}
          <Image
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
            alt="Interactive Map Placeholder of Indonesia"
            fill
            className="object-cover opacity-60 filter grayscale"
          />
          <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/20 text-white">
            <div className="p-4 bg-primary/95 text-white rounded-full shadow-lg mb-4">
              <MapPin className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="font-display font-bold text-lg md:text-xl">{destination.name}, Indonesia</h3>
            <p className="text-zinc-200 text-xs md:text-sm max-w-sm mt-1">
              Geographical map interface is currently visual-only for the MVP demo.
            </p>
          </div>
        </div>
      </section>

      {/* 5. POPULAR ATTRACTIONS */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-dark mb-8">
          Popular Attractions in {destination.name}
        </h2>

        {destAttractions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destAttractions.map((attr, idx) => (
              <AnimatedContainer
                key={attr.id}
                animation="fadeInUp"
                delay={idx * 0.1}
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
                      {/* <Star className="w-3.5 h-3.5 fill-accent" /> {attr.rating} */}
                      <Star className="w-3.5 h-3.5 text-green-500 fill-green-500" />
                      <span className="text-green-500 font-extrabold">
                        {attr.rating}
                      </span>
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-primary-dark mb-2 line-clamp-1">{attr.name}</h3>
                  <p className="text-zinc-600 text-xs leading-relaxed mb-5 line-clamp-2">{attr.description}</p>
                  <Link
                    href={`/experience/${attr.id}`}
                    className={buttonVariants({
                      variant: "outline",
                      className: "w-full h-10 border-marketing-btn text-marketing-btn hover:bg-zinc-50 rounded-full font-bold text-xs flex items-center justify-center gap-1.5"
                    })}
                  >
                    <span>View Programs & Info</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </GlassCard>
              </AnimatedContainer>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-zinc-100">
            <Compass className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-semibold text-zinc-800 text-base">No attractions listed yet</h3>
            <p className="text-zinc-500 text-xs mt-1">We are actively researching landmarks for this destination.</p>
          </div>
        )}
      </section>
    </div>
  );
}
