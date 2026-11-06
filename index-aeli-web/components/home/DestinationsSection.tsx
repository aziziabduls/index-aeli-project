'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Compass } from 'lucide-react';
import { Destination } from '@/types';

interface DestinationsSectionProps {
  destinations: Destination[];
}

export default function DestinationsSection({ destinations }: DestinationsSectionProps) {
  const displayedDestinations = destinations.slice(0, 6);

  return (
    <section id="destinations" className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="max-w-xl text-left space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/15 text-primary text-xs font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Regional archipelagos</span>
          </div>
          <h2 className="font-display font-medium text-3xl sm:text-4xl text-zinc-900 tracking-tight">
            Explore Popular Destinations
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            Experience the rich diversity of Indonesia across our top featured regional hotspots.
          </p>
        </motion.div>

        <div className="flex justify-start md:justify-end shrink-0">
          <Link
            href="/destinations"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary-dark transition-colors group"
          >
            <span>View all destinations</span>
            <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Destinations Grid */}
      {displayedDestinations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayedDestinations.map((dest, index) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
            >
              <Link
                href={`/destinations/${dest.id}`}
                className="group flex flex-col h-full bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-zinc-300 hover:shadow-sm transition-[border-color,box-shadow] duration-200"
              >
                {/* Thumbnail Visual (16:10 ratio) */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                  <Image
                    src={dest.image}
                    alt={dest.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                  {/* Pill Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-medium text-xs">
                      {dest.attractionCount} {dest.attractionCount === 1 ? 'experience' : 'experiences'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div className="space-y-2">
                    <h3 className="font-display font-medium text-lg text-zinc-900 group-hover:text-primary transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-zinc-600 text-sm leading-relaxed line-clamp-2">
                      {dest.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">
                      {dest.quickFacts?.timezone || 'Archipelago gateway'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">
                      <span>View destination</span>
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200/80 shadow-xs max-w-md mx-auto p-8 space-y-3">
          <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
            <Compass className="size-5" />
          </div>
          <h3 className="font-display font-medium text-base text-zinc-900">
            No destinations available
          </h3>
          <p className="text-zinc-500 text-xs sm:text-sm">
            Regional destinations are currently being updated.
          </p>
        </div>
      )}
    </section>
  );
}
