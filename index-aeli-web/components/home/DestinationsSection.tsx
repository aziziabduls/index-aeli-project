'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Destination } from '@/types';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

interface DestinationsSectionProps {
  destinations: Destination[];
}

export default function DestinationsSection({ destinations }: DestinationsSectionProps) {
  return (
    <section id="destinations" className="py-24 max-w-7xl mx-auto px-6 md:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <AnimatedContainer animation="slideInLeft">
          <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary mb-2 block">Tropical Archipelagos</span>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-primary-dark">
            Explore Popular Destinations
          </h2>
          <AnimatedContainer animation="fadeIn" delay={0.2} className="mt-4 text-zinc-500 max-w-sm">
            Experience the rich diversity of Indonesia across our top featured regional hotspots.
          </AnimatedContainer>
        </AnimatedContainer>
        {/* add button view all */}
        <div className='flex justify-end mt-4'>
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            View All Destinations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Scrollable Row */}
      <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x scroll-smooth overflow-y-hidden">
        {destinations.map((dest, index) => (
          <motion.div
            key={dest.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            className="min-w-[280px] sm:min-w-[340px] snap-start"
          >
            <Link href={`/destinations/${dest.id}`} className="block group">
              <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden shadow-luxury transition-all duration-500 hover:shadow-luxury-hover">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  sizes="340px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Graduated Dark Glass Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/95 via-primary-dark/20 to-black/10 transition-opacity duration-300" />

                {/* Content Over the Image */}
                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end text-white">
                  <span className="text-xs uppercase tracking-widest text-secondary-light font-bold mb-1">
                    {dest.attractionCount} Experience
                  </span>
                  <h3 className="font-display font-bold text-2xl mb-3">{dest.name}</h3>
                  <p className="text-zinc-300 text-xs line-clamp-2 mb-4 leading-relaxed font-light">
                    {dest.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white group-hover:text-secondary-light transition-colors">
                    Explore Destination <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
