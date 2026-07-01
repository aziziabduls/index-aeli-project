'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Calendar, Users, User, Mail, Phone, MessageSquare,
  ArrowLeft, ArrowRight, Star, ShieldCheck, CheckCircle2, Ticket, Printer,
  CreditCard, Landmark, QrCode, Lock, Check, Copy
} from 'lucide-react';
import { getPrograms } from '@/lib/api';
import { Program } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCurrency } from '@/lib/CurrencyContext';

// Inner component using useSearchParams
function BookingFormContent() {
  const { formatPrice, currency } = useCurrency();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourIdParam = searchParams.get('programId');

  const [programsData, setProgramsData] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected program state
  const [selectedTourId, setSelectedTourId] = useState(tourIdParam || '');

  useEffect(() => {
    async function loadPrograms() {
      try {
        const data = await getPrograms();
        setProgramsData(data);
        if (!selectedTourId && !tourIdParam && data.length > 0) {
          setSelectedTourId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load programs', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPrograms();
  }, []);

  const selectedTour = programsData.find(t => t.id === selectedTourId) || programsData[0];

  // Step state: 1 = Details, 2 = Payment
  const [currentStep, setCurrentStep] = useState(1);

  // Form states (Step 1)
  const [travelDate, setTravelDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment states (Step 2)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'transfer'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Submission/Success modal state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  // Update selected program if query param changes
  useEffect(() => {
    if (tourIdParam) {
      setSelectedTourId(tourIdParam);
    }
  }, [tourIdParam]);

  // Sync card holder name with full name entered in Step 1
  useEffect(() => {
    if (fullName && !cardName) {
      setCardName(fullName.toUpperCase());
    }
  }, [fullName, cardName]);

  // Pricing calculations
  const basePrice = selectedTour ? selectedTour.price * guestsCount : 0;
  const taxAndFees = Math.round(basePrice * 0.1); // 10% tax/fees
  const totalCost = basePrice + taxAndFees;

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!travelDate) newErrors.travelDate = 'Travel date is required';
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phone.length < 8) {
      newErrors.phone = 'Phone number is too short';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (paymentMethod !== 'card') return true; // Wallet/Transfer are mock interactions

    const newErrors: Record<string, string> = {};

    // Remove spaces for length check
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (!cleanCard) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cleanCard.length < 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    if (!cardExpiry) {
      newErrors.cardExpiry = 'Expiry date is required';
    } else if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(cardExpiry)) {
      newErrors.cardExpiry = 'Invalid format (MM/YY)';
    }

    if (!cardCvv) {
      newErrors.cardCvv = 'CVV is required';
    } else if (cardCvv.length < 3) {
      newErrors.cardCvv = 'CVV must be 3 digits';
    }

    if (!cardName.trim()) {
      newErrors.cardName = 'Cardholder name is required';
    }

    setPaymentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(2);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);

    // Simulate API request delay for secure payment gateway authorization
    setTimeout(() => {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      setBookingRef(`AELI-${randomId}-INDO`);
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 2000);
  };

  // Card formatting utilities
  const handleCardNumberChange = (value: string) => {
    const clean = value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < clean.length; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (value: string) => {
    const clean = value.replace(/\D/g, '').substring(0, 4);
    if (clean.length > 2) {
      setCardExpiry(`${clean.substring(0, 2)}/${clean.substring(2, 4)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-luxury-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Spacer for sticky header */}
      <div className="h-24 bg-primary-dark" />

      {/* Progress Indicator */}
      <div className="bg-zinc-50 border-b border-zinc-150 py-4">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-center gap-6 md:gap-12">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 1
              ? 'bg-primary text-white'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
              {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </span>
            <span className={`text-xs md:text-sm font-display font-bold ${currentStep === 1 ? 'text-zinc-900' : 'text-zinc-400'
              }`}>
              Traveler Details
            </span>
          </div>
          <div className="w-10 md:w-20 h-px bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 2
              ? 'bg-primary text-white font-extrabold'
              : 'bg-zinc-200 text-zinc-500'
              }`}>
              2
            </span>
            <span className={`text-xs md:text-sm font-display font-bold ${currentStep === 2 ? 'text-zinc-950 font-extrabold' : 'text-zinc-400'
              }`}>
              Secure Payment
            </span>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-10">
        <button
          onClick={() => {
            if (currentStep === 2) {
              setCurrentStep(1);
            } else {
              router.push(selectedTour ? `/programs/${selectedTour.id}` : '/');
            }
          }}
          className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-primary transition-colors bg-white border border-zinc-200 px-4 py-2 rounded-full mb-8 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{currentStep === 2 ? 'Back to Traveler Details' : 'Back to Experience'}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT: Multi-step checkout panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 1 ? (
                /* STEP 1: Traveler Details Form */
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-zinc-100 rounded-[28px] p-6 md:p-10 shadow-luxury space-y-8"
                >
                  <div className="border-b border-zinc-150 pb-4 text-left">
                    <h2 className="font-display font-extrabold text-2xl text-primary-dark">
                      Enter Traveler Details
                    </h2>
                    <p className="text-zinc-400 text-xs mt-1">
                      Please fill in accurate traveler information to configure your digital voucher.
                    </p>
                  </div>

                  <form onSubmit={handleNextStep} className="space-y-6">
                    {/* Program Selection */}
                    <div className="flex flex-col text-left">
                      <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
                        <Compass className="w-4 h-4 text-primary" /> Select Attraction Experience *
                      </label>
                      <Select
                        value={selectedTourId}
                        onValueChange={(val) => setSelectedTourId(val || '')}
                      >
                        <SelectTrigger className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 font-semibold focus:outline-none focus:border-primary focus:bg-white text-zinc-800 text-sm transition-all flex items-center justify-between shadow-none hover:bg-zinc-100/50">
                          <SelectValue placeholder="Select an experience">
                            {selectedTourId
                              ? (programsData.find(t => t.id === selectedTourId)?.name || 'Select an experience')
                              : 'Select an experience'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-1 z-50">
                          {programsData.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name} ({formatPrice(t.price)}/person)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Travel Date */}
                      <div className="flex flex-col text-left">
                        <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
                          <Calendar className="w-4 h-4 text-primary" /> Travel Date *
                        </label>
                        <Popover>
                          <PopoverTrigger className={`w-full h-12 px-4 rounded-xl border flex items-center justify-between text-sm transition-all text-left bg-zinc-50 border-zinc-200 focus:outline-none text-zinc-800 cursor-pointer ${errors.travelDate ? 'border-rose-500 bg-rose-50/10' : ''
                            }`}>
                            <span>
                              {travelDate ? new Date(travelDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Select Date'}
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50 bg-white border border-zinc-200 shadow-xl rounded-2xl">
                            <CalendarComponent
                              mode="single"
                              selected={travelDate ? new Date(travelDate) : undefined}
                              onSelect={(date) => {
                                if (!date) {
                                  setTravelDate('');
                                  return;
                                }
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                setTravelDate(`${year}-${month}-${day}`);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        {errors.travelDate && (
                          <span className="text-rose-500 text-xs mt-1.5 font-medium">{errors.travelDate}</span>
                        )}
                      </div>

                      {/* Number of Guests */}
                      <div className="flex flex-col text-left">
                        <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
                          <Users className="w-4 h-4 text-primary" /> Guests count *
                        </label>
                        <div className="flex h-12 border border-zinc-200 bg-zinc-50 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setGuestsCount(prev => Math.max(1, prev - 1))}
                            className="w-12 h-full flex items-center justify-center font-bold text-lg hover:bg-zinc-200/50 cursor-pointer"
                          >
                            -
                          </button>
                          <div className="flex-1 h-full flex items-center justify-center font-bold text-zinc-800 text-sm bg-white border-x border-zinc-150">
                            {guestsCount}
                          </div>
                          <button
                            type="button"
                            onClick={() => setGuestsCount(prev => Math.min(10, prev + 1))}
                            className="w-12 h-full flex items-center justify-center font-bold text-lg hover:bg-zinc-200/50 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-zinc-100">
                      <h3 className="font-display font-bold text-base text-primary-dark text-left">
                        Contact Information
                      </h3>

                      {/* Full Name */}
                      <div className="flex flex-col text-left">
                        <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
                          <User className="w-4 h-4 text-primary" /> Lead Traveler Name *
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`w-full h-12 px-4 bg-zinc-50 rounded-xl border ${errors.fullName ? 'border-rose-500 bg-rose-50/10' : 'border-zinc-200'
                            } focus:outline-none focus-visible:border-primary focus-visible:bg-white text-sm transition-all text-zinc-800`}
                        />
                        {errors.fullName && (
                          <span className="text-rose-500 text-xs mt-1.5 font-medium">{errors.fullName}</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Email */}
                        <div className="flex flex-col text-left">
                          <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
                            <Mail className="w-4 h-4 text-primary" /> Email Address *
                          </label>
                          <Input
                            type="email"
                            placeholder="name@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full h-12 px-4 bg-zinc-50 rounded-xl border ${errors.email ? 'border-rose-500 bg-rose-50/10' : 'border-zinc-200'
                              } focus:outline-none focus-visible:border-primary focus-visible:bg-white text-sm transition-all text-zinc-800`}
                          />
                          {errors.email && (
                            <span className="text-rose-500 text-xs mt-1.5 font-medium">{errors.email}</span>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="flex flex-col text-left">
                          <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
                            <Phone className="w-4 h-4 text-primary" /> Phone Number *
                          </label>
                          <Input
                            type="tel"
                            placeholder="+62 812-3456-7890"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`w-full h-12 px-4 bg-zinc-50 rounded-xl border ${errors.phone ? 'border-rose-500 bg-rose-50/10' : 'border-zinc-200'
                              } focus:outline-none focus-visible:border-primary focus-visible:bg-white text-sm transition-all text-zinc-800`}
                          />
                          {errors.phone && (
                            <span className="text-rose-500 text-xs mt-1.5 font-medium">{errors.phone}</span>
                          )}
                        </div>
                      </div>

                      {/* Special Request */}
                      <div className="flex flex-col text-left">
                        <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
                          <MessageSquare className="w-4 h-4 text-primary" /> Special Requests (Optional)
                        </label>
                        <textarea
                          placeholder="Dietary requests, hotel pickup instructions, accessibility guidelines..."
                          rows={4}
                          value={specialRequest}
                          onChange={(e) => setSpecialRequest(e.target.value)}
                          className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-primary focus:bg-white text-sm transition-all text-zinc-800 resize-none"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-zinc-150">
                      <button
                        type="submit"
                        className="w-full h-14 bg-marketing-btn hover:bg-marketing-btn-hover text-white font-display font-bold rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 text-sm"
                      >
                        <span>Continue to Payment</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* STEP 2: Secure Payment Page */
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-zinc-100 rounded-[28px] p-6 md:p-10 shadow-luxury space-y-8"
                >
                  <div className="pb-4 flex items-center justify-between text-left">
                    <div>
                      <h2 className="font-display font-extrabold text-2xl text-primary-dark">
                        Secure Payment
                      </h2>
                      <p className="text-zinc-400 text-xs mt-1">
                        Select your preferred payment method and authorize payment safely.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-3 py-1 rounded-full uppercase tracking-wider">
                      <Lock className="w-3.5 h-3.5" /> Secure
                    </div>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <Tabs
                    value={paymentMethod}
                    onValueChange={(val) => setPaymentMethod(val as 'card' | 'wallet' | 'transfer')}
                    className="w-full space-y-9"
                  >
                    <TabsList className="grid grid-cols-3 gap-2 rounded-2xl bg-zinc-50 h-auto w-full bg-transparent">
                      <TabsTrigger
                        value="card"
                        className="h-11 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 transition-all cursor-pointer data-active:bg-white data-active:text-zinc-950 data-active:shadow-sm data-active:border-zinc-200/50 text-zinc-500 hover:text-zinc-800 after:hidden"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="hidden sm:inline">Credit Card</span>
                        <span className="sm:hidden">Card</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="wallet"
                        className="h-11 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 transition-all cursor-pointer data-active:bg-white data-active:text-zinc-950 data-active:shadow-sm data-active:border-zinc-200/50 text-zinc-500 hover:text-zinc-800 after:hidden"
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="hidden sm:inline">E-Wallet (QRIS)</span>
                        <span className="sm:hidden">QRIS</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="transfer"
                        className="h-11 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 transition-all cursor-pointer data-active:bg-white data-active:text-zinc-950 data-active:shadow-sm data-active:border-zinc-200/50 text-zinc-500 hover:text-zinc-800 after:hidden"
                      >
                        <Landmark className="w-4 h-4" />
                        <span className="hidden sm:inline">Bank Transfer</span>
                        <span className="sm:hidden">Bank</span>
                      </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleBookingSubmit} className="space-y-8">
                      {/* Method details conditional render */}
                      <AnimatePresence mode="wait">
                        <TabsContent value="card">
                          <motion.div
                            key="card-details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            {/* Mock Credit Card Graphic Preview */}
                            <div className="relative w-full max-w-[400px] h-[220px] rounded-3xl bg-gradient-to-br from-primary via-primary-light to-primary-dark p-6 text-white flex flex-col justify-between shadow-lg overflow-hidden mx-auto">
                              {/* Decorative design elements */}
                              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                              <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />

                              <div className="flex justify-between items-start">
                                <Compass className="w-8 h-8 opacity-90" />
                                <span className="text-xs uppercase tracking-widest font-black opacity-80">INDEXAELI CARD</span>
                              </div>

                              {/* Card Chip & Wi-Fi */}
                              <div className="w-10 h-7 rounded bg-amber-400/80 shadow-inner flex items-center justify-center mt-2 relative overflow-hidden">
                                <div className="absolute inset-0 border border-amber-600/30 grid grid-cols-3 gap-px p-1" />
                              </div>

                              <div className="space-y-4">
                                {/* Card Number */}
                                <div className="font-display font-bold text-lg md:text-xl tracking-wider text-center select-none">
                                  {cardNumber || '•••• •••• •••• ••••'}
                                </div>

                                {/* Cardholder name & Expiry */}
                                <div className="flex justify-between items-end text-xs">
                                  <div className="text-left max-w-[70%]">
                                    <span className="block text-[8px] uppercase tracking-widest text-white/50 mb-0.5">Cardholder</span>
                                    <span className="font-bold tracking-wide uppercase truncate block">{cardName || 'YOUR FULL NAME'}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-[8px] uppercase tracking-widest text-white/50 mb-0.5">Expires</span>
                                    <span className="font-bold tracking-wide">{cardExpiry || 'MM/YY'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card Inputs Form */}
                            <div className="space-y-4">
                              {/* Card Number */}
                              <div className="flex flex-col text-left">
                                <label className="text-xs font-bold text-zinc-500 mb-1.5">Card Number *</label>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    placeholder="4111 1111 1111 1111"
                                    value={cardNumber}
                                    onChange={(e) => handleCardNumberChange(e.target.value)}
                                    className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-zinc-50 ${paymentErrors.cardNumber ? 'border-rose-500 bg-rose-50/10' : 'border-zinc-200'
                                      } focus:outline-none focus-visible:border-primary focus-visible:bg-white text-sm transition-all font-semibold text-zinc-800`}
                                  />
                                  <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                                </div>
                                {paymentErrors.cardNumber && (
                                  <span className="text-rose-500 text-xs mt-1 font-medium">{paymentErrors.cardNumber}</span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                {/* Expiry Date */}
                                <div className="flex flex-col text-left">
                                  <label className="text-xs font-bold text-zinc-500 mb-1.5">Expiration Date *</label>
                                  <Input
                                    type="text"
                                    placeholder="MM/YY"
                                    value={cardExpiry}
                                    onChange={(e) => handleExpiryChange(e.target.value)}
                                    className={`w-full h-11 px-4 rounded-xl border bg-zinc-50 ${paymentErrors.cardExpiry ? 'border-rose-500 bg-rose-50/10' : 'border-zinc-200'
                                      } focus:outline-none focus-visible:border-primary focus-visible:bg-white text-sm transition-all font-semibold text-zinc-800`}
                                  />
                                  {paymentErrors.cardExpiry && (
                                    <span className="text-rose-500 text-xs mt-1 font-medium">{paymentErrors.cardExpiry}</span>
                                  )}
                                </div>

                                {/* CVV */}
                                <div className="flex flex-col text-left">
                                  <label className="text-xs font-bold text-zinc-500 mb-1.5">CVV / CVC *</label>
                                  <Input
                                    type="password"
                                    placeholder="•••"
                                    maxLength={3}
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                    className={`w-full h-11 px-4 rounded-xl border bg-zinc-50 ${paymentErrors.cardCvv ? 'border-rose-500 bg-rose-50/10' : 'border-zinc-200'
                                      } focus:outline-none focus-visible:border-primary focus-visible:bg-white text-sm transition-all font-semibold text-zinc-800`}
                                  />
                                  {paymentErrors.cardCvv && (
                                    <span className="text-rose-500 text-xs mt-1 font-medium">{paymentErrors.cardCvv}</span>
                                  )}
                                </div>
                              </div>

                              {/* Cardholder Name */}
                              <div className="flex flex-col text-left">
                                <label className="text-xs font-bold text-zinc-500 mb-1.5">Cardholder Name *</label>
                                <Input
                                  type="text"
                                  placeholder="YOUR FULL NAME"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                  className={`w-full h-11 px-4 rounded-xl border bg-zinc-50 ${paymentErrors.cardName ? 'border-rose-500 bg-rose-50/10' : 'border-zinc-200'
                                    } focus:outline-none focus-visible:border-primary focus-visible:bg-white text-sm transition-all font-semibold text-zinc-800`}
                                />
                                {paymentErrors.cardName && (
                                  <span className="text-rose-500 text-xs mt-1 font-medium">{paymentErrors.cardName}</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </TabsContent>

                        <TabsContent value="wallet">
                          <motion.div
                            key="wallet-details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6 text-center"
                          >
                            <div className="bg-zinc-50 rounded-2xl border border-zinc-150 p-6 flex flex-col items-center max-w-[320px] mx-auto space-y-4">
                              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">QRIS Digital Payment</span>

                              {/* Mock QR Code Graphic */}
                              <div className="relative w-48 h-48 bg-white border border-zinc-200 p-2 rounded-xl flex items-center justify-center shadow-inner">
                                <div className="w-full h-full relative opacity-85">
                                  {/* Visual representation of a QR code using boxes */}
                                  <div className="absolute inset-0 bg-zinc-900 grid grid-cols-6 gap-2 p-1.5 rounded">
                                    <div className="bg-white rounded-sm border-2 border-zinc-900" />
                                    <div className="bg-white rounded-sm border-2 border-zinc-900" />
                                    <div className="bg-white" />
                                    <div className="bg-white" />
                                    <div className="bg-white rounded-sm border-2 border-zinc-900" />
                                    <div className="bg-white" />
                                  </div>
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-zinc-200 shadow-sm z-10">
                                    <Compass className="w-5 h-5 text-primary" />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-xs font-bold text-zinc-800">Scan to pay: {formatPrice(totalCost)}</span>
                                <span className="text-[10px] text-zinc-400 block">Accepts GoPay, OVO, ShopeePay, DANA & LinkAja</span>
                              </div>
                            </div>
                          </motion.div>
                        </TabsContent>

                        <TabsContent value="transfer">
                          <motion.div
                            key="transfer-details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="bg-zinc-50 rounded-2xl border border-zinc-150 p-6 text-left space-y-5">
                              <div className="border-b border-zinc-200 pb-3 flex items-center justify-between">
                                <div>
                                  <span className="text-xs text-zinc-400 uppercase tracking-widest block font-bold">Bank Name</span>
                                  <span className="font-display font-extrabold text-sm text-zinc-800">Bank Central Asia (BCA)</span>
                                </div>
                                <span className="text-xs font-extrabold text-primary bg-primary-soft px-3 py-1 rounded-full">Virtual Account</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs text-zinc-400 uppercase tracking-widest block font-bold">VA Number</span>
                                  <span className="font-mono text-lg font-bold text-zinc-900 tracking-wider">80008 1234 5678 90</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard('800081234567890')}
                                  className="h-9 px-3 bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
                                >
                                  {copied ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-600">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy VA</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="border-t border-zinc-200 pt-3 text-xs text-zinc-500 leading-relaxed space-y-1">
                                <p className="font-bold text-zinc-700">Instructions:</p>
                                <p>1. Input the Virtual Account number in your Mobile Banking app.</p>
                                <p>2. The app will automatically populate the booking amount: <span className="font-bold text-zinc-800">{formatPrice(totalCost)}</span>.</p>
                                <p>3. Authorize the transfer and return to this page to receive your ticket.</p>
                              </div>
                            </div>
                          </motion.div>
                        </TabsContent>
                      </AnimatePresence>

                      {/* Submit and Navigation Action Buttons */}
                      <div className="pt-6 border-t border-zinc-150 flex flex-col sm:flex-row gap-4">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="h-14 px-8 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-display font-bold rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer order-2 sm:order-1 text-sm shadow-sm"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to Details</span>
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 h-14 bg-primary hover:bg-primary-light disabled:bg-primary-dark/50 text-white font-display font-bold rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer order-1 sm:order-2 text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Processing Secured Payment...</span>
                            </div>
                          ) : (
                            <>
                              <ShieldCheck className="w-4.5 h-4.5" />
                              <span>Authorize Secure Payment & Book</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Booking Summary Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-zinc-100 rounded-[28px] p-6 md:p-8 shadow-luxury space-y-6">
              <h3 className="font-display font-bold text-lg text-primary-dark border-b border-zinc-100 pb-4">
                Booking Summary
              </h3>

              {/* Selected Program Preview */}
              {selectedTour && (
                <div className="space-y-4">
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-sm">
                    <Image
                      src={selectedTour.image}
                      alt={selectedTour.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-zinc-900 leading-tight">
                      {selectedTour.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-zinc-500">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span>{selectedTour.rating} ({selectedTour.reviewsCount} reviews)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Calculator details */}
              <div className="border-t border-zinc-100 pt-6 space-y-4 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Price per Person</span>
                  <span>{selectedTour && formatPrice(selectedTour.price)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Number of Guests</span>
                  <span>x {guestsCount}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-800">{formatPrice(basePrice)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>CHSE Safety Tax & Fees (10%)</span>
                  <span>{formatPrice(taxAndFees)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-4 border-t border-zinc-100">
                  <span className="font-display font-bold text-primary-dark text-base">Grand Total</span>
                  <span className="font-display font-black text-2xl text-primary">{formatPrice(totalCost)}</span>
                </div>
              </div>
            </div>

            {/* Secure Trust Badge */}
            <div className="bg-white border border-zinc-100 rounded-[24px] p-6 shadow-luxury flex gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl flex-shrink-0 h-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm text-primary-dark">Instant Confirmed Booking</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Your payment is secured with standard 256-bit encryption. Voucher instantly available after confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUCCESS MODAL DIALOG (Step 3: Ticket success) */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-xl bg-white rounded-[32px] overflow-hidden p-8 md:p-10 shadow-2xl text-center space-y-6 z-50 border-0" showCloseButton={false}>
          {/* Success Checkmark */}
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="font-display font-extrabold text-2xl md:text-3xl text-primary-dark text-center">
              Booking Confirmed!
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm max-w-md mx-auto text-center">
              Thank you for booking with INDEX-AELI. Your travel voucher has been generated successfully and is ready.
            </DialogDescription>
          </DialogHeader>

          {/* Booking Voucher Receipt */}
          <div className="border border-dashed border-zinc-200 rounded-[20px] p-6 text-left space-y-4 bg-zinc-50 relative">
            {/* Punch Holes for ticket effect */}
            <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-r border-zinc-200" />
            <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-l border-zinc-200" />

            <div className="flex items-center gap-3 border-b border-dashed border-zinc-200 pb-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">Booking Ref</span>
                <span className="font-display font-extrabold text-sm text-primary-dark tracking-wide">{bookingRef}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 font-semibold block mb-0.5">Program Name</span>
                <span className="font-bold text-zinc-800 line-clamp-1">{selectedTour?.name}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold block mb-0.5">Date</span>
                <span className="font-bold text-zinc-800">{travelDate}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold block mb-0.5">Guests</span>
                <span className="font-bold text-zinc-800">{guestsCount} Person(s)</span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold block mb-0.5">Total Paid</span>
                <span className="font-bold text-teal-600">{formatPrice(totalCost)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => {
                window.print();
              }}
              className="h-12 border border-primary/20 hover:border-primary text-primary font-display font-bold rounded-full flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/');
              }}
              className="h-12 bg-primary hover:bg-primary-light text-white font-display font-bold rounded-full flex items-center justify-center text-sm shadow-md transition-all cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-luxury-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium text-sm">Loading booking form...</p>
        </div>
      </div>
    }>
      <BookingFormContent />
    </Suspense>
  );
}
