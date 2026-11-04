import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketPrice {
  id: string;
  sku: string | null;
  product_name: string;
  category: string;
  subcategory: string | null;
  unit: string;
  unit_price: number;
  min_price: number | null;
  max_price: number | null;
  region: string;
  confidence_score: number;
  last_updated: string;
  is_active: boolean;
}

export interface PriceLookupResult {
  found: boolean;
  price: number;
  unit: string;
  adjustedPrice?: number;
  confidence: number;
  source: string;
  lastUpdated: string;
  alternatives?: Array<{
    name: string;
    price: number;
    unit: string;
  }>;
  priceRange?: {
    min: number;
    max: number;
  };
  message?: string;
}

export interface RegionalAdjustment {
  id: string;
  region: string;
  category: string | null;
  adjustment_factor: number;
  notes: string | null;
}

export const useMarketPrices = (category?: string, enabled = true) => {
  return useQuery({
    queryKey: ["market_prices", category],
    queryFn: async () => {
      let query = supabase
        .from("market_prices")
        .select("*")
        .eq("is_active", true)
        .order("product_name", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MarketPrice[];
    },
    enabled,
    staleTime: 60000, // 1 minute
  });
};

export const useRegionalAdjustments = (enabled = true) => {
  return useQuery({
    queryKey: ["regional_adjustments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regional_adjustments")
        .select("*")
        .order("region", { ascending: true });

      if (error) throw error;
      return (data || []) as RegionalAdjustment[];
    },
    enabled,
    staleTime: 300000, // 5 minutes
  });
};

export const usePriceLookup = () => {
  return useMutation({
    mutationFn: async ({
      trade,
      product,
      quantity,
      region,
      category,
    }: {
      trade?: string;
      product: string;
      quantity?: number;
      region?: string;
      category?: string;
    }): Promise<PriceLookupResult> => {
      const { data, error } = await supabase.functions.invoke("get-latest-price", {
        body: { trade, product, quantity, region, category },
      });

      if (error) throw error;
      return data as PriceLookupResult;
    },
  });
};

export const useRefreshPrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category?: string) => {
      // First update the price index (baseline prices)
      const { data: indexData, error: indexError } = await supabase.functions.invoke(
        "update-price-index",
        { body: {} }
      );

      if (indexError) {
        console.error("Error updating price index:", indexError);
      }

      // Then fetch market prices
      const { data: marketData, error: marketError } = await supabase.functions.invoke(
        "fetch-market-prices",
        { body: { category } }
      );

      if (marketError) throw marketError;

      return {
        indexUpdate: indexData,
        marketUpdate: marketData,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market_prices"] });
    },
  });
};

export const useMarketPriceCategories = (enabled = true) => {
  return useQuery({
    queryKey: ["market_price_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_prices")
        .select("category")
        .eq("is_active", true);

      if (error) throw error;

      // Get unique categories
      const categories = [...new Set((data || []).map((item) => item.category))].sort();
      return categories;
    },
    enabled,
    staleTime: 300000, // 5 minutes
  });
};

// Helper function to get price for a specific product (client-side lookup)
export const getLocalPrice = (
  prices: MarketPrice[],
  productName: string,
  region?: string,
  regionalAdjustments?: RegionalAdjustment[]
): PriceLookupResult => {
  const searchTerm = productName.toLowerCase().trim();
  
  // Find matching prices
  const matches = prices.filter((p) =>
    p.product_name.toLowerCase().includes(searchTerm) ||
    searchTerm.includes(p.product_name.toLowerCase())
  );

  if (matches.length === 0) {
    return {
      found: false,
      price: 0,
      unit: "each",
      confidence: 0,
      source: "none",
      lastUpdated: new Date().toISOString(),
      message: "No pricing data found",
    };
  }

  // Sort by confidence
  matches.sort((a, b) => b.confidence_score - a.confidence_score);
  const bestMatch = matches[0];

  // Apply regional adjustment
  let adjustedPrice = bestMatch.unit_price;
  if (region && regionalAdjustments) {
    const adjustment = regionalAdjustments.find(
      (adj) => adj.region === region && (adj.category === null || adj.category === bestMatch.category)
    );
    if (adjustment) {
      adjustedPrice = bestMatch.unit_price * adjustment.adjustment_factor;
    }
  }

  return {
    found: true,
    price: bestMatch.unit_price,
    unit: bestMatch.unit,
    adjustedPrice: Math.round(adjustedPrice * 100) / 100,
    confidence: bestMatch.confidence_score,
    source: "Local Cache",
    lastUpdated: bestMatch.last_updated,
    priceRange:
      bestMatch.min_price && bestMatch.max_price
        ? {
            min: bestMatch.min_price,
            max: bestMatch.max_price,
          }
        : undefined,
    alternatives: matches.slice(1, 4).map((p) => ({
      name: p.product_name,
      price: p.unit_price,
      unit: p.unit,
    })),
  };
};
