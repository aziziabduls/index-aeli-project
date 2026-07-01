'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'IDR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceInIDR: number) => string;
  exchangeRate: number; // 1 USD = 15000 IDR
  convertToCurrent: (priceInIDR: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('IDR');
  
  useEffect(() => {
    const saved = localStorage.getItem('index_aeli_currency') as Currency;
    if (saved === 'IDR' || saved === 'USD') {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('index_aeli_currency', curr);
  };

  const exchangeRate = 15000;

  const convertToCurrent = (priceInIDR: number) => {
    if (currency === 'USD') {
      return Math.round(priceInIDR / exchangeRate);
    }
    return priceInIDR;
  };

  const formatPrice = (priceInIDR: number) => {
    if (currency === 'USD') {
      const usdPrice = Math.round(priceInIDR / exchangeRate);
      return `$${usdPrice.toLocaleString('en-US')}`;
    }
    return `Rp ${priceInIDR.toLocaleString('id-ID')}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, exchangeRate, convertToCurrent }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
