'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEFAULT_APP_CONFIG, getAppConfig } from '@/lib/api';
import type { AppConfig } from '@/types';

export default function ContactPage() {
  const [contactConfig, setContactConfig] = useState<AppConfig['contact']>(
    DEFAULT_APP_CONFIG.contact
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    getAppConfig()
      .then((cfg) => {
        if (cfg?.contact) {
          setContactConfig(cfg.contact);
        }
      })
      .catch(() => {
        // Fallback to default
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      {/* 1. HERO HEADER (Dark surface provides contrast for fixed transparent navbar) */}
      <section className="bg-primary-dark text-white pt-32 pb-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-2xl mx-auto space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-medium">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>Direct inquiry desk</span>
            </div>

            <h1 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
              {contactConfig.title}
            </h1>

            <p className="text-white/80 text-base sm:text-lg leading-relaxed whitespace-pre-line">
              {contactConfig.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. MAIN BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Details & Business Hours (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs space-y-6">
              <div>
                <h2 className="font-display font-medium text-lg text-zinc-900">
                  Regional correspondence
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Official representation and traveler concierge services.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                {/* Office Location */}
                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="size-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-400 block">Our office</span>
                    <p className="text-zinc-800 text-sm leading-relaxed whitespace-pre-line mt-0.5">
                      {contactConfig.address}
                    </p>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="size-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-400 block">Direct telephone</span>
                    <a
                      href={`tel:${contactConfig.phone.replace(/[^0-9+]/g, '')}`}
                      className="text-zinc-800 text-sm font-medium hover:text-primary transition-colors block mt-0.5"
                    >
                      {contactConfig.phone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="size-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-400 block">Electronic inquiries</span>
                    <a
                      href={`mailto:${contactConfig.email}`}
                      className="text-zinc-800 text-sm font-medium hover:text-primary transition-colors block mt-0.5"
                    >
                      {contactConfig.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Operating Hours Block */}
              <div className="pt-6 border-t border-zinc-100">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="size-4 text-zinc-400" />
                  <h3 className="font-display font-medium text-sm text-zinc-900">
                    Operating hours (WIB)
                  </h3>
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-zinc-50">
                    <span className="text-zinc-500">Monday – Friday</span>
                    <span className="font-medium text-zinc-900 tabular-nums">
                      {contactConfig.business_hours.weekday}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-50">
                    <span className="text-zinc-500">Saturday</span>
                    <span className="font-medium text-zinc-900 tabular-nums">
                      {contactConfig.business_hours.saturday}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Sunday & Public Holidays</span>
                    <span className="font-medium text-zinc-900 tabular-nums">
                      {contactConfig.business_hours.sunday}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs">
              <div className="mb-6">
                <h2 className="font-display font-medium text-lg text-zinc-900">
                  Send an inquiry
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Fill out the form below and our regional coordination desk will reach out.
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <p className="font-medium">Inquiry received successfully</p>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Thank you for reaching out. An expedition coordinator will contact you shortly.
                  </p>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="firstName" className="text-xs font-medium text-zinc-700 block">
                        First name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        required
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-sm text-zinc-900 transition-colors outline-none"
                        placeholder="e.g. Maya"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lastName" className="text-xs font-medium text-zinc-700 block">
                        Last name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        required
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-sm text-zinc-900 transition-colors outline-none"
                        placeholder="e.g. Hartono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-zinc-700 block">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-sm text-zinc-900 transition-colors outline-none"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="text-xs font-medium text-zinc-700 block">
                      Inquiry topic
                    </label>
                    <select
                      id="subject"
                      defaultValue=""
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-sm text-zinc-900 transition-colors outline-none cursor-pointer"
                    >
                      <option value="" disabled>Select inquiry topic...</option>
                      <option value="booking">Program Booking & Availability</option>
                      <option value="custom">Custom Expedition & Group Request</option>
                      <option value="partnership">Community & Certified Guide Partnership</option>
                      <option value="other">General Inquiries</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-medium text-zinc-700 block">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      className="w-full px-3.5 py-3 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-sm text-zinc-900 transition-colors outline-none resize-none"
                      placeholder="Tell us about your dates, destination interest, or group size..."
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="cobalt"
                    className="w-full h-11 rounded-xl font-medium text-sm inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Send className="size-4" />
                    <span>Send inquiry</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
