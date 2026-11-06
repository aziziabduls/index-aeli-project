'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { buttonVariants } from '@/components/ui/button';
import { getAttractionById, getDestinationById, getProgramById, getPrograms } from '@/lib/api';
import { useCurrency } from '@/lib/CurrencyContext';
import { Attraction, Destination, Program } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Compass,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatQuota(min?: number | null, max?: number | null): string {
  if (min && max) {
    if (min === max) return `${max} guests`;
    return `${min} – ${max} guests`;
  }
  if (max) return `Up to ${max} guests`;
  if (min) return `Min ${min} guests`;
  return 'Flexible group size';
}

function formatDateAvailability(availability?: string, availableDates?: string[]): string {
  const normalized = (availability || 'all_days').toLowerCase();
  if (normalized === 'weekends' || normalized === 'only weekend' || normalized === 'weekend') {
    return 'Weekends only';
  }
  if (normalized === 'weekdays' || normalized === 'only weekday' || normalized === 'weekday') {
    return 'Weekdays only';
  }
  if (normalized === 'specific_dates' || normalized === 'custom' || normalized === 'specific') {
    const count = availableDates?.length || 0;
    return count > 0 ? `${count} scheduled dates` : 'Specific dates only';
  }
  return 'Available daily';
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
          getPrograms(),
        ]);

        setDestination(dest);
        setAttraction(attr);
        setRelatedTours(
          allProgs.filter((t) => t.destinationId === prog.destinationId && t.id !== prog.id).slice(0, 3)
        );
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
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!program) {
    return notFound();
  }

  const tourImages = Array.from(new Set([program.image, ...(program.gallery || [])])).filter(Boolean);

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <ArrowRight className="size-3 text-zinc-300" />
          <Link href="/programs" className="hover:text-zinc-900 transition-colors">
            Programs
          </Link>
          {destination && (
            <>
              <ArrowRight className="size-3 text-zinc-300" />
              <Link href={`/destinations/${destination.id}`} className="hover:text-zinc-900 transition-colors">
                {destination.name}
              </Link>
            </>
          )}
          {attraction && (
            <>
              <ArrowRight className="size-3 text-zinc-300" />
              <Link href={`/experience/${attraction.id}`} className="hover:text-zinc-900 transition-colors">
                {attraction.name}
              </Link>
            </>
          )}
          <ArrowRight className="size-3 text-zinc-300" />
          <span className="text-zinc-900 font-medium truncate max-w-[200px] sm:max-w-xs">{program.name}</span>
        </nav>

        {/* 1. TOUR GALLERY */}
        <section aria-label="Program Gallery" className="space-y-3 mb-10">
          {/* Main Large Visual */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/10] w-full rounded-2xl overflow-hidden bg-zinc-200 border border-zinc-200/80 shadow-xs">
            <Image
              src={tourImages[activeImageIdx] || program.image}
              alt={program.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Category Badge overlay */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-medium text-xs">
                {program.category}
              </span>
            </div>
          </div>

          {/* Thumbnails Row */}
          {tourImages.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
              {tourImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative aspect-[16/10] rounded-xl overflow-hidden border transition-all cursor-pointer bg-zinc-100 ${
                    activeImageIdx === idx
                      ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                      : 'border-zinc-200/80 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${program.name} preview thumbnail ${idx + 1}`}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 2. PROGRAM DETAILS & RESERVATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Dossier Column (Left) */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-10">
            {/* Header Block & Key Specifications */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="size-3.5 text-zinc-400" />
                  <span>{program.duration}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="size-3.5 text-zinc-400" />
                  <span>
                    {formatQuota(program.minQuota ?? program.maxGuestMin, program.maxQuota ?? program.maxGuestMax)}
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="size-3.5 text-zinc-400" />
                  <span>{formatDateAvailability(program.dateAvailability, program.availableDates)}</span>
                </span>
              </div>

              <h1 className="font-display font-medium text-2xl sm:text-3xl md:text-4xl text-zinc-900 tracking-tight leading-snug">
                {program.name}
              </h1>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1 text-xs">
                  <Star className="size-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-zinc-900 tabular-nums">{program.rating}</span>
                  <span className="text-zinc-500">({program.reviewsCount} verified traveler reviews)</span>
                </div>
              </div>
            </div>

            {/* Program Overview */}
            <section aria-labelledby="overview-heading" className="space-y-3 pt-4 border-t border-zinc-200">
              <h2 id="overview-heading" className="font-display font-medium text-lg sm:text-xl text-zinc-900">
                Program overview
              </h2>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {program.description}
              </p>
            </section>

            {/* Key Highlights */}
            {program.highlights && program.highlights.length > 0 && (
              <section
                aria-labelledby="highlights-heading"
                className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4"
              >
                <h3
                  id="highlights-heading"
                  className="font-display font-medium text-base text-zinc-900 flex items-center gap-2"
                >
                  <Compass className="size-4 text-primary" />
                  <span>Expedition highlights</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {program.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="size-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3" />
                      </div>
                      <span className="text-zinc-700 text-xs sm:text-sm leading-relaxed">{h}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Inclusions & Exclusions */}
            <section aria-label="Inclusions and Exclusions" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* What's Included */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-display font-medium text-sm text-zinc-900 pb-2 border-b border-zinc-100 flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-600" />
                  <span>What's included</span>
                </h3>
                <ul className="space-y-2.5">
                  {(program.included ?? []).map((inc, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-600">
                      <span className="size-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <span className="leading-relaxed">{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What's Excluded */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-display font-medium text-sm text-zinc-900 pb-2 border-b border-zinc-100 flex items-center gap-1.5">
                  <X className="size-4 text-zinc-400" />
                  <span>What's not included</span>
                </h3>
                <ul className="space-y-2.5">
                  {(program.excluded ?? []).map((exc, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-500">
                      <span className="size-1.5 rounded-full bg-zinc-300 mt-2 shrink-0" />
                      <span className="leading-relaxed">{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Itinerary Timeline */}
            {program.itinerary && program.itinerary.length > 0 && (
              <section aria-labelledby="itinerary-heading" className="space-y-4 pt-4 border-t border-zinc-200">
                <h2 id="itinerary-heading" className="font-display font-medium text-lg sm:text-xl text-zinc-900">
                  Detailed itinerary
                </h2>

                <div className="relative pl-5 sm:pl-6 border-l border-zinc-200 space-y-4 ml-2 sm:ml-3">
                  <Accordion multiple value={activeDays} onValueChange={setActiveDays} className="w-full space-y-3">
                    {program.itinerary.map((day, idx) => {
                      const isOpen = activeDays.includes(`day-${idx}`);
                      return (
                        <AccordionItem key={idx} value={`day-${idx}`} className="relative border-b-0">
                          {/* Timeline dot */}
                          <div
                            className={`absolute -left-[25px] sm:-left-[29px] top-5 size-3 rounded-full border-2 bg-white transition-colors ${
                              isOpen ? 'border-primary bg-primary' : 'border-zinc-300'
                            }`}
                          />

                          {/* Accordion Card */}
                          <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-xs">
                            <AccordionTrigger className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-display font-medium text-sm sm:text-base text-zinc-900 hover:bg-zinc-50/70 hover:no-underline transition-colors cursor-pointer">
                              <span>{day.title}</span>
                            </AccordionTrigger>

                            <AccordionContent className="overflow-hidden">
                              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-zinc-100 space-y-3">
                                {(day.activities ?? []).map((act, actIdx) => (
                                  <div key={actIdx} className="flex gap-2.5 text-xs sm:text-sm text-zinc-600 items-start">
                                    <span className="size-1.5 rounded-full bg-zinc-400 mt-2 shrink-0" />
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
              </section>
            )}

            {/* Meeting Point Logistics */}
            {program.meetingPoint && (
              <section aria-labelledby="meeting-heading" className="space-y-3 pt-4 border-t border-zinc-200">
                <h2 id="meeting-heading" className="font-display font-medium text-lg sm:text-xl text-zinc-900">
                  Meeting point & assembly
                </h2>
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div className="space-y-1 flex-1 text-left">
                    <h3 className="font-medium text-sm text-zinc-900">{program.meetingPoint}</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                      Detailed coordination and guide contact information will be dispatched on your confirmation voucher.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Sticky Booking Column */}
          <aside aria-label="Booking Summary" className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
            {/* Main Reservation Card */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs block font-medium">Price per person</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-semibold text-2xl sm:text-3xl text-zinc-900 tabular-nums">
                    {formatPrice(program.price)}
                  </span>
                  <span className="text-zinc-500 text-xs">/ all-inclusive</span>
                </div>
              </div>

              {/* Specification List */}
              <div className="border-t border-zinc-100 pt-4 space-y-3 text-xs text-zinc-600">
                <div className="flex items-center justify-between">
                  <span>Cancellation policy</span>
                  <span className="text-zinc-800 font-medium">Free up to 48h prior</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Voucher type</span>
                  <span className="text-zinc-800 font-medium">Instant digital voucher</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Group size</span>
                  <span className="text-zinc-800 font-medium tabular-nums">
                    {formatQuota(program.minQuota ?? program.maxGuestMin, program.maxQuota ?? program.maxGuestMax)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Schedule</span>
                  <span className="text-zinc-800 font-medium">
                    {formatDateAvailability(program.dateAvailability, program.availableDates)}
                  </span>
                </div>
              </div>

              {/* Book Button */}
              <Link
                href={`/booking?programId=${program.id}`}
                className={buttonVariants({
                  variant: 'cobalt',
                  className: 'w-full h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-xs cursor-pointer',
                })}
              >
                <span>Book this experience</span>
                <ArrowRight className="size-4" />
              </Link>

              <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
                Direct booking backed by verified Indonesian tour operators.
              </p>
            </div>

            {/* Weather / Operational Guarantee Badge */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-start gap-3">
              <ShieldCheck className="size-4 text-zinc-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-medium text-xs text-zinc-800">Expedition Guarantee</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  In the event of severe weather or maritime warnings, full reschedule or refund is guaranteed.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* 3. RELATED EXPEDITIONS */}
        {relatedTours.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-16 pt-12 border-t border-zinc-200">
            <h2 id="related-heading" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 mb-6">
              Similar programs in {destination?.name || 'this region'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedTours.map((relTour) => (
                <div
                  key={relTour.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-xs border border-zinc-200/80 hover:border-zinc-300 transition-colors flex flex-col h-full"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                    <Image
                      src={relTour.image}
                      alt={relTour.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium rounded-full">
                      {relTour.category}
                    </span>

                    <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-medium">
                      <Clock className="size-3.5" /> {relTour.duration}
                    </span>
                  </div>

                  {/* Program Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="truncate">{destination?.name || 'Indonesia'}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-medium">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span className="tabular-nums text-zinc-800">{relTour.rating}</span>
                        </div>
                      </div>

                      <h3 className="font-display font-medium text-sm sm:text-base text-zinc-900 line-clamp-2 hover:text-primary transition-colors">
                        <Link href={`/programs/${relTour.id}`}>{relTour.name}</Link>
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                      <div>
                        <span className="text-[11px] text-zinc-400 block font-normal">From</span>
                        <span className="text-sm sm:text-base font-semibold text-zinc-900 tabular-nums">
                          {formatPrice(relTour.price)}{' '}
                          <span className="text-xs font-normal text-zinc-500">/ pax</span>
                        </span>
                      </div>
                      <Link
                        href={`/programs/${relTour.id}`}
                        className={buttonVariants({
                          variant: 'outline',
                          className: 'h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1',
                        })}
                      >
                        <span>View</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 4. MOBILE STICKY BOTTOM DOCK */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-3.5 sm:p-4 bg-white/95 backdrop-blur-md border-t border-zinc-200 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[11px] text-zinc-500 block font-medium">Price per person</span>
          <span className="font-display font-semibold text-base sm:text-lg text-zinc-900 tabular-nums">
            {formatPrice(program.price)}
          </span>
        </div>
        <Link
          href={`/booking?programId=${program.id}`}
          className={buttonVariants({
            variant: 'cobalt',
            className: 'h-10 px-5 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-1.5 shadow-xs',
          })}
        >
          <span>Book experience</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
