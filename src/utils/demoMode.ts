// Demo mode utilities for persistent localStorage-based demo data

const DEMO_DATA_KEY = 'quotable_demo_data';
const DEMO_EXPIRY_KEY = 'quotable_demo_expiry';
const DEMO_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface DemoData {
  quotes: any[];
  invoices: any[];
  inventory?: any[];
  stats: {
    totalQuotes: number;
    totalInvoices: number;
    revenue: number;
    outstanding: number;
    taxCollected: number;
  };
}

export const getDemoData = (): DemoData | null => {
  try {
    const expiry = localStorage.getItem(DEMO_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry)) {
      clearDemoData();
      return null;
    }
    
    const data = localStorage.getItem(DEMO_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setDemoData = (data: DemoData) => {
  try {
    localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data));
    localStorage.setItem(DEMO_EXPIRY_KEY, (Date.now() + DEMO_DURATION).toString());
  } catch (error) {
    console.error('Failed to save demo data:', error);
  }
};

export const clearDemoData = () => {
  localStorage.removeItem(DEMO_DATA_KEY);
  localStorage.removeItem(DEMO_EXPIRY_KEY);
};

export const isDemoMode = (searchParams: URLSearchParams): boolean => {
  return searchParams.get("demo") === "true";
};
