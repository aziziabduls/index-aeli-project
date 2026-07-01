'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  return (
    <div className="w-full relative overflow-hidden bg-zinc-50 pt-0 pb-24 min-h-screen">
      {/* Background elements */}

      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-primary/5 rounded-bl-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-[500px] bg-blue-500/5 rounded-tr-full blur-3xl -z-10" />
      <div className="h-24 bg-primary-dark mb-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 mb-6 font-display">Get in Touch</h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            Have questions about our programs, destinations, or want to customize your journey? Our team of local experts is ready to help you plan the perfect Indonesian adventure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-10"
          >
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-6 font-display">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 mb-1">Our Office</h4>
                    <p className="text-zinc-600 leading-relaxed">
                      Kuningan Cyber, Block C2-12,<br />
                      South Jakarta, Indonesia
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 mb-1">Phone</h4>
                    <p className="text-zinc-600">+62 (21) 8000-AELI</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 mb-1">Email</h4>
                    <p className="text-zinc-600">explore@index-aeli.id</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200">
              <h4 className="font-bold text-zinc-900 mb-4 font-display">Business Hours</h4>
              <ul className="space-y-2 text-zinc-600">
                <li className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium text-zinc-900">09:00 - 18:00 (WIB)</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium text-zinc-900">10:00 - 15:00 (WIB)</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium text-zinc-900">Closed</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 border border-zinc-100 relative"
          >
            <h3 className="text-2xl font-bold text-zinc-900 mb-6 font-display">Send us a Message</h3>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-bold tracking-wide uppercase text-zinc-500">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-zinc-900"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-bold tracking-wide uppercase text-zinc-500">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-zinc-900"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold tracking-wide uppercase text-zinc-500">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-zinc-900"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-bold tracking-wide uppercase text-zinc-500">Subject</label>
                <select
                  id="subject"
                  defaultValue=""
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-zinc-900"
                >
                  <option value="" disabled>Select a subject...</option>
                  <option value="booking">Program Booking Inquiry</option>
                  <option value="custom">Custom Tour Request</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-bold tracking-wide uppercase text-zinc-500">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-zinc-900 resize-none"
                  placeholder="How can we help you plan your trip?"
                ></textarea>
              </div>

              <Button type="submit" variant="cobalt" size="xl" className="w-full rounded-2xl">
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
