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
import Link from 'next/link';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { buttonVariants } from '@/components/ui/button';
import { DEFAULT_APP_CONFIG, getAppConfig } from '@/lib/api';
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

  return (
    <div className="w-full relative overflow-hidden bg-zinc-50 pt-0 pb-24 min-h-screen">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-primary/5 rounded-bl-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-[500px] bg-blue-500/5 rounded-tr-full blur-3xl -z-10" />
      <div className="h-24 bg-primary-dark mb-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <AnimatedContainer animation="slideInLeft" className="text-left space-y-6">
            <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary block">
              {aboutConfig.badge}
            </span>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-primary-dark tracking-tight leading-tight">
              {aboutConfig.title}
            </h1>
            <p className="text-zinc-600 text-base md:text-lg leading-relaxed whitespace-pre-line">
              {aboutConfig.description_1}
            </p>
            {aboutConfig.description_2 && (
              <p className="text-zinc-500 text-sm md:text-base leading-relaxed whitespace-pre-line">
                {aboutConfig.description_2}
              </p>
            )}
            <div className="pt-2">
              <Link
                href="/programs"
                className={buttonVariants({ variant: 'cobalt', size: 'lg', className: 'rounded-full' })}
              >
                <span>Explore Programs</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </AnimatedContainer>

          <AnimatedContainer
            animation="slideInRight"
            className="relative aspect-[4/3] rounded-[32px] overflow-hidden shadow-luxury"
          >
            <img
              src={
                aboutConfig.image ||
                'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&fit=crop'
              }
              alt="About Us Banner"
              className="object-cover w-full h-full"
            />
          </AnimatedContainer>
        </div>

        {/* Vision & Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 text-left">
          <AnimatedContainer
            animation="fadeInUp"
            delay={0.1}
            className="bg-white border border-zinc-150 p-8 md:p-10 rounded-[32px] shadow-sm space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-display font-extrabold text-2xl text-primary-dark">
              {aboutConfig.vision_title}
            </h3>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {aboutConfig.vision_desc}
            </p>
          </AnimatedContainer>

          <AnimatedContainer
            animation="fadeInUp"
            delay={0.2}
            className="bg-white border border-zinc-150 p-8 md:p-10 rounded-[32px] shadow-sm space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-display font-extrabold text-2xl text-primary-dark">
              {aboutConfig.mission_title}
            </h3>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {aboutConfig.mission_desc}
            </p>
          </AnimatedContainer>
        </div>

        {/* Core Values Section */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary mb-2 block">
              {aboutConfig.values_badge}
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-primary-dark">
              {aboutConfig.values_title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            {aboutConfig.values.map((val, idx) => {
              const Icon = ICON_MAP[val.icon] || Map;
              return (
                <AnimatedContainer
                  key={`${val.title}-${idx}`}
                  animation="fadeInUp"
                  delay={idx * 0.05}
                  className="bg-white/70 border border-zinc-200/60 p-6.5 rounded-[24px] shadow-sm flex flex-col items-start backdrop-blur-sm"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-display font-bold text-base text-zinc-900 mb-2">{val.title}</h4>
                  <p className="text-zinc-500 text-xs leading-relaxed">{val.desc}</p>
                </AnimatedContainer>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-primary mb-2 block">
              {aboutConfig.team_badge}
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-primary-dark">
              {aboutConfig.team_title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aboutConfig.team_members.map((member, idx) => (
              <AnimatedContainer
                key={`${member.name}-${idx}`}
                animation="fadeInUp"
                delay={idx * 0.1}
                className="bg-white border border-zinc-100 rounded-[28px] p-6 shadow-luxury flex flex-col items-center text-center space-y-4 hover:shadow-luxury-hover transition-all duration-300"
              >
                <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-md">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg text-primary-dark">{member.name}</h4>
                  <span className="text-xs text-primary font-bold tracking-wider uppercase">
                    {member.role}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">{member.bio}</p>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
