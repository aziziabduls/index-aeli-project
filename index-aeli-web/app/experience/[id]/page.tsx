'use client';

import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { buttonVariants } from '@/components/ui/button';
import { getAttractionById, getAttractions, getDestinationById, getPrograms } from '@/lib/api';
import { useCurrency } from '@/lib/CurrencyContext';
import { Attraction, Destination, Program } from '@/types';
import {
  ArrowLeft, ArrowRight,
  Clock,
  Compass, MapPin,
  ShieldCheck,
  Star
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AttractionDetail({ params }: PageProps) {
  const { formatPrice } = useCurrency();
  const resolvedParams = use(params);
  const attrId = resolvedParams.id;

  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [availableTours, setAvailableTours] = useState<Program[]>([]);
  const [nearbyAttractions, setNearbyAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const attr = await getAttractionById(attrId);
        if (!attr) {
          setIsLoading(false);
          return;
        }
        setAttraction(attr);

        const [dest, progs, attrs] = await Promise.all([
          getDestinationById(attr.destinationId),
          getPrograms(),
          getAttractions(attr.destinationId)
        ]);

        setDestination(dest);
        setAvailableTours(progs.filter(p => p.attractionId === attrId));
        setNearbyAttractions(attrs.filter(a => a.id !== attrId).slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch attraction data', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [attrId]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-luxury-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attraction) {
    return notFound();
  }

  return (
    <div className="w-full relative overflow-hidden bg-luxury-bg min-h-screen pb-20">
      {/* 1. HERO BANNER */}
      <section className="relative h-[60vh] md:h-[70vh] w-full flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={attraction.image}
            alt={attraction.name}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/35 to-black/20" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8 pb-12 text-white">
          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            {destination && (
              <Link
                href={`/destinations/${destination.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10"
              >
                <span>{destination.name}</span>
              </Link>
            )}
          </div>

          <h1 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight mb-3">
            {attraction.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-zinc-200">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-secondary-light" /> {attraction.location}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-secondary-light" /> {attraction.openingHours}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-primary-dark font-extrabold">
              <Star className="w-3.5 h-3.5 fill-primary-dark text-primary-dark" /> {attraction.rating}
            </span>
          </div>
        </div>
      </section>

      {/* 2. OVERVIEW & HISTORY & DETAILS */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Col: Overview & History */}
        <div className="lg:col-span-2 space-y-12">
          {/* Overview */}
          <AnimatedContainer animation="fadeInUp">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-dark mb-4">About this Experience</h2>
            <p className="text-zinc-600 text-base leading-relaxed">
              {attraction.description}
            </p>
          </AnimatedContainer>

          {/* History */}
          <AnimatedContainer animation="fadeInUp" delay={0.1}>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-dark mb-4">Historical Background</h2>
            <div className="bg-white border border-zinc-100 rounded-[24px] p-6 md:p-8 shadow-luxury">
              <p className="text-zinc-600 text-sm md:text-base leading-relaxed italic">
                "{attraction.history}"
              </p>
            </div>
          </AnimatedContainer>

          {/* Photos Grid */}
          {attraction.gallery && attraction.gallery.length > 0 && (
            <AnimatedContainer animation="fadeInUp" delay={0.2} className="space-y-4">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-dark">Attraction Highlights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attraction.gallery.map((img, index) => (
                  <div key={index} className="relative aspect-[16/10] overflow-hidden rounded-[20px] shadow-sm group">
                    <Image
                      src={img}
                      alt={`${attraction.name} detail ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </AnimatedContainer>
          )}
        </div>

        {/* Right Col: Practical details */}
        <div className="lg:col-span-1 space-y-8">
          {/* Attraction Metadata */}
          <AnimatedContainer animation="slideInRight" className="bg-white border border-zinc-100 rounded-[24px] p-8 shadow-luxury space-y-6">
            <h3 className="font-display font-bold text-lg text-primary-dark border-b border-zinc-100 pb-4">Practical Information</h3>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-zinc-400 font-semibold text-xs uppercase tracking-wider block mb-1">Opening Hours</span>
                <span className="font-semibold text-zinc-800">{attraction.openingHours}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold text-xs uppercase tracking-wider block mb-1">Location Coordinates</span>
                <span className="font-semibold text-zinc-800">{attraction.location}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold text-xs uppercase tracking-wider block mb-1">Entrance Access</span>
                <span className="font-semibold text-zinc-800">Tickets required for entry (Lokal & Internasional tiers)</span>
              </div>
            </div>

            {/* Facilities tags */}
            <div className="border-t border-zinc-100 pt-6">
              <span className="text-zinc-400 font-semibold text-xs uppercase tracking-wider block mb-3">On-site Facilities</span>
              <div className="flex flex-wrap gap-2">
                {attraction.facilities.map((fac) => (
                  <span
                    key={fac}
                    className="px-3 py-1 bg-zinc-50 border border-zinc-100 text-zinc-600 rounded-lg text-xs font-medium"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedContainer>

          {/* Safety & Guide Badge */}
          <AnimatedContainer animation="slideInRight" delay={0.1} className="bg-primary/5 border border-primary/10 rounded-[24px] p-6 flex gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl flex-shrink-0 h-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-primary-dark">Clean & Safe Travel</h4>
              <p className="text-zinc-600 text-xs leading-relaxed">
                This attraction strictly complies with Indonesian CHSE hygiene regulations. Certified rangers guard the sites.
              </p>
            </div>
          </AnimatedContainer>
        </div>
      </section>

      {/* 3. AVAILABLE PROGRAMS */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 border-t border-zinc-100">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-dark mb-8">
          Available Programs for {attraction.name}
        </h2>

        {availableTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableTours.map((program) => (
              <AnimatedContainer
                key={program.id}
                animation="fadeInUp"
                className="bg-white rounded-[24px] overflow-hidden shadow-luxury border border-zinc-100/50 hover:shadow-luxury-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
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
                        {destination?.name || 'Indonesia'}
                      </span>
                      <div className="flex items-center gap-1 text-accent font-bold text-xs">
                        {/* <Star className="w-3.5 h-3.5 fill-accent" /> {program.rating} */}
                        <Star className="w-3.5 h-3.5 text-green-500 fill-green-500" />
                        <span className="text-green-500 font-extrabold">
                          {program.rating}
                        </span>
                        <span className="text-zinc-400 font-normal">({program.reviewsCount})</span>
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-base text-primary-dark mb-2 line-clamp-2 hover:text-primary transition-colors">
                      <Link href={`/programs/${program.id}`}>{program.name}</Link>
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Start from</span>
                      <span className="text-lg font-display font-extrabold text-primary-dark tracking-tight">
                        {formatPrice(program.price)} <span className="text-xs font-normal text-zinc-500">/ pax</span>
                      </span>
                    </div>
                    <Link
                      href={`/programs/${program.id}`}
                      className={buttonVariants({
                        variant: "cobalt",
                        className: "h-10 px-4 text-xs flex items-center justify-center gap-1.5"
                      })}
                    >
                      <span>Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-zinc-100">
            <Compass className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-semibold text-zinc-800 text-base">No programs currently scheduled</h3>
            <p className="text-zinc-500 text-xs mt-1">Please explore other attractions for custom program packages.</p>
          </div>
        )}
      </section>

      {/* 4. NEARBY ATTRACTIONS */}
      {nearbyAttractions.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 border-t border-zinc-100">
          <h2 className="font-display font-bold text-xl md:text-2xl text-primary-dark mb-6">
            Other Experiences in {destination?.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {nearbyAttractions.map((nearby) => (
              <Link href={`/experience/${nearby.id}`} key={nearby.id} className="block group">
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <Image
                    src={nearby.image}
                    alt={nearby.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <span className="text-[10px] text-secondary-light uppercase font-bold tracking-wider">{nearby.location}</span>
                    <h4 className="font-display font-bold text-sm md:text-base line-clamp-1">{nearby.name}</h4>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
