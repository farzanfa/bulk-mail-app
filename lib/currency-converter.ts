// Currency conversion service for USD to INR
// Uses multiple providers for reliability

interface ConversionRate {
  rate: number;
  timestamp: Date;
  source: string;
}

// Cache the conversion rate for 5 minutes to avoid too many API calls
let cachedRate: ConversionRate | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Fallback rate in case all API calls fail
const FALLBACK_RATE = 83.50; // 1 USD = 83.50 INR (update this periodically)

/**
 * Get live USD to INR conversion rate
 * Uses multiple providers for reliability
 */
export async function getUSDtoINRRate(): Promise<number> {
  // Check cache first
  if (cachedRate && (Date.now() - cachedRate.timestamp.getTime()) < CACHE_DURATION) {
    console.log(`Using cached rate: 1 USD = ${cachedRate.rate} INR (from ${cachedRate.source})`);
    return cachedRate.rate;
  }

  // Try primary provider: ExchangeRate-API (free tier)
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates.INR;
      
      if (rate && typeof rate === 'number') {
        cachedRate = {
          rate,
          timestamp: new Date(),
          source: 'ExchangeRate-API'
        };
        console.log(`Fresh rate from ExchangeRate-API: 1 USD = ${rate} INR`);
        return rate;
      }
    }
  } catch (error) {
    console.error('ExchangeRate-API failed:', error);
  }

  // Try secondary provider: Fixer.io alternative (no API key required)
  try {
    const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      const rate = data.usd.inr;
      
      if (rate && typeof rate === 'number') {
        cachedRate = {
          rate,
          timestamp: new Date(),
          source: 'Currency-API'
        };
        console.log(`Fresh rate from Currency-API: 1 USD = ${rate} INR`);
        return rate;
      }
    }
  } catch (error) {
    console.error('Currency-API failed:', error);
  }

  // If all APIs fail, use fallback rate
  console.warn(`All currency APIs failed. Using fallback rate: 1 USD = ${FALLBACK_RATE} INR`);
  cachedRate = {
    rate: FALLBACK_RATE,
    timestamp: new Date(),
    source: 'Fallback'
  };
  
  return FALLBACK_RATE;
}

/**
 * Convert USD to INR using live rates
 * @param usdAmount Amount in USD
 * @returns Amount in INR (rounded to 2 decimal places)
 */
export async function convertUSDtoINR(usdAmount: number): Promise<number> {
  const rate = await getUSDtoINRRate();
  const inrAmount = usdAmount * rate;
  
  // Round to 2 decimal places
  return Math.round(inrAmount * 100) / 100;
}

/**
 * Format INR amount for Razorpay (convert to paise)
 * @param inrAmount Amount in INR
 * @returns Amount in paise (smallest unit)
 */
export function formatForRazorpay(inrAmount: number): number {
  return Math.round(inrAmount * 100);
}

/**
 * Get formatted price strings for display
 */
export async function getFormattedPrices(usdAmount: number): Promise<{
  usd: string;
  inr: string;
  rate: number;
  rateSource: string;
}> {
  const rate = await getUSDtoINRRate();
  const inrAmount = await convertUSDtoINR(usdAmount);
  
  return {
    usd: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(usdAmount),
    inr: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(inrAmount),
    rate,
    rateSource: cachedRate?.source || 'Unknown'
  };
}