-- Migration: Add appointment times and recurring trip series
-- Extends trips with appointment time and return pickup support
-- Adds support for recurring trip series (e.g., "every Monday and Friday for 4 weeks")

-- Step 1: Add new columns to trips table
ALTER TABLE trips
ADD COLUMN appointment_time TIMESTAMP,
ADD COLUMN appointment_destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
ADD COLUMN appointment_address TEXT,
ADD COLUMN return_pickup_time TIMESTAMP,
ADD COLUMN return_pickup_destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
ADD COLUMN return_pickup_address TEXT,
ADD COLUMN return_driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
ADD COLUMN recurring_trip_id INTEGER;

-- Step 2: Add comments for clarity
COMMENT ON COLUMN trips.pickup_time IS 'Initial pickup time (start of trip)';
COMMENT ON COLUMN trips.appointment_time IS 'Appointment time at destination (e.g., doctor appointment)';
COMMENT ON COLUMN trips.return_pickup_time IS 'Optional: Pickup time for return trip after appointment';
COMMENT ON COLUMN trips.return_driver_id IS 'Optional: Different driver for return trip';

-- Step 3: Create recurring_trips table for series management
CREATE TABLE IF NOT EXISTS recurring_trips (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Pattern configuration
    recurrence_pattern VARCHAR(20) NOT NULL CHECK (recurrence_pattern IN ('weekly', 'biweekly', 'monthly')),
    weekdays INTEGER[] NOT NULL, -- Array of weekdays: 1=Monday, 2=Tuesday, ..., 7=Sunday
    start_date DATE NOT NULL,
    end_date DATE, -- NULL means indefinite
    occurrences INTEGER, -- Alternative to end_date: "repeat 10 times"

    -- Trip template (will be copied to each instance)
    pickup_destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
    pickup_address TEXT,
    pickup_time_of_day TIME NOT NULL, -- Time of day (e.g., 08:30)

    appointment_destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
    appointment_address TEXT,
    appointment_time_offset INTERVAL, -- Offset from pickup (e.g., '+1 hour')

    dropoff_destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
    dropoff_address TEXT,

    -- Optional return trip
    has_return BOOLEAN DEFAULT false,
    return_pickup_time_offset INTERVAL, -- Offset from appointment (e.g., '+2 hours')
    return_pickup_destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
    return_pickup_address TEXT,

    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_pickup_location_recurring CHECK (pickup_destination_id IS NOT NULL OR pickup_address IS NOT NULL),
    CONSTRAINT check_appointment_location CHECK (appointment_destination_id IS NOT NULL OR appointment_address IS NOT NULL),
    CONSTRAINT check_end_condition CHECK (end_date IS NOT NULL OR occurrences IS NOT NULL),
    CONSTRAINT check_weekdays_not_empty CHECK (array_length(weekdays, 1) > 0)
);

-- Step 4: Add foreign key from trips to recurring_trips
ALTER TABLE trips
ADD CONSTRAINT fk_trips_recurring_trip
FOREIGN KEY (recurring_trip_id)
REFERENCES recurring_trips(id)
ON DELETE SET NULL;

-- Step 5: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_appointment_time ON trips(appointment_time);
CREATE INDEX IF NOT EXISTS idx_trips_return_pickup_time ON trips(return_pickup_time);
CREATE INDEX IF NOT EXISTS idx_trips_recurring_trip ON trips(recurring_trip_id);
CREATE INDEX IF NOT EXISTS idx_recurring_trips_patient ON recurring_trips(patient_id);
CREATE INDEX IF NOT EXISTS idx_recurring_trips_active ON recurring_trips(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_trips_dates ON recurring_trips(start_date, end_date);

-- Step 6: Create function to generate trip instances from recurring pattern
CREATE OR REPLACE FUNCTION generate_recurring_trip_instances(
    p_recurring_trip_id INTEGER,
    p_generate_until DATE DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_recurring_trip recurring_trips%ROWTYPE;
    v_current_date DATE;
    v_end_date DATE;
    v_weekday INTEGER;
    v_instances_created INTEGER := 0;
    v_occurrence_count INTEGER := 0;
BEGIN
    -- Get recurring trip details
    SELECT * INTO v_recurring_trip
    FROM recurring_trips
    WHERE id = p_recurring_trip_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recurring trip % not found or not active', p_recurring_trip_id;
    END IF;

    -- Determine end date for generation
    v_end_date := COALESCE(
        p_generate_until,
        v_recurring_trip.end_date,
        v_recurring_trip.start_date + INTERVAL '1 year' -- Default: 1 year
    );

    -- Start from the start_date
    v_current_date := v_recurring_trip.start_date;

    -- Loop through dates until end_date
    WHILE v_current_date <= v_end_date LOOP
        -- Get weekday (1=Monday, 7=Sunday using ISODOW)
        v_weekday := EXTRACT(ISODOW FROM v_current_date);

        -- Check if this weekday is in the pattern
        IF v_weekday = ANY(v_recurring_trip.weekdays) THEN
            -- Check if we've reached occurrence limit
            IF v_recurring_trip.occurrences IS NOT NULL AND
               v_occurrence_count >= v_recurring_trip.occurrences THEN
                EXIT;
            END IF;

            -- Check if trip for this date doesn't already exist
            IF NOT EXISTS (
                SELECT 1 FROM trips
                WHERE recurring_trip_id = p_recurring_trip_id
                AND DATE(pickup_time) = v_current_date
            ) THEN
                -- Create trip instance
                INSERT INTO trips (
                    patient_id,
                    recurring_trip_id,
                    pickup_destination_id,
                    pickup_address,
                    pickup_time,
                    appointment_destination_id,
                    appointment_address,
                    appointment_time,
                    dropoff_destination_id,
                    dropoff_address,
                    return_pickup_time,
                    return_pickup_destination_id,
                    return_pickup_address,
                    notes,
                    status
                ) VALUES (
                    v_recurring_trip.patient_id,
                    p_recurring_trip_id,
                    v_recurring_trip.pickup_destination_id,
                    v_recurring_trip.pickup_address,
                    v_current_date + v_recurring_trip.pickup_time_of_day,
                    v_recurring_trip.appointment_destination_id,
                    v_recurring_trip.appointment_address,
                    CASE
                        WHEN v_recurring_trip.appointment_time_offset IS NOT NULL
                        THEN v_current_date + v_recurring_trip.pickup_time_of_day + v_recurring_trip.appointment_time_offset
                        ELSE NULL
                    END,
                    v_recurring_trip.dropoff_destination_id,
                    v_recurring_trip.dropoff_address,
                    CASE
                        WHEN v_recurring_trip.has_return AND v_recurring_trip.return_pickup_time_offset IS NOT NULL
                        THEN v_current_date + v_recurring_trip.pickup_time_of_day +
                             COALESCE(v_recurring_trip.appointment_time_offset, INTERVAL '0') +
                             v_recurring_trip.return_pickup_time_offset
                        ELSE NULL
                    END,
                    v_recurring_trip.return_pickup_destination_id,
                    v_recurring_trip.return_pickup_address,
                    v_recurring_trip.notes,
                    'scheduled'
                );

                v_instances_created := v_instances_created + 1;
                v_occurrence_count := v_occurrence_count + 1;
            END IF;
        END IF;

        -- Move to next day
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;

    RETURN v_instances_created;
END;
$$ LANGUAGE plpgsql;

-- Note: Run this migration with:
-- docker exec -i fahrdienst-db psql -U postgres -d fahrdienst_db < backend/src/database/migrations/003_add_appointments_and_recurring_trips.sql
