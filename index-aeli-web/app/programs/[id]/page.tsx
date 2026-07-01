'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Compass, MapPin, Calendar, Star, Clock, Info, Check, X,
  ArrowLeft, ArrowRight, ShieldCheck, Map, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import { getProgramById, getDestinationById, getAttractionById, getPrograms } from '@/lib/api';
import { Destination, Attraction, Program } from '@/types';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useCurrency } from '@/lib/CurrencyContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TourDetail({ params }: PageProps) {
  const { formatPrice, currency } = useCurrency();
  const resolvedParams = use(params);
  const programId = resolvedParams.id;

  const [program, setProgram] = useState<Program | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [relatedTours, setRelatedTours] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Itinerary timeline expand/collapse state
  const [activeDays, setActiveDays] = useState<string[]>(['day-0']);

  // Image Slider State
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const prog = await getProgramById(programId);
        if (!prog) {
          setIsLoading(false);
          return;
        }
        setProgram(prog);

        const [dest, attr, allProgs] = await Promise.all([
          getDestinationById(prog.destinationId),
          getAttractionById(prog.attractionId),
          getPrograms()
        ]);

        setDestination(dest);
        setAttraction(attr);
        setRelatedTours(allProgs.filter(t => t.destinationId === prog.destinationId && t.id !== prog.id).slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch program data', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [programId]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-luxury-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!program) {
    return notFound();
  }

  const tourImages = Array.from(new Set([program.image, ...(program.gallery || [])])).filter(Boolean);

  return (
    <div className="w-full relative bg-luxury-bg min-h-screen pb-24">
      {/* Spacer for sticky header */}
      <div className="h-24 bg-primary-dark" />

      {/* 1. TOUR GALLERY / BANNER */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pt-8">
        {/* Breadcrumb */}
        <div className="flex flex-wrap gap-2 text-xs text-zinc-500 mb-6 items-center">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ArrowRight className="w-3 h-3 text-zinc-300" />
          {destination && (
            <>
              <Link href={`/destinations/${destination.id}`} className="hover:text-primary transition-colors">{destination.name}</Link>
              <ArrowRight className="w-3 h-3 text-zinc-300" />
            </>
          )}
          {attraction && (
            <>
              <Link href={`/experience/${attraction.id}`} className="hover:text-primary transition-colors">{attraction.name}</Link>
              <ArrowRight className="w-3 h-3 text-zinc-300" />
            </>
          )}
          <span className="text-zinc-800 font-semibold line-clamp-1">{program.name}</span>
        </div>

        {/* Gallery Grid */}
        <div className={tourImages.length > 1 ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "w-full"}>
          {/* Main Large Image */}
          <div className={`${tourImages.length > 1 ? "lg:col-span-2" : "w-full"
            } relative aspect-[16/10] md:aspect-[21/9] rounded-[24px] overflow-hidden shadow-luxury border border-zinc-200/50`}>
            <Image
              src={tourImages[activeImageIdx]}
              alt={program.name}
              fill
              priority
              className="object-cover"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Side Thumbnails */}
          {tourImages.length > 1 && (
            <div className="lg:col-span-1 flex lg:flex-col gap-4 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0 h-fit lg:h-[450px]">
              {tourImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative aspect-[16/10] w-[120px] lg:w-full rounded-xl overflow-hidden flex-shrink-0 border-2 cursor-pointer transition-all ${activeImageIdx === idx ? 'border-primary shadow-md scale-98' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                >
                  <Image
                    src={img}
                    alt={`${program.name} thumbnail ${idx + 1}`}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. TOUR TITLE & INFO GRID */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left Col: Main Details & Itinerary */}
        <div className="lg:col-span-2 space-y-10">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider rounded-lg">
                {program.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-500 font-semibold">
                <Clock className="w-4 h-4 text-primary" /> {program.duration}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
                <Users className="w-4 h-4 text-primary" /> Max 8 Guests
              </span>
            </div>

            <h1 className="font-display font-extrabold text-2xl md:text-4xl text-primary-dark leading-tight">
              {program.name}
            </h1>

            <div className="flex items-center gap-2">
              <div className="flex items-center text-green-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4.5 h-4.5 ${i < Math.floor(program.rating) ? 'fill-green-500' : 'text-zinc-300'
                      }`}
                  />
                ))}
              </div>
              <span className="text-zinc-900 font-extrabold text-sm">{program.rating}</span>
              <span className="text-zinc-400 text-xs font-semibold">({program.reviewsCount} reviews)</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="font-display font-bold text-xl md:text-2xl text-primary-dark">Program Overview</h2>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
              {program.description}
            </p>
          </div>

          {/* Highlights */}
          <div className="bg-white border border-zinc-100 rounded-[24px] p-6 md:p-8 shadow-luxury space-y-5">
            <h3 className="font-display font-bold text-lg text-primary-dark flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary animate-spin-slow" /> Program Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(program.highlights ?? []).map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-secondary/10 text-primary flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-zinc-700 text-sm leading-relaxed">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inclusions / Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Included */}
            <div className="bg-white border border-zinc-100 rounded-[24px] p-6 shadow-luxury space-y-4">
              <h4 className="font-display font-bold text-base text-primary-dark pb-2 border-b border-zinc-100">
                What's Included
              </h4>
              <ul className="space-y-3.5">
                {(program.included ?? []).map((inc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-zinc-600">
                    <Check className="w-4.5 h-4.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Excluded */}
            <div className="bg-white border border-zinc-100 rounded-[24px] p-6 shadow-luxury space-y-4">
              <h4 className="font-display font-bold text-base text-primary-dark pb-2 border-b border-zinc-100">
                What's Excluded
              </h4>
              <ul className="space-y-3.5">
                {(program.excluded ?? []).map((exc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-zinc-600">
                    <X className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Itinerary Timeline */}
          <div className="space-y-6">
            <h2 className="font-display font-bold text-xl md:text-2xl text-primary-dark">Detailed Itinerary</h2>

            <div className="relative pl-6 border-l-2 border-primary/20 space-y-4 ml-3">
              <Accordion multiple value={activeDays} onValueChange={setActiveDays} className="w-full space-y-6">
                {(program.itinerary ?? []).map((day, idx) => {
                  const isOpen = activeDays.includes(`day-${idx}`);
                  return (
                    <AccordionItem key={idx} value={`day-${idx}`} className="relative border-b-0">
                      {/* Circle Dot Marker */}
                      <div className={`absolute -left-[33px] top-6 w-4 h-4 rounded-full border-2 bg-white transition-colors duration-300 z-10 ${isOpen ? 'border-primary bg-primary' : 'border-zinc-300'
                        }`} />

                      {/* Timeline Collapsible Card */}
                      <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
                        <AccordionTrigger className="w-full flex items-center justify-between p-5 text-left font-display font-bold text-sm md:text-base text-primary-dark hover:bg-zinc-50 hover:no-underline transition-colors cursor-pointer *:data-[slot=accordion-trigger-icon]:text-zinc-500">
                          <span>{day.title}</span>
                        </AccordionTrigger>

                        <AccordionContent className="overflow-hidden">
                          <div className="px-5 pb-5 pt-1 border-t border-zinc-50 space-y-4">
                            {(day.activities ?? []).map((act, actIdx) => (
                              <div key={actIdx} className="flex gap-3 text-xs md:text-sm text-zinc-600 items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-light mt-2 flex-shrink-0" />
                                <p className="leading-relaxed">{act}</p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </div>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </div>

          {/* Meeting Point Map */}
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl md:text-2xl text-primary-dark">Meeting Point</h2>
            <div className="bg-white border border-zinc-100 rounded-[24px] p-6 shadow-luxury flex flex-col md:flex-row gap-6 items-center">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
                <MapPin className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center md:text-left flex-1">
                <h4 className="font-semibold text-sm text-zinc-900">{program.meetingPoint}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Detailed coordinates and pickup times will be sent immediately inside your secure confirmation email after booking is completed.
                </p>
              </div>
              <button className="h-10 px-5 border border-primary/20 text-primary font-semibold rounded-xl text-xs hover:bg-primary/5 transition-all">
                Get Directions
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Desktop Sticky Booking Card */}
        <div className="lg:col-span-1 lg:sticky lg:top-28 space-y-6">
          <div className="bg-white border border-zinc-100 rounded-[28px] p-8 shadow-luxury space-y-6 hidden lg:block">
            <div className="space-y-1">
              <span className="text-zinc-400 font-semibold text-xs uppercase tracking-wider block">Price per guest</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`font-display font-black text-primary-dark ${currency === 'IDR' ? 'text-2xl' : 'text-4xl'}`}>{formatPrice(program.price)}</span>
                <span className="text-zinc-500 text-xs">/ all-inclusive</span>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-6 space-y-4 text-xs text-zinc-600">
              <div className="flex items-center justify-between">
                <span>Free Cancellation</span>
                <span className="text-teal-600 font-bold">Up to 24h prior</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Mobile Voucher</span>
                <span className="text-teal-600 font-bold">Accepted</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Instant Booking</span>
                <span className="text-teal-600 font-bold">Confirmed</span>
              </div>
            </div>

            <Link
              href={`/booking?programId=${program.id}`}
              className={buttonVariants({
                variant: "cobalt",
                className: "w-full h-14 flex items-center justify-center gap-2"
              })}
            >
              <span>Book This Experience</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
              Security encrypted transaction. No booking fees applied.
            </p>
          </div>

          {/* Secure Trust Badge */}
          <div className="bg-white border border-zinc-100 rounded-[24px] p-6 shadow-luxury flex gap-4 hidden lg:flex">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl flex-shrink-0 h-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-primary-dark">INDEX-AELI Guarantee</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">
                If the program gets cancelled due to bad tropical weather, we provide 100% instant cash refund or re-scheduling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RELATED TOURS */}
      {relatedTours.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 border-t border-zinc-100">
          <h2 className="font-display font-bold text-2xl text-primary-dark mb-8">
            Recommended Related Programs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedTours.map((relTour) => (
              <AnimatedContainer
                key={relTour.id}
                animation="fadeInUp"
                className="bg-white rounded-[24px] overflow-hidden shadow-luxury border border-zinc-100/50 hover:shadow-luxury-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
              >
                {/* Program Image */}
                <div className="relative aspect-[16/11] overflow-hidden">
                  <Image
                    src={relTour.image}
                    alt={relTour.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Category Tag */}
                  <span className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-md text-primary-dark text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-sm">
                    {relTour.category}
                  </span>

                  {/* Duration */}
                  <span className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" /> {relTour.duration}
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
                        <Star className="w-3.5 h-3.5 text-green-500 fill-green-500" />
                        <span className="text-green-500 font-extrabold">
                          {relTour.rating}
                        </span>
                        <span className="text-zinc-400 font-normal">({relTour.reviewsCount})</span>
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-base text-primary-dark mb-2 line-clamp-2 hover:text-primary transition-colors">
                      <Link href={`/programs/${relTour.id}`}>{relTour.name}</Link>
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Start from</span>
                      <span className="text-lg font-display font-extrabold text-primary-dark">
                        {formatPrice(relTour.price)} <span className="text-xs font-normal text-zinc-500">/ person</span>
                      </span>
                    </div>
                    <Link
                      href={`/programs/${relTour.id}`}
                      className={buttonVariants({
                        variant: "cobalt",
                        className: "h-10 px-4 text-xs flex items-center justify-center gap-1.5"
                      })}
                    >
                      <span>Book Program</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </section>
      )}

      {/* 4. MOBILE STICKY FLOATING BOOKING BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-4 bg-white/70 backdrop-blur-lg border-t border-zinc-100/50 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-medium">Price</span>
          <span className={`font-display font-extrabold text-primary-dark ${currency === 'IDR' ? 'text-base' : 'text-xl'}`}>
            {formatPrice(program.price)} <span className="text-[10px] text-zinc-500 font-normal">/ guest</span>
          </span>
        </div>
        <Link
          href={`/booking?programId=${program.id}`}
          className={buttonVariants({
            variant: "cobalt",
            className: "h-12 px-6 text-sm flex items-center justify-center gap-1.5"
          })}
        >
          <span>Book Experience</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
