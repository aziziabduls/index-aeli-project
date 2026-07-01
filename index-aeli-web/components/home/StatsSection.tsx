'use client';

import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

const stats = [
  { value: '10K+', label: 'Happy Travelers' },
  { value: '500+', label: 'Luxury Programs' },
  { value: '120+', label: 'Unique Destinations' }
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-zinc-50 border-b border-zinc-100">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
        {stats.map((stat, index) => (
          <AnimatedContainer
            key={stat.label}
            animation="scaleIn"
            delay={index * 0.1}
            className="space-y-2"
          >
            <div className="font-display font-extrabold text-4xl sm:text-5xl text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="text-zinc-600 font-semibold text-sm uppercase tracking-widest">{stat.label}</div>
          </AnimatedContainer>
        ))}
      </div>
    </section>
  );
}
