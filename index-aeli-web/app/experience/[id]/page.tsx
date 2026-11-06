'use client';

import { buttonVariants } from '@/components/ui/button';
import { getAttractionById, getAttractions, getDestinationById, getPrograms } from '@/lib/api';
import { useCurrency } from '@/lib/CurrencyContext';
import { Attraction, Destination, Program } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Compass,
  MapPin,
  ShieldCheck,
  Star,
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
          getAttractions(attr.destinationId),
        ]);

        setDestination(dest);
        setAvailableTours(progs.filter((p) => p.attractionId === attrId));
        setNearbyAttractions(attrs.filter((a) => a.id !== attrId).slice(0, 3));
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
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attraction) {
    return notFound();
  }

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pb-24">
      {/* 1. HERO BANNER */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] lg:min-h-[60vh] w-full flex items-end overflow-hidden pt-28 pb-12 sm:pb-16">
        {/* Background Landmark Photography */}
        <div className="absolute inset-0 z-0">
          <Image
            src={attraction.image}
            alt={attraction.name}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Calibrated dark atmospheric gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-white">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-white/80 mb-4 sm:mb-6">
            <Link
              href="/"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              <span>Home</span>
            </Link>
            {destination && (
              <>
                <span className="text-white/40">/</span>
                <Link
                  href={`/destinations/${destination.id}`}
                  className="hover:text-white transition-colors"
                >
                  {destination.name}
                </Link>
              </>
            )}
            <span className="text-white/40">/</span>
            <span className="text-white font-medium truncate max-w-[200px] sm:max-w-xs">{attraction.name}</span>
          </nav>

          <h1 className="font-display font-medium text-3xl sm:text-4xl md:text-5xl tracking-tight mb-3 sm:mb-4 text-white">
            {attraction.name}
          </h1>

          {/* Specifications Bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-white/70" />
              <span>{attraction.location}</span>
            </span>
            <span className="size-1 rounded-full bg-white/40" />
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-white/70" />
              <span>{attraction.openingHours}</span>
            </span>
            <span className="size-1 rounded-full bg-white/40" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium text-xs">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{attraction.rating}</span>
              <span className="text-white/70 font-normal">rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OVERVIEW, HISTORY, AND PRACTICAL DETAILS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-10">
            {/* Overview Section */}
            <section aria-labelledby="overview-title" className="space-y-3">
              <h2 id="overview-title" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 tracking-tight">
                About this experience
              </h2>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {attraction.description}
              </p>
            </section>

            {/* Historical Narrative */}
            {attraction.history && (
              <section aria-labelledby="history-title" className="space-y-3 pt-4 border-t border-zinc-200">
                <h2 id="history-title" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 tracking-tight">
                  Historical background & cultural significance
                </h2>
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
                  <p className="text-zinc-700 text-sm sm:text-base leading-relaxed">
                    {attraction.history}
                  </p>
                </div>
              </section>
            )}

            {/* Visual Highlights Gallery */}
            {attraction.gallery && attraction.gallery.length > 0 && (
              <section aria-labelledby="gallery-title" className="space-y-4 pt-4 border-t border-zinc-200">
                <h2 id="gallery-title" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 tracking-tight">
                  Visual highlights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attraction.gallery.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-[16/10] overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200/80 shadow-xs"
                    >
                      <Image
                        src={img}
                        alt={`${attraction.name} detail ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar: Practical Information (4 Cols) */}
          <aside aria-label="Practical Information" className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            {/* Metadata Card */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="font-display font-medium text-base text-zinc-900">
                  Visitor information
                </h3>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <span className="text-zinc-500 text-xs block font-medium mb-0.5">Opening hours</span>
                  <span className="font-medium text-zinc-800">{attraction.openingHours}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs block font-medium mb-0.5">Location</span>
                  <span className="font-medium text-zinc-800">{attraction.location}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs block font-medium mb-0.5">Admission</span>
                  <span className="font-medium text-zinc-800">Entry ticket or active tour voucher required</span>
                </div>
              </div>

              {/* On-site Facilities */}
              {attraction.facilities && attraction.facilities.length > 0 && (
                <div className="border-t border-zinc-100 pt-4">
                  <span className="text-zinc-500 text-xs block font-medium mb-2.5">On-site facilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {attraction.facilities.map((fac) => (
                      <span
                        key={fac}
                        className="px-2.5 py-1 bg-zinc-50 border border-zinc-200/60 text-zinc-600 rounded-md text-xs font-normal"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Operator Reassurance Card */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-start gap-3">
              <ShieldCheck className="size-4 text-zinc-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-medium text-xs text-zinc-800">Verified Experience</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Maintained in partnership with local tourism authorities and licensed regional guides.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* 3. AVAILABLE EXPEDITION PROGRAMS */}
        <section aria-labelledby="programs-title" className="mt-16 pt-12 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-6">
            <h2 id="programs-title" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 tracking-tight">
              Programs featuring {attraction.name}
            </h2>
            <span className="text-xs text-zinc-500">
              {availableTours.length} {availableTours.length === 1 ? 'program' : 'programs'} available
            </span>
          </div>

          {availableTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTours.map((program) => (
                <div
                  key={program.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-xs border border-zinc-200/80 hover:border-zinc-300 transition-colors flex flex-col h-full"
                >
                  {/* Program Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                    <Image
                      src={program.image}
                      alt={program.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium rounded-full">
                      {program.category}
                    </span>

                    <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-medium">
                      <Clock className="size-3.5" /> {program.duration}
                    </span>
                  </div>

                  {/* Program Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="truncate">{destination?.name || 'Indonesia'}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-medium">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span className="tabular-nums text-zinc-800">{program.rating}</span>
                          <span className="text-zinc-400 font-normal">({program.reviewsCount})</span>
                        </div>
                      </div>

                      <h3 className="font-display font-medium text-sm sm:text-base text-zinc-900 line-clamp-2 hover:text-primary transition-colors">
                        <Link href={`/programs/${program.id}`}>{program.name}</Link>
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                      <div>
                        <span className="text-[11px] text-zinc-400 block font-normal">From</span>
                        <span className="text-sm sm:text-base font-semibold text-zinc-900 tabular-nums">
                          {formatPrice(program.price)}{' '}
                          <span className="text-xs font-normal text-zinc-500">/ pax</span>
                        </span>
                      </div>
                      <Link
                        href={`/programs/${program.id}`}
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
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200/80 p-8 max-w-md mx-auto">
              <Compass className="size-8 text-zinc-400 mx-auto mb-2" />
              <h3 className="font-medium text-zinc-900 text-sm">No programs scheduled yet</h3>
              <p className="text-zinc-500 text-xs mt-1">
                Explore our full catalog for custom packages and regional itineraries.
              </p>
            </div>
          )}
        </section>

        {/* 4. OTHER EXPERIENCES IN THIS REGION */}
        {nearbyAttractions.length > 0 && (
          <section aria-labelledby="nearby-title" className="mt-16 pt-12 border-t border-zinc-200">
            <h2 id="nearby-title" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 mb-6">
              Other experiences in {destination?.name || 'this destination'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyAttractions.map((nearby) => (
                <Link href={`/experience/${nearby.id}`} key={nearby.id} className="block group">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xs border border-zinc-200/80 hover:border-zinc-300 transition-colors bg-zinc-100">
                    <Image
                      src={nearby.image}
                      alt={nearby.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <span className="text-xs text-white/70 block mb-0.5">{nearby.location}</span>
                      <h4 className="font-display font-medium text-sm sm:text-base text-white line-clamp-1">
                        {nearby.name}
                      </h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
