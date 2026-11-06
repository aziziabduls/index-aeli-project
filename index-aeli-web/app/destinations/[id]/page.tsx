'use client';

import { buttonVariants } from '@/components/ui/button';
import { getAttractions, getDestinationById } from '@/lib/api';
import { Attraction, Destination } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CloudSun,
  Compass,
  Info,
  MapPin,
  ShieldCheck,
  Star
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PageProps {
  params?: Promise<{ id: string }> | { id: string };
}

export default function DestinationDetail({ params }: PageProps) {
  const routeParams = useParams();
  const destId =
    (routeParams?.id as string) ||
    (params && typeof params === 'object' && 'id' in params ? (params as any).id : '');

  const [destination, setDestination] = useState<Destination | null>(null);
  const [destAttractions, setDestAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!destId) {
      setIsLoading(false);
      return;
    }

    async function loadData() {
      try {
        const [dest, attrs] = await Promise.all([
          getDestinationById(destId),
          getAttractions(destId),
        ]);
        setDestination(dest);
        setDestAttractions(attrs || []);
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
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="size-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
          <Compass className="size-6" />
        </div>
        <h1 className="font-display font-medium text-xl sm:text-2xl text-zinc-900 mb-2">
          Destination not found
        </h1>
        <p className="text-zinc-500 text-sm max-w-sm mb-6">
          The regional destination you requested is currently unavailable or has been archived.
        </p>
        <Link
          href="/destinations"
          className={buttonVariants({
            variant: 'cobalt',
            className: 'rounded-xl px-5 h-10 text-xs sm:text-sm font-medium flex items-center gap-2',
          })}
        >
          <ArrowLeft className="size-3.5" />
          <span>Browse all destinations</span>
        </Link>
      </div>
    );
  }

  const galleryList = (Array.isArray(destination.gallery) ? destination.gallery : []).filter(Boolean);
  const heroImage =
    destination.image ||
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pb-24">
      {/* 1. HERO BANNER */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] lg:min-h-[60vh] w-full flex items-end overflow-hidden pt-28 pb-12 sm:pb-16">
        {/* Background Regional Visual */}
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={destination.name || 'Regional Destination'}
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
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft className="size-3.5" />
              <span>Home</span>
            </Link>
            <span className="text-white/40">/</span>
            <Link href="/destinations" className="hover:text-white transition-colors">
              Destinations
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-white font-medium truncate max-w-[200px] sm:max-w-xs">{destination.name}</span>
          </nav>

          <h1 className="font-display font-medium text-3xl sm:text-5xl md:text-6xl tracking-tight mb-3 sm:mb-4 text-white">
            {destination.name}
          </h1>

          <p className="text-white/85 text-sm sm:text-base max-w-2xl leading-relaxed font-normal">
            {destination.description}
          </p>
        </div>
      </section>

      {/* 2. OVERVIEW, CLIMATE, AND QUICK FACTS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-10">
            {/* Regional Overview */}
            <section aria-labelledby="overview-heading" className="space-y-3">
              <h2 id="overview-heading" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 tracking-tight">
                Regional overview
              </h2>
              <div className="text-zinc-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  {destination.name} stands as one of the most remarkable travel hotspots in the Indonesian archipelago, offering travelers an authentic blend of geography, biodiversity, and ancestral heritage.
                </p>
                <p>
                  From scenic coastal marine parks to lush volcanic highlands, expeditions throughout {destination.name} are curated with licensed local guides and community hosts for responsible, memorable discovery.
                </p>
              </div>
            </section>

            {/* Climate & Travel Seasons */}
            <section aria-labelledby="climate-heading" className="space-y-4 pt-4 border-t border-zinc-200">
              <h2 id="climate-heading" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 tracking-tight">
                Climate & travel seasons
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Weather card */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <CloudSun className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-zinc-500 text-xs font-medium block">Current climate</span>
                    <div className="font-display font-semibold text-xl text-zinc-900 tabular-nums">
                      {destination.weather?.temperature || '28°C'}
                    </div>
                    <p className="text-zinc-500 text-xs">{destination.weather?.condition || 'Tropical marine climate'}</p>
                  </div>
                </div>

                {/* Best Season Card */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <Calendar className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-zinc-500 text-xs font-medium block">Optimal season</span>
                    <div className="font-display font-semibold text-base sm:text-lg text-zinc-900">
                      {destination.bestTimeToVisit || 'April to October'}
                    </div>
                    <p className="text-zinc-500 text-xs">Recommended dry season window</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Geographical Orientation */}
            <section aria-labelledby="geography-heading" className="space-y-3 pt-4 border-t border-zinc-200">
              <h2 id="geography-heading" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 tracking-tight">
                Geographical orientation
              </h2>
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex items-start gap-4">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-zinc-900">{destination.name}, Indonesia</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    Regional transport coordinates, harbor docks, and flight routes are coordinated directly through certified regional partner agencies upon tour booking.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar: Quick Facts (4 Cols) */}
          <aside aria-label="Regional Facts" className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="border-b border-zinc-100 pb-3 flex items-center gap-2">
                <Info className="size-4 text-zinc-400" />
                <h3 className="font-display font-medium text-base text-zinc-900">
                  Regional quick facts
                </h3>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between items-baseline border-b border-zinc-100 pb-3">
                  <span className="text-zinc-500 font-medium text-xs">Regional capital</span>
                  <span className="font-medium text-zinc-900 text-right">{destination.quickFacts?.capital || '—'}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-zinc-100 pb-3">
                  <span className="text-zinc-500 font-medium text-xs">Population</span>
                  <span className="font-medium text-zinc-900 tabular-nums text-right">
                    {destination.quickFacts?.population || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline border-b border-zinc-100 pb-3">
                  <span className="text-zinc-500 font-medium text-xs">Languages</span>
                  <span className="font-medium text-zinc-900 text-right">
                    {destination.quickFacts?.language || 'Indonesian, Regional'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-zinc-500 font-medium text-xs">Timezone</span>
                  <span className="font-medium text-zinc-900 text-right">
                    {destination.quickFacts?.timezone || 'WIB (GMT+7)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Operator Reassurance Card */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-start gap-3">
              <ShieldCheck className="size-4 text-zinc-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-medium text-xs text-zinc-800">Verified Regional Network</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  All expedition routes in {destination.name} are operated by licensed AELI members with comprehensive field insurance.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* 3. PHOTO GALLERY */}
        {galleryList.length > 0 && (
          <section aria-labelledby="gallery-heading" className="mt-16 pt-12 border-t border-zinc-200">
            <h2 id="gallery-heading" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 mb-6 flex items-center gap-2">
              <span>Regional scenery</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {galleryList.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[16/10] overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200/80 shadow-xs"
                >
                  <Image
                    src={img}
                    alt={`${destination.name} landscape ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. FEATURED ATTRACTIONS & EXPERIENCES */}
        <section aria-labelledby="attractions-heading" className="mt-16 pt-12 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-6">
            <h2 id="attractions-heading" className="font-display font-medium text-xl sm:text-2xl text-zinc-900 tracking-tight">
              Featured experiences in {destination.name}
            </h2>
            <span className="text-xs text-zinc-500">
              {destAttractions.length} {destAttractions.length === 1 ? 'experience' : 'experiences'} cataloged
            </span>
          </div>

          {destAttractions && destAttractions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destAttractions.map((attr) => (
                <div
                  key={attr.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-xs border border-zinc-200/80 hover:border-zinc-300 transition-colors flex flex-col h-full"
                >
                  {/* Attraction Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                    <Image
                      src={attr.image}
                      alt={attr.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    <span className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs font-medium">
                      <MapPin className="size-3.5" /> {attr.location}
                    </span>
                  </div>

                  {/* Attraction Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="truncate">{destination.name}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-medium">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span className="tabular-nums text-zinc-800">{attr.rating}</span>
                        </div>
                      </div>

                      <h3 className="font-display font-medium text-sm sm:text-base text-zinc-900 line-clamp-1 hover:text-primary transition-colors">
                        <Link href={`/experience/${attr.id}`}>{attr.name}</Link>
                      </h3>
                      <p className="text-zinc-600 text-xs leading-relaxed line-clamp-2">
                        {attr.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex justify-end">
                      <Link
                        href={`/experience/${attr.id}`}
                        className={buttonVariants({
                          variant: 'outline',
                          className: 'h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1',
                        })}
                      >
                        <span>View details</span>
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
              <h3 className="font-medium text-zinc-900 text-sm">No experiences cataloged yet</h3>
              <p className="text-zinc-500 text-xs mt-1">
                Our expedition team is actively mapping landmarks and cultural routes for {destination.name}.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
