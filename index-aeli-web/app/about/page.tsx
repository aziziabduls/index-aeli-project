'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Users,
  Map,
  ShieldCheck,
  Heart,
  Award,
  ArrowRight,
  Trees,
  Sparkles,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { DEFAULT_APP_CONFIG, getAppConfig } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AppConfig } from '@/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Map,
  Compass,
  Users,
  Heart,
  Trees,
  Sparkles,
  ShieldCheck,
  Globe,
  Award,
};

export default function AboutPage() {
  const [aboutConfig, setAboutConfig] = useState<AppConfig['about']>(
    DEFAULT_APP_CONFIG.about
  );

  useEffect(() => {
    getAppConfig()
      .then((cfg) => {
        if (cfg?.about) {
          setAboutConfig(cfg.about);
        }
      })
      .catch(() => {
        // Fallback to default
      });
  }, []);

  const heroImage =
    aboutConfig.image ||
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&fit=crop';

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      {/* 1. HERO HEADER (Dark surface provides contrast for fixed transparent navbar) */}
      <section className="bg-primary-dark text-white pt-32 pb-16 sm:pb-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center"
          >
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>{aboutConfig.badge || 'Organizational mission'}</span>
              </div>

              <h1 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                {aboutConfig.title}
              </h1>

              <p className="text-white/80 text-base sm:text-lg leading-relaxed whitespace-pre-line max-w-2xl">
                {aboutConfig.description_1}
              </p>

              {aboutConfig.description_2 && (
                <p className="text-white/60 text-sm sm:text-base leading-relaxed whitespace-pre-line max-w-2xl">
                  {aboutConfig.description_2}
                </p>
              )}

              <div className="pt-2">
                <Link
                  href="/programs"
                  className={cn(
                    buttonVariants({ variant: 'secondary' }),
                    'h-11 px-6 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-sm inline-flex items-center gap-2 shadow-xs transition-colors'
                  )}
                >
                  <span>Explore programs</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Right Image Visual */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/15 shadow-xl bg-white/5">
                <Image
                  src={heroImage}
                  alt={aboutConfig.title || 'About INDEX-AELI'}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. MAIN BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-20 sm:space-y-24">
        {/* Vision & Mission Cards */}
        <section aria-labelledby="vision-mission-heading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vision Card */}
            <div className="bg-white border border-zinc-200/80 p-8 rounded-2xl shadow-xs space-y-4 hover:border-zinc-300 transition-colors">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Compass className="size-5" />
              </div>
              <h2 id="vision-mission-heading" className="font-display font-medium text-xl text-zinc-900">
                {aboutConfig.vision_title}
              </h2>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {aboutConfig.vision_desc}
              </p>
            </div>

            {/* Mission Card */}
            <div className="bg-white border border-zinc-200/80 p-8 rounded-2xl shadow-xs space-y-4 hover:border-zinc-300 transition-colors">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Award className="size-5" />
              </div>
              <h2 className="font-display font-medium text-xl text-zinc-900">
                {aboutConfig.mission_title}
              </h2>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {aboutConfig.mission_desc}
              </p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        {aboutConfig.values && aboutConfig.values.length > 0 && (
          <section aria-labelledby="values-heading">
            <div className="mb-10">
              <span className="text-xs font-medium text-primary mb-2 block">
                {aboutConfig.values_badge || 'Organizational pillars'}
              </span>
              <h2 id="values-heading" className="font-display font-medium text-2xl sm:text-3xl text-zinc-900 tracking-tight">
                {aboutConfig.values_title}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {aboutConfig.values.map((val, idx) => {
                const Icon = ICON_MAP[val.icon] || Map;
                return (
                  <div
                    key={`${val.title}-${idx}`}
                    className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors"
                  >
                    <div>
                      <div className="size-9 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center mb-4 shrink-0">
                        <Icon className="size-4.5" />
                      </div>
                      <h3 className="font-display font-medium text-base text-zinc-900 mb-2">
                        {val.title}
                      </h3>
                      <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">
                        {val.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Team Section */}
        {aboutConfig.team_members && aboutConfig.team_members.length > 0 && (
          <section aria-labelledby="team-heading">
            <div className="mb-10">
              <span className="text-xs font-medium text-primary mb-2 block">
                {aboutConfig.team_badge || 'Leadership & stewards'}
              </span>
              <h2 id="team-heading" className="font-display font-medium text-2xl sm:text-3xl text-zinc-900 tracking-tight">
                {aboutConfig.team_title}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {aboutConfig.team_members.map((member, idx) => (
                <div
                  key={`${member.name}-${idx}`}
                  className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center hover:border-zinc-300 transition-colors"
                >
                  <div className="relative size-24 rounded-full overflow-hidden border-2 border-zinc-100 bg-zinc-100 mb-4 shrink-0 ring-4 ring-zinc-50">
                    <Image
                      src={member.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop'}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <h3 className="font-display font-medium text-base text-zinc-900">
                    {member.name}
                  </h3>
                  <span className="text-xs text-primary font-medium mt-0.5 mb-2">
                    {member.role}
                  </span>
                  <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed max-w-xs line-clamp-3">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
