-- Add product_url column to market_prices for direct product links
ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS product_url TEXT;