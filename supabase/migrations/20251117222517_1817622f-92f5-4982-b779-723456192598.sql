-- Add start_time column to schedules table
ALTER TABLE public.schedules 
ADD COLUMN start_time TIME DEFAULT '09:00:00';

-- Add comment to explain the column
COMMENT ON COLUMN public.schedules.start_time IS 'Start time for the scheduled job';