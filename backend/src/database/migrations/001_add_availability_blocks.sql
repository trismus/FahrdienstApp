-- Migration: Add driver availability blocks table
-- This migration adds support for 2-hour availability blocks (Mo-Fr 08:00-18:00)

-- Create the availability blocks table
CREATE TABLE IF NOT EXISTS driver_availability_blocks (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_occupied BOOLEAN DEFAULT false,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure no overlapping blocks for the same driver on the same date
    CONSTRAINT unique_driver_time_slot UNIQUE (driver_id, date, start_time, end_time),
    -- Ensure valid time blocks (end_time > start_time)
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_availability_driver_date ON driver_availability_blocks(driver_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_occupied ON driver_availability_blocks(is_occupied);
CREATE INDEX IF NOT EXISTS idx_availability_trip ON driver_availability_blocks(trip_id);

-- Note: This migration should be run on the database to add the new table
-- Run with: psql -U postgres -d fahrdienst -f 001_add_availability_blocks.sql
