'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface GlassCardProps {
  imageSrc: string;
  imageAlt: string;
  className?: string;
  children: React.ReactNode;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'wide';
  hoverEffect?: boolean;
}

export function GlassCard({
  imageSrc,
  imageAlt,
  className = '',
  children,
  aspectRatio = 'video',
  hoverEffect = true
}: GlassCardProps) {
  const aspectClass = {
    video: 'aspect-[16/10]',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]'
  }[aspectRatio];

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -8 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`glass-effect rounded-xxxl overflow-hidden shadow-luxury hover:shadow-luxury-hover transition-all duration-300 ${className}`}
    >
      <div className={`relative w-full ${aspectClass} overflow-hidden`}>
        <motion.div
          whileHover={hoverEffect ? { scale: 1.08 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full relative"
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
          />
          {/* Subtle gradient overlay to ensure text contrast inside/below the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
        </motion.div>
      </div>
      <div className="p-6 relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
