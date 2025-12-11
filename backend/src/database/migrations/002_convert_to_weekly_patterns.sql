-- Migration: Convert availability blocks to weekly recurring patterns
-- Changes date-specific blocks to weekday-based patterns that repeat every week

-- Create new table for recurring weekly availability patterns
CREATE TABLE IF NOT EXISTS driver_availability_patterns (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    weekday INTEGER NOT NULL CHECK (weekday >= 1 AND weekday <= 5), -- 1=Monday, 2=Tuesday, ..., 5=Friday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure no duplicate patterns for the same driver, weekday, and time
    CONSTRAINT unique_driver_weekday_time_slot UNIQUE (driver_id, weekday, start_time, end_time),
    -- Ensure valid time blocks (end_time > start_time)
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patterns_driver_weekday ON driver_availability_patterns(driver_id, weekday);

-- Rename old table to keep track of actual bookings (occupied blocks with specific dates)
ALTER TABLE driver_availability_blocks RENAME TO driver_availability_bookings;

-- Drop the old indexes
DROP INDEX IF EXISTS idx_availability_driver_date;
DROP INDEX IF EXISTS idx_availability_occupied;
DROP INDEX IF EXISTS idx_availability_trip;

-- Recreate indexes with new names
CREATE INDEX IF NOT EXISTS idx_bookings_driver_date ON driver_availability_bookings(driver_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_occupied ON driver_availability_bookings(is_occupied);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON driver_availability_bookings(trip_id);

-- Note: This migration should be run on the database
-- Run with: docker exec -i fahrdienst-db psql -U postgres -d fahrdienst_db < backend/src/database/migrations/002_convert_to_weekly_patterns.sql
