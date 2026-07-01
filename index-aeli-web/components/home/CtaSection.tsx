'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function CtaSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary-light to-primary-dark text-white text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-tight mb-4">
          Ready to Begin Your Tropical Odyssey?
        </h2>
        <p className="text-zinc-200 text-base md:text-lg mb-8 max-w-xl mx-auto font-medium">
          Contact us today for custom private programs, premium villa retreats, or group event planning across Indonesia.
        </p>
        <Link
          href="/booking"
          className={buttonVariants({
            variant: "secondary",
            className: "inline-flex h-14 px-8 items-center justify-center font-display font-bold text-sm rounded-full shadow-md transition-all text-primary-dark cursor-pointer text-center"
          })}
        >
          Create Booking Securely
        </Link>
      </div>
    </section>
  );
}
