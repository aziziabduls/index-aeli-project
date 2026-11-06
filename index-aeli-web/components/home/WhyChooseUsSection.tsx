'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    <section id="about" className="py-20 sm:py-24 bg-primary-dark text-white border-y border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-16 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>{credentials.subtitle || 'Verified standards'}</span>
          </div>
          <h2 className="font-display font-medium text-3xl sm:text-4xl text-white tracking-tight">
            {credentials.title}
          </h2>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {credentials.items.map((feature, idx) => {
            const Icon = ICON_MAP[feature.icon] || Compass;
            return (
              <motion.div
                key={`${feature.title}-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05, ease: 'easeOut' }}
                className="bg-white/5 border border-white/10 p-6 sm:p-7 rounded-2xl flex flex-col justify-between hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200"
              >
                <div>
                  <div className="size-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-5 shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-display font-medium text-base text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
