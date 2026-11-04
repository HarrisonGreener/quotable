-- Add duration_hours column to schedules table for sub-day scheduling
ALTER TABLE schedules ADD COLUMN duration_hours INTEGER DEFAULT 1;

-- Add comment explaining the column
COMMENT ON COLUMN schedules.duration_hours IS 'Duration of the job in hours (1-24). Used for scheduling multiple jobs per day with specific time slots.';