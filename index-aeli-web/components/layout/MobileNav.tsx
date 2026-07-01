'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Compass, Map, BookOpen, Mail, Phone, ChevronRight } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activePath: string;
}

export function MobileNav({ isOpen, onClose, activePath }: MobileNavProps) {
  const isHome = activePath === '/';

  const menuItems = [
    { label: 'Home', path: isHome ? '#' : '/', icon: Home },
    { label: 'Destinations', path: isHome ? '#destinations' : '/destinations', icon: Compass },
    { label: 'Experiences', path: isHome ? '#experience' : '/experience', icon: Map },
    { label: 'Programs', path: isHome ? '#program' : '/programs', icon: BookOpen },
    { label: 'About', path: isHome ? 'about' : '/about', icon: BookOpen },
    { label: 'Contact', path: '/contact', icon: Phone }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet Menu */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-[30px] shadow-2xl z-50 overflow-hidden flex flex-col pb-8 border-t border-zinc-100"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto my-3 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-zinc-100">
              <span className="font-display font-semibold text-lg text-primary-dark">Menu</span>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full bg-zinc-50 text-zinc-500 hover:bg-zinc-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4.5 h-4.5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <nav className="flex flex-col gap-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePath === item.path ||
                    (item.path.startsWith('/#') && activePath === '/') ||
                    (item.path.startsWith('#') && activePath === '/');
                  return (
                    <Link
                      key={item.label}
                      href={item.path}
                      onClick={onClose}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all ${isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-zinc-600 hover:bg-zinc-50'
                        }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2 rounded-xl ${isActive ? 'bg-primary/20 text-primary' : 'bg-zinc-50 text-zinc-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-base">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-zinc-300'}`} />
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-2">
                <Link
                  href="/booking"
                  onClick={onClose}
                  className={buttonVariants({
                    variant: "marketing",
                    className: "w-full h-14 flex items-center justify-center rounded-full"
                  })}
                >
                  Book Now
                </Link>
              </div>

              {/* Quick Contacts */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>+62 (21) 8000-AELI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>explore@index-aeli.id</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
