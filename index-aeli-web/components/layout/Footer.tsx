'use client';

import Link from 'next/link';
import { Compass, Send, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for subscribing to our newsletter!');
  };

  return (
    <footer className="bg-primary-dark text-zinc-300 border-t border-primary/20">
      {/* Top Newsletter CTA Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-12 border-b border-primary/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="font-display font-bold text-2xl md:text-3xl text-white mb-2 leading-tight">
              Get the Best of Indonesia in Your Inbox
            </h3>
            <p className="text-zinc-400 text-sm md:text-base max-w-md">
              Subscribe to get exclusive deals, custom itineraries, and travel guides straight to your inbox.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full max-w-md lg:ml-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/50 z-10" />
                <Input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-primary-light focus:bg-white/10 text-white text-sm transition-all placeholder:text-white/45"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                className="h-12 px-6 rounded-full font-bold active:scale-98 cursor-pointer gap-2"
              >
                <span>Subscribe</span>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* About Brand */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            {/* <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-white shadow-sm">
              <Compass className="w-5 h-5 text-primary" />
            </div> */}
            {/* <div className='bg-white rounded-full p-1 item-center'>
              <img src="/logo-aeli.png" alt="logo" width={40} height={40} />
            </div> */}
            <div className='backdrop-blur-sm rounded-[8px] p-1 item-center'>
              <img src="/logo_index.png" alt="logo" width={100} height={100} />
            </div>
            {/* <span className="font-display font-bold text-xl tracking-tight text-white leading-none">
              INDEX<span className=" font-extrabold">-AELI</span>
            </span> */}
            <span className={`font-display font-bold text-lg md:text-xl tracking-tight leading-none transition-colors duration-300`}>
              INDEX
              <span className='font-display font-medium text-sm md:text-md tracking-tight'>by</span>
              <span className='text-white font-extrabold'>AELI</span>
            </span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            INDEX-AELI is Indonesia's premier tourism landing platform. We connect worldwide travelers with curated premium program and unforgettable tropical attractions across the Indonesian archipelago.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-zinc-300" aria-label="Instagram">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.008 3.885.058 1.1.049 1.8.223 2.45.475.682.26 1.25.617 1.8 1.17.553.553.91 1.12 1.17 1.8.252.65.426 1.35.475 2.45.05 1.1.058 1.455.058 3.885s-.008 2.784-.058 3.885c-.049 1.1-.223 1.8-.475 2.45a4.822 4.822 0 01-1.17 1.8c-.553.553-1.12.91-1.8 1.17-.65.252-1.35.426-2.45.475-1.1.05-1.455.058-3.885.058s-2.784-.008-3.885-.058c-1.1-.049-1.8-.223-2.45-.475a4.822 4.822 0 01-1.8-1.17 4.822 4.822 0 01-1.17-1.8c-.252-.65-.426-1.35-.475-2.45-.05-1.1-.058-1.455-.058-3.885s.008-2.784.058-3.885c.049-1.1.223-1.8.475-2.45a4.822 4.822 0 011.17-1.8 4.822 4.822 0 011.8-1.17c.65-.252 1.35-.426 2.45-.475 1.1-.05 1.455-.058 3.885-.058zm-.21 1.761c-2.387 0-2.67.01-3.606.053-.865.04-1.33.184-1.643.303-.414.161-.71.353-.1.666-.3.313-.492.61-.666 1.025a4.347 4.347 0 00-.303 1.643c-.043.937-.053 1.22-.053 3.606s.01 2.67.053 3.606c.04.865.184 1.33.303 1.643.161.414.353.71.666 1.025.313.313.61.492 1.025.666.313.12.778.263 1.643.303.937.043 1.22.053 3.606.053s2.67-.01 3.606-.053c.865-.04 1.33-.184 1.643-.303.414-.161.71-.353 1.025-.666.313-.313.492-.61.666-1.025.12-.313.263-.778.303-1.643.043-.937.053-1.22.053-3.606s-.01-2.67-.053-3.606a4.347 4.347 0 00-.303-1.643c-.161-.414-.353-.71-.666-1.025a2.83 2.83 0 00-1.025-.666c-.313-.12-.778-.263-1.643-.303-.937-.043-1.22-.053-3.606-.053zm0 3.678a3.796 3.796 0 100 7.592 3.796 3.796 0 000-7.592zm0 6.09a2.294 2.294 0 110-4.588 2.294 2.294 0 010 4.588zm5.885-7.413a.897.897 0 11-1.794 0 .897.897 0 011.794 0z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-zinc-300" aria-label="Facebook">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-zinc-300" aria-label="Twitter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-zinc-300" aria-label="YouTube">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display font-semibold text-white text-base mb-6">Quick Navigation</h4>
          <ul className="space-y-3.5 text-sm">
            <li>
              <Link href="/#destinations" className="hover:text-primary-light transition-colors">Popular Destinations</Link>
            </li>
            <li>
              <Link href="/#attractions" className="hover:text-primary-light transition-colors">Top Attractions</Link>
            </li>
            <li>
              <Link href="/#program" className="hover:text-primary-light transition-colors">Curated Programs</Link>
            </li>
            <li>
              <Link href="/#about" className="hover:text-primary-light transition-colors">About INDEX-AELI</Link>
            </li>
            <li>
              <Link href="/booking" className="hover:text-primary-light transition-colors">Secure Booking</Link>
            </li>
          </ul>
        </div>

        {/* Support & Legal */}
        <div>
          <h4 className="font-display font-semibold text-white text-base mb-6">Support & Trust</h4>
          <ul className="space-y-3.5 text-sm">
            <li>
              <a href="#" className="hover:text-primary-light transition-colors">Help Center / FAQ</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary-light transition-colors">Safety Guidelines</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary-light transition-colors">Terms of Service</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary-light transition-colors">Privacy Policy</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary-light transition-colors">Refund & Cancellation Policy</a>
            </li>
          </ul>
        </div>

        {/* Contacts */}
        <div className="space-y-4">
          <h4 className="font-display font-semibold text-white text-base mb-6">Headquarters</h4>
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-4.5 h-4.5 text-primary-light flex-shrink-0 mt-0.5" />
            <span>Kuningan Cyber, Block C2-12, South Jakarta, Indonesia</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4.5 h-4.5 text-primary-light flex-shrink-0" />
            <span>+62 (21) 8000-AELI</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4.5 h-4.5 text-primary-light flex-shrink-0" />
            <span>explore@index-aeli.id</span>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-primary-dark/85 py-6 border-t border-primary/10 text-xs">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white-100">
          <p>© {new Date().getFullYear()} INDEX-AELI Indonesia. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
