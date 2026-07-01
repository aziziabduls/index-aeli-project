'use client';

import { Compass, Map, Users, Trees } from 'lucide-react';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

const features = [
  {
    icon: Map,
    title: 'Discover Hidden Gems',
    desc: 'Explore Indonesia\'s untouched corners and secret spots, far from the usual tourist trails.'
  },
  {
    icon: Compass,
    title: 'Explore Unique Experiences',
    desc: 'Authentic adventures curated to showcase Indonesia\'s rich culture and vibrant nature.'
  },
  {
    icon: Users,
    title: 'Connect Local Cultures',
    desc: 'Support local communities through tourism. We champion homestays, local guides, and community-based enterprises to ensure your trip gives back directly to the people and places you visit. Experience genuine hospitality and preserve Indonesia\'s cultural heritage together.'
  },
  {
    icon: Trees,
    title: 'Sustain For Better Future',
    desc: 'Protect the environment and support local communities through responsible tourism. We partner with eco-conscious operators, minimize waste, and promote conservation efforts to ensure your journey contributes to a sustainable future for Indonesia\'s natural treasures.'
  }
];

export default function WhyChooseUsSection() {
  return (
    <section id="about" className="py-24 bg-primary-dark text-white relative overflow-hidden">
      {/* Abstract tropical decorations */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-secondary mb-2 block">Our Credentials</span>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white">
            A World of Wonders Awaits
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <AnimatedContainer
                key={feature.title}
                animation="fadeInUp"
                delay={idx * 0.1}
                className="bg-white/5 border border-white/10 p-8 rounded-[24px] backdrop-blur-md flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-3">{feature.title}</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">{feature.desc}</p>
              </AnimatedContainer>
            );
          })}
        </div>
      </div>
    </section>
  );
}
