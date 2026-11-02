'use client';

import { useEffect, useState } from 'react';
import {
  Compass,
  Map,
  Users,
  Trees,
  Sparkles,
  ShieldCheck,
  Globe,
  Heart,
  type LucideIcon,
} from 'lucide-react';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { DEFAULT_APP_CONFIG, getAppConfig } from '@/lib/api';
import type { AppConfig } from '@/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Map,
  Compass,
  Users,
  Trees,
  Sparkles,
  ShieldCheck,
  Globe,
  Heart,
};

export default function WhyChooseUsSection() {
  const [credentials, setCredentials] = useState<AppConfig['credentials']>(
    DEFAULT_APP_CONFIG.credentials
  );

  useEffect(() => {
    getAppConfig()
      .then((cfg) => {
        if (cfg?.credentials) {
          setCredentials(cfg.credentials);
        }
      })
      .catch(() => {
        // Fallback to default credentials
      });
  }, []);

  return (
    <section id="about" className="py-24 bg-primary-dark text-white relative overflow-hidden">
      {/* Abstract tropical decorations */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-secondary mb-2 block">
            {credentials.subtitle}
          </span>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white">
            {credentials.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {credentials.items.map((feature, idx) => {
            const Icon = ICON_MAP[feature.icon] || Compass;
            return (
              <AnimatedContainer
                key={`${feature.title}-${idx}`}
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
