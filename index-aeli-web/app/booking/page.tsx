'use client';

import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createBooking, createPaymentBooking, getAppConfig, getPrograms } from '@/lib/api';
import { HOOPLE_PAYMENT_METHODS, PAYMENT_CATEGORIES, PaymentMethodItem } from '@/lib/payment-methods';
import { useCurrency } from '@/lib/CurrencyContext';
import { Program } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Copy,
  CreditCard,
  Landmark,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  User,
  Users,
  Wallet
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function BookingFormContent() {
  const { formatPrice } = useCurrency();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourIdParam = searchParams.get('programId');

  const [programsData, setProgramsData] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [configuredTaxPercent, setConfiguredTaxPercent] = useState<number>(
    Number(process.env.NEXT_PUBLIC_TAX_PERCENT ?? 10)
  );

  // Selected program state
  const [selectedTourId, setSelectedTourId] = useState(tourIdParam || '');

  useEffect(() => {
    async function loadPrograms() {
      try {
        const [data, appConfig] = await Promise.all([getPrograms(), getAppConfig()]);
        setProgramsData(data);
        if (appConfig && typeof appConfig.tax_percent === 'number' && !isNaN(appConfig.tax_percent)) {
          setConfiguredTaxPercent(appConfig.tax_percent);
        }
        if (tourIdParam) {
          setSelectedTourId(tourIdParam);
        }
      } catch (err) {
        console.error('Failed to load programs', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPrograms();
  }, [tourIdParam]);

  const selectedTour = programsData.find((t) => t.id === selectedTourId) || programsData[0];

  // Form states
  const [travelDate, setTravelDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Submission/Success modal state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  // Payment method selection states (Section 9 Hoople Payment Catalog)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('qris');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const activeMethod =
    HOOPLE_PAYMENT_METHODS.find((m) => m.id === selectedPaymentMethod) || HOOPLE_PAYMENT_METHODS[0];

  const filteredMethods = HOOPLE_PAYMENT_METHODS.filter((m) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'qris_ewallet') return m.category === 'qris' || m.category === 'ewallet';
    if (activeCategory === 'va') return m.category === 'va';
    if (activeCategory === 'card') return m.category === 'card';
    if (activeCategory === 'paylater_retail') return m.category === 'paylater' || m.category === 'convenience';
    return true;
  });

  const getMethodIcon = (category: string) => {
    switch (category) {
      case 'qris':
        return <QrCode className="size-4" />;
      case 'ewallet':
        return <Wallet className="size-4" />;
      case 'va':
        return <Landmark className="size-4" />;
      case 'card':
        return <CreditCard className="size-4" />;
      case 'convenience':
        return <Store className="size-4" />;
      case 'paylater':
      default:
        return <Sparkles className="size-4" />;
    }
  };

  const minAllowedGuests = selectedTour?.minQuota ?? selectedTour?.maxGuestMin ?? 1;
  const maxAllowedGuests = selectedTour?.maxQuota ?? selectedTour?.maxGuestMax ?? 50;

  // Date availability resolution helper
  const getDateAvailabilityInfo = (availability?: string) => {
    const normalized = (availability || 'all_days').toLowerCase();
    if (normalized === 'weekends' || normalized === 'only weekend' || normalized === 'weekend') {
      return {
        type: 'weekends' as const,
        label: 'Weekends only',
        fullLabel: 'Saturday – Sunday only',
        badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        description: 'Available on Saturdays and Sundays only',
      };
    }
    if (normalized === 'weekdays' || normalized === 'only weekday' || normalized === 'weekday') {
      return {
        type: 'weekdays' as const,
        label: 'Weekdays only',
        fullLabel: 'Monday – Friday only',
        badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        description: 'Available from Monday to Friday only',
      };
    }
    if (normalized === 'specific_dates' || normalized === 'custom' || normalized === 'specific') {
      const datesCount = selectedTour?.availableDates?.length || 0;
      return {
        type: 'specific_dates' as const,
        label: datesCount > 0 ? `${datesCount} dates available` : 'Specific dates',
        fullLabel: datesCount > 0 ? `Specific dates (${datesCount} schedules)` : 'Specific dates only',
        badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        description: datesCount > 0
          ? `Available on ${datesCount} specific scheduled dates`
          : 'Available on specifically scheduled dates only',
      };
    }
    return {
      type: 'all_days' as const,
      label: 'All dates',
      fullLabel: 'Available daily',
      badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      description: 'Available every day of the week',
    };
  };

  const availabilityInfo = getDateAvailabilityInfo(selectedTour?.dateAvailability);

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    const availType = availabilityInfo.type;
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;

    if (availType === 'weekends') {
      return !isWeekend;
    }
    if (availType === 'weekdays') {
      return isWeekend;
    }
    if (availType === 'specific_dates') {
      const allowed = selectedTour?.availableDates || [];
      if (allowed.length === 0) return true;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      return !allowed.includes(dateStr);
    }
    return false;
  };

  // Auto clamp guests count and re-check travel date when selected tour changes
  useEffect(() => {
    if (selectedTour) {
      const minQ = selectedTour.minQuota ?? selectedTour.maxGuestMin;
      const maxQ = selectedTour.maxQuota ?? selectedTour.maxGuestMax;
      if (minQ && guestsCount < minQ) {
        setGuestsCount(minQ);
      } else if (maxQ && guestsCount > maxQ) {
        setGuestsCount(maxQ);
      }

      if (travelDate) {
        const d = new Date(travelDate);
        if (isDateDisabled(d)) {
          setTravelDate('');
        }
      }
    }
  }, [selectedTour]);

  // Pricing calculations
  const taxPercent = configuredTaxPercent;
  const taxRate = isNaN(taxPercent) ? 0.1 : taxPercent / 100;
  const basePrice = selectedTour ? selectedTour.price * guestsCount : 0;
  const taxAndFees = Math.round(basePrice * taxRate);
  const totalCost = basePrice + taxAndFees;

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!travelDate) {
      newErrors.travelDate = 'Travel date is required';
    } else {
      const pickedDate = new Date(travelDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (pickedDate < today) {
        newErrors.travelDate = 'Travel date cannot be in the past';
      } else if (isDateDisabled(pickedDate)) {
        if (availabilityInfo.type === 'weekends') {
          newErrors.travelDate = 'This experience is only available on weekends';
        } else if (availabilityInfo.type === 'weekdays') {
          newErrors.travelDate = 'This experience is only available on weekdays';
        } else if (availabilityInfo.type === 'specific_dates') {
          newErrors.travelDate = 'This experience is only available on specifically scheduled dates';
        } else {
          newErrors.travelDate = 'Selected date is not available for this experience';
        }
      }
    }

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';

    if (guestsCount < minAllowedGuests) {
      newErrors.guests = `Minimum quota is ${minAllowedGuests} guest(s)`;
    } else if (guestsCount > maxAllowedGuests) {
      newErrors.guests = `Maximum quota is ${maxAllowedGuests} guest(s)`;
    }

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

  // Form submission opens payment method dialog
  const handleOpenPaymentDialog = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setIsPaymentDialogOpen(true);
    }
  };

  // Execute payment through Hoople Payment Gateway
  const handleExecutePayment = async () => {
    if (!validateStep1()) {
      setIsPaymentDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const ref = `AELI-${randomId}-INDO`;
    setBookingRef(ref);

    try {
      const paymentRes = await createPaymentBooking({
        amount: totalCost,
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        paymentMethodId: selectedPaymentMethod,
        programName: selectedTour?.name || 'Indonesian Signature Tour Program',
        experienceName: selectedTour?.category || 'Scenic Tour Experience',
        locationName: selectedTour?.meetingPoint || 'Indonesia',
        pax: guestsCount,
        bookingCode: ref,
        items: [
          {
            id: selectedTour?.id || 'tour-pass',
            name: (selectedTour?.name || 'Tour Ticket').slice(0, 50),
            quantity: guestsCount,
            price: Math.round(totalCost / Math.max(1, guestsCount)),
          },
        ],
      });

      if (paymentRes.success && paymentRes.data?.redirectUrl) {
        // Redirect directly to Hoople Payment / Midtrans SNAP checkout
        window.location.href = paymentRes.data.redirectUrl;
        return;
      }

      // If gateway returned without redirectUrl or fallback:
      const orderId = paymentRes.data?.orderId || ref;
      router.push(`/booking/finish?orderId=${encodeURIComponent(orderId)}&bookingCode=${encodeURIComponent(ref)}`);
    } catch (err) {
      console.error('Error submitting booking transaction:', err);
      setIsPaymentDialogOpen(false);
      setShowSuccessModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              router.push(selectedTour ? `/programs/${selectedTour.id}` : '/programs');
            }}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to program catalog</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display font-medium text-2xl sm:text-3xl text-zinc-900 tracking-tight">
            Complete your booking
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Fill in traveler information and confirm your expedition schedule.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-full flex items-center justify-center text-xs font-medium bg-primary text-white">
              1
            </span>
            <span className="text-xs sm:text-sm font-medium text-zinc-900">
              Traveler details & schedule
            </span>
          </div>

          <div className="w-8 sm:w-12 h-px bg-zinc-200" />

          <div className="flex items-center gap-2">
            <span className="size-6 rounded-full flex items-center justify-center text-xs font-medium bg-zinc-100 text-zinc-400">
              2
            </span>
            <span className="text-xs sm:text-sm font-medium text-zinc-400">
              Hoople Payment Gateway
            </span>
          </div>
        </div>

        {/* Form and Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Checkout Panel (Left) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
            >
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="font-display font-medium text-lg text-zinc-900">
                  Traveler details
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Information used for your official voucher and operator coordination.
                </p>
              </div>

              <form onSubmit={handleOpenPaymentDialog} className="space-y-5">
                {/* Program Selection */}
                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                    <Compass className="size-3.5 text-zinc-400" />
                    <span>Selected expedition program</span>
                  </label>
                  <Select
                    value={selectedTourId}
                    onValueChange={(val) => setSelectedTourId(val || '')}
                    disabled={Boolean(selectedTourId)}
                  >
                    <SelectTrigger
                      disabled={Boolean(selectedTourId)}
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-zinc-800 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-90 disabled:cursor-not-allowed"
                    >
                      <SelectValue placeholder="Select an experience">
                        {selectedTourId
                          ? programsData.find((t) => t.id === selectedTourId)?.name || 'Select an experience'
                          : 'Select an experience'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-zinc-200 shadow-lg rounded-xl p-1 z-50">
                      {programsData.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-zinc-800">
                          {t.name} ({formatPrice(t.price)}/pax)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Travel Date & Guests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {/* Travel Date */}
                  <div className="flex flex-col text-left gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-zinc-400" />
                        <span>Travel date</span>
                      </label>
                      {selectedTour && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                          {availabilityInfo.label}
                        </span>
                      )}
                    </div>

                    <Popover>
                      <PopoverTrigger
                        className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-sm transition-colors text-left bg-zinc-50/70 ${errors.travelDate ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-200'
                          } text-zinc-800 cursor-pointer`}
                      >
                        <span className={travelDate ? 'font-medium text-zinc-900' : 'text-zinc-400'}>
                          {travelDate
                            ? new Date(travelDate).toLocaleDateString(undefined, { dateStyle: 'medium' })
                            : 'Select date'}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50 bg-white border border-zinc-200 shadow-xl rounded-xl">
                        <CalendarComponent
                          mode="single"
                          selected={travelDate ? new Date(travelDate) : undefined}
                          disabled={isDateDisabled}
                          onSelect={(date) => {
                            if (!date) {
                              setTravelDate('');
                              return;
                            }
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setTravelDate(`${year}-${month}-${day}`);
                            if (errors.travelDate) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.travelDate;
                                return next;
                              });
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    <span className="text-[11px] text-zinc-400 leading-tight">
                      {availabilityInfo.description}
                    </span>
                    {errors.travelDate && (
                      <span className="text-rose-500 text-xs font-medium">{errors.travelDate}</span>
                    )}
                  </div>

                  {/* Number of Guests */}
                  <div className="flex flex-col text-left gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                        <Users className="size-3.5 text-zinc-400" />
                        <span>Number of guests</span>
                      </label>
                      {(selectedTour?.minQuota || selectedTour?.maxQuota || selectedTour?.maxGuestMin || selectedTour?.maxGuestMax) ? (
                        <span className="text-[11px] text-zinc-400">
                          Quota: {minAllowedGuests} – {maxAllowedGuests} pax
                        </span>
                      ) : null}
                    </div>

                    <div className="flex h-11 border border-zinc-200 bg-zinc-50/70 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setGuestsCount((prev) => Math.max(minAllowedGuests, prev - 1))}
                        className="w-11 h-full flex items-center justify-center font-medium text-zinc-600 hover:bg-zinc-200/50 transition-colors cursor-pointer"
                      >
                        –
                      </button>
                      <div className="flex-1 h-full flex items-center justify-center font-medium text-zinc-900 text-sm bg-white border-x border-zinc-200 tabular-nums">
                        {guestsCount}
                      </div>
                      <button
                        type="button"
                        onClick={() => setGuestsCount((prev) => Math.min(maxAllowedGuests, prev + 1))}
                        className="w-11 h-full flex items-center justify-center font-medium text-zinc-600 hover:bg-zinc-200/50 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    {errors.guests && (
                      <span className="text-rose-500 text-xs font-medium">{errors.guests}</span>
                    )}
                  </div>
                </div>

                {/* Contact Details Group */}
                <div className="pt-4 border-t border-zinc-100 space-y-4">
                  <h3 className="font-display font-medium text-sm text-zinc-900">
                    Primary contact
                  </h3>

                  {/* Full Name */}
                  <div className="flex flex-col text-left gap-1.5">
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                      <User className="size-3.5 text-zinc-400" />
                      <span>Lead traveler full name</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full h-11 px-3.5 bg-zinc-50/70 rounded-xl border text-sm transition-colors text-zinc-900 ${errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-200'
                        } focus-visible:ring-1 focus-visible:ring-primary`}
                    />
                    {errors.fullName && (
                      <span className="text-rose-500 text-xs font-medium">{errors.fullName}</span>
                    )}
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col text-left gap-1.5">
                      <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                        <Mail className="size-3.5 text-zinc-400" />
                        <span>Email address</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full h-11 px-3.5 bg-zinc-50/70 rounded-xl border text-sm transition-colors text-zinc-900 ${errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-200'
                          } focus-visible:ring-1 focus-visible:ring-primary`}
                      />
                      {errors.email && (
                        <span className="text-rose-500 text-xs font-medium">{errors.email}</span>
                      )}
                    </div>

                    <div className="flex flex-col text-left gap-1.5">
                      <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                        <Phone className="size-3.5 text-zinc-400" />
                        <span>Phone number</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="+62 812-3456-7890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full h-11 px-3.5 bg-zinc-50/70 rounded-xl border text-sm transition-colors text-zinc-900 ${errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-200'
                          } focus-visible:ring-1 focus-visible:ring-primary`}
                      />
                      {errors.phone && (
                        <span className="text-rose-500 text-xs font-medium">{errors.phone}</span>
                      )}
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="flex flex-col text-left gap-1.5">
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 text-zinc-400" />
                      <span>Special requests (optional)</span>
                    </label>
                    <textarea
                      placeholder="Dietary requirements, pickup preferences, or accessibility guidelines..."
                      rows={3}
                      value={specialRequest}
                      onChange={(e) => setSpecialRequest(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 focus:outline-none focus:border-primary focus:bg-white text-sm transition-colors text-zinc-900 resize-none"
                    />
                  </div>

                  {/* Payment Method Selector Tile */}
                  <div className="pt-4 border-t border-zinc-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                        <CreditCard className="size-3.5 text-zinc-400" />
                        <span>Payment channel</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsPaymentDialogOpen(true)}
                        className="text-xs font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
                      >
                        Change channel
                      </button>
                    </div>

                    {/* Interactive Active Method Card */}
                    <div
                      onClick={() => setIsPaymentDialogOpen(true)}
                      className="group p-3.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50/70 hover:bg-zinc-50/90 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-lg bg-white border border-zinc-200/80 text-zinc-800 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-zinc-300 transition-colors">
                          {getMethodIcon(activeMethod.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-900 truncate">
                              {activeMethod.name}
                            </span>
                            {activeMethod.recommended && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {activeMethod.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0">
                        <span className="hidden sm:inline">Select</span>
                        <ChevronRight className="size-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct to Hoople Payment Action */}
                <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <span>Secured by Hoople Payment ({activeMethod.name})</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto h-11 px-6 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm shadow-xs active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Connecting to Hoople Payment...</span>
                      </>
                    ) : (
                      <>
                        <span>Proceed to Payment • {formatPrice(totalCost)}</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Booking Summary Column (Right) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="font-display font-medium text-base text-zinc-900">
                  Reservation summary
                </h3>
              </div>

              {/* Selected Program Preview */}
              {selectedTour && (
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-zinc-100">
                    <Image
                      src={selectedTour.image}
                      alt={selectedTour.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-display font-medium text-sm text-zinc-900 leading-snug">
                      {selectedTour.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-zinc-700">{selectedTour.rating}</span>
                        <span>({selectedTour.reviewsCount})</span>
                      </div>
                      <span>•</span>
                      <span>{availabilityInfo.label}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost ledger */}
              <div className="border-t border-zinc-100 pt-4 space-y-3 text-xs">
                {travelDate && (
                  <div className="flex justify-between text-zinc-500">
                    <span>Date</span>
                    <span className="font-medium text-zinc-800">
                      {new Date(travelDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-500">
                  <span>Price per person</span>
                  <span className="tabular-nums font-medium text-zinc-800">
                    {selectedTour && formatPrice(selectedTour.price)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Guests</span>
                  <span className="font-medium text-zinc-800 tabular-nums">{guestsCount} pax</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-zinc-800 tabular-nums">{formatPrice(basePrice)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Tax (PPN {taxPercent}%)</span>
                  <span className="font-medium text-zinc-800 tabular-nums">{formatPrice(taxAndFees)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 pt-1">
                  <span>Payment channel</span>
                  <button
                    type="button"
                    onClick={() => setIsPaymentDialogOpen(true)}
                    className="font-medium text-zinc-800 hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <span>{activeMethod.name}</span>
                    <span className="text-[10px] text-primary underline underline-offset-2">Change</span>
                  </button>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-zinc-100">
                  <span className="font-display font-medium text-zinc-900 text-sm">Total amount</span>
                  <span className="font-display font-semibold text-lg text-zinc-900 tabular-nums">
                    {formatPrice(totalCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Reassurance note */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-start gap-3">
              <ShieldCheck className="size-4 text-zinc-500 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                Official booking voucher is generated immediately upon confirmation. Full refund available up to 48 hours before departure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT METHOD SELECTION DIALOG */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent
          className="max-w-2xl bg-white rounded-2xl p-6 sm:p-7 shadow-xl border border-zinc-200 space-y-4"
          showCloseButton={true}
        >
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CreditCard className="size-4" />
              </div>
              <div>
                <DialogTitle className="font-display font-medium text-lg text-zinc-900">
                  Select payment method
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-xs sm:text-sm">
                  <span>Choose your preferred channel powered by Hoople Payment (Hoopay) gateway.</span>
                </DialogDescription>
              </div>


            </div>
          </DialogHeader>

          <div className="text-left w-full sm:w-auto">
            <span className="text-xs text-zinc-400 block">Total payment</span>
            <span className="text-base font-semibold text-zinc-900 tabular-nums font-display">
              {formatPrice(totalCost)}
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-100 -mx-1 px-1">
            {PAYMENT_CATEGORIES.map((cat) => {
              const isCurrent = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${isCurrent
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900'
                    }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Channel List */}
          <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 divide-y-0">
            {filteredMethods.map((method) => {
              const isSelected = selectedPaymentMethod === method.id;
              return (
                <div
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                    ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/30 shadow-2xs'
                    : 'border-zinc-200/90 hover:border-zinc-300 bg-white hover:bg-zinc-50/60'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200/60'
                        }`}
                    >
                      {getMethodIcon(method.category)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isSelected ? 'text-zinc-900' : 'text-zinc-800'}`}>
                          {method.name}
                        </span>
                        {method.recommended && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {method.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center pl-2">
                    <div
                      className={`size-5 rounded-full border flex items-center justify-center transition-colors ${isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-zinc-300 bg-white'
                        }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[2.5]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dialog Footer */}
          <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left w-full sm:w-auto">
              {/* <span className="text-xs text-zinc-400 block">Total payment</span>
              <span className="text-base font-semibold text-zinc-900 tabular-nums font-display">
                {formatPrice(totalCost)}
              </span> */}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                className="h-10 px-4 rounded-xl text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex-1 sm:flex-initial"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleExecutePayment}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl text-xs bg-primary hover:bg-primary-dark text-white font-medium flex-1 sm:flex-initial shadow-xs"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-1.5">
                    <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span>Pay with {activeMethod.name}</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS MODAL DIALOG */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent
          className="max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5 border border-zinc-200"
          showCloseButton={false}
        >
          <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-6" />
          </div>

          <DialogHeader className="space-y-1.5 text-center">
            <DialogTitle className="font-display font-medium text-xl text-zinc-900 text-center">
              Booking confirmed
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs sm:text-sm max-w-sm mx-auto text-center">
              Your expedition reservation is locked. A confirmation voucher has been generated.
            </DialogDescription>
          </DialogHeader>

          {/* Clean digital voucher receipt */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <span className="text-zinc-500">Reference code</span>
              <span className="font-mono font-medium text-zinc-900">{bookingRef}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Program</span>
                <span className="font-medium text-zinc-900 text-right max-w-[60%] truncate">
                  {selectedTour?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Schedule date</span>
                <span className="font-medium text-zinc-900">{travelDate || 'Confirmed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Guests</span>
                <span className="font-medium text-zinc-900">{guestsCount} person(s)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200">
                <span className="font-medium text-zinc-700">Total paid</span>
                <span className="font-semibold text-zinc-900 tabular-nums">{formatPrice(totalCost)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <Printer className="size-3.5 text-zinc-500" />
              <span>Print voucher</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/');
              }}
              className="h-10 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl flex items-center justify-center text-xs transition-colors cursor-pointer shadow-xs"
            >
              Return to home
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] w-full flex items-center justify-center">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingFormContent />
    </Suspense>
  );
}
