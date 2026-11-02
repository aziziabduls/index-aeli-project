'use client';

import Link from 'next/link';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { Attraction } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

interface AttractionsSectionProps {
  attractions: Attraction[];
}

export default function AttractionsSection({ attractions }: AttractionsSectionProps) {
  return (
    <section id="experience" className="py-24 bg-white/50 border-y border-zinc-100">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <AnimatedContainer animation="slideInLeft">
            <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary mb-2 block">Iconic Experience</span>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-primary-dark">
              Must-Visit Top Experience
            </h2>
            <AnimatedContainer animation="fadeIn" delay={0.2} className="mt-4 text-zinc-500 max-w-sm">
              Discover unique heritage sites, volcanic marvels, and breathtaking wildlife sanctuaries.
            </AnimatedContainer>
          </AnimatedContainer>

          {/* <AnimatedContainer animation="fadeIn" delay={0.2} className="mt-4 md:mt-0">
            <Link
              href="/experience"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-luxury"
            >
              View All Experience <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimatedContainer> */}
          <div className='flex justify-end mt-4'>
            <Link
              href="/experience"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              View All Experience <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Grid Layout - 3 columns */}
        {attractions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {attractions.slice(0, 6).map((attr, index) => (
              <AnimatedContainer
                key={attr.id}
                animation="fadeInUp"
                delay={index * 0.1}
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
                      <Star className="w-3.5 h-3.5 text-green-500 fill-green-500" />
                      <span className="text-green-500 font-extrabold">
                        {attr.rating}
                      </span>
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-primary-dark mb-2 line-clamp-1">{attr.name}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed mb-5 line-clamp-2">{attr.description}</p>
                  <Link
                    href={`/experience/${attr.id}`}
                    className="inline-flex items-center justify-center w-full h-11 border border-primary/20 hover:border-primary hover:bg-primary/5 text-primary text-sm font-semibold rounded-xl transition-all"
                  >
                    View Details & Program
                  </Link>
                </GlassCard>
              </AnimatedContainer>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-50 rounded-3xl border border-zinc-100">
            <p className="text-zinc-500 text-sm">Belum ada pengalaman / atraksi yang ditambahkan.</p>
          </div>
        )}
      </div>
    </section>
  );
}
