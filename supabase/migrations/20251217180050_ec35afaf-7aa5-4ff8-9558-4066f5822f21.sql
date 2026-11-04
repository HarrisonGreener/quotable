-- Create crawl_queue table for sitemap-discovered URLs
CREATE TABLE public.crawl_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  supplier TEXT NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 50,
  last_crawled TIMESTAMP WITH TIME ZONE,
  crawl_status TEXT DEFAULT 'pending',
  product_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient queue processing
CREATE INDEX idx_crawl_queue_status_priority ON public.crawl_queue(crawl_status, priority DESC, last_crawled ASC NULLS FIRST);
CREATE INDEX idx_crawl_queue_supplier ON public.crawl_queue(supplier);

-- Enable RLS
ALTER TABLE public.crawl_queue ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view queue (for admin monitoring)
CREATE POLICY "Authenticated users can view crawl queue"
ON public.crawl_queue
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_crawl_queue_updated_at
BEFORE UPDATE ON public.crawl_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();