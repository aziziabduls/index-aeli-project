'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Compass } from 'lucide-react';
import { MobileNav } from './MobileNav';
import { useCurrency } from '@/lib/CurrencyContext';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { currency, setCurrency } = useCurrency();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Initialize state
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = pathname === '/';

  const navLinks = [
    { label: 'Home', path: isHome ? '#' : '/' },
    { label: 'Destinations', path: isHome ? '#destinations' : '/destinations' },
    { label: 'Experiences', path: isHome ? '#experience' : '/experience' },
    { label: 'Programs', path: isHome ? '#program' : '/programs' },
    { label: 'About', path: isHome ? '/about' : '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${isScrolled
          ? 'bg-white/40 backdrop-blur-md py-1.5'
          : 'bg-transparent py-6'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-300 ${isScrolled
              ? 'bg-primary text-white'
              : 'bg-white text-zinc-950'
              }`}>
              <Compass className="w-5 h-5" />
            </div> */}
            {/* <div className={`backdrop-blur-sm rounded-[8px] p-1 item-center ${isScrolled ? 'bg-black/10' : 'bg-white/20'}`}> */}
            <div className='rounded-[8px] p-1 item-center'>
              <img src="/logo_index.png" alt="logo" width={100} height={100} className={isScrolled ? 'text-zinc-900' : 'text-white'} />
            </div>
            {/* hide on mobile view */}
            {/* <div className="flex flex-col hidden md:block">
              <span className={`font-display font-bold text-lg md:text-xl tracking-tight leading-none transition-colors duration-300 ${isScrolled ? 'text-zinc-900' : 'text-white'
                }`}>
                INDEX
                <span className='font-display font-medium text-sm md:text-md tracking-tight'>by</span>
                <span className={isScrolled ? 'text-primary font-extrabold' : 'text-white font-extrabold'}>AELI</span>
              </span>
              <span className={`text-[12px] hidden sm:block font-semibold mt-1 leading-none transition-colors duration-300 ${isScrolled ? 'text-zinc-800' : 'text-white/60'
                }`}>
                Indonesia Destination-Based Exploration
              </span>
            </div> */}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.path ||
                (link.path.startsWith('/#') && pathname === '/') ||
                (link.path.startsWith('#') && pathname === '/');
              return (
                <Link
                  key={link.label}
                  href={link.path}
                  className={`font-display font-medium text-sm transition-all duration-300 py-2 tracking-tight ${isScrolled
                    ? isActive
                      ? 'text-primary font-bold'
                      : 'text-zinc-600 hover:text-zinc-900'
                    : isActive
                      ? 'text-white font-bold hover:border-b border-white/60'
                      : 'text-white/80 hover:text-white'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA / Hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrency(currency === 'IDR' ? 'USD' : 'IDR')}
              className={`inline-flex items-center justify-center h-10 px-4 font-display font-bold rounded-full transition-all duration-300 hover:scale-105 active:scale-95 text-xs border cursor-pointer ${isScrolled
                ? 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 bg-white shadow-sm'
                : 'border-white/20 text-white bg-white/10 hover:bg-white/20'
                }`}
              title="Change Currency"
            >
              <span>{currency === 'IDR' ? '🇮🇩 IDR' : '💵 USD'}</span>
            </button>

            <Link
              href="/booking"
              className={`hidden md:inline-flex items-center justify-center h-10 px-5.5 font-display font-bold rounded-full transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 text-xs shadow-sm ${isScrolled
                ? 'bg-marketing-btn text-white hover:bg-marketing-btn-hover'
                : 'bg-white text-zinc-950 hover:bg-zinc-100'
                }`}
            >
              Book Now
            </Link>

            <button
              onClick={() => setIsMobileOpen(true)}
              className={`md:hidden w-10 h-10 flex items-center justify-center rounded-full border shadow-sm transition-all duration-300 ${isScrolled
                ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                }`}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        activePath={pathname}
      />
    </>
  );
}


