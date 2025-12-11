-- Create tables for Fahrdienst (Medical Transport) App

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    medical_notes TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    license_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50),
    vehicle_registration VARCHAR(20),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destinations table (Arztpraxen, Spitäler, etc.)
CREATE TABLE IF NOT EXISTS destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('hospital', 'clinic', 'practice', 'rehab', 'pharmacy', 'other')),
    address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    contact_person VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    pickup_destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
    pickup_address TEXT,
    pickup_time TIMESTAMP NOT NULL,
    dropoff_destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
    dropoff_address TEXT,
    dropoff_time TIMESTAMP,
    distance_km DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure at least one pickup location is specified
    CONSTRAINT check_pickup_location CHECK (pickup_destination_id IS NOT NULL OR pickup_address IS NOT NULL),
    -- Ensure at least one dropoff location is specified
    CONSTRAINT check_dropoff_location CHECK (dropoff_destination_id IS NOT NULL OR dropoff_address IS NOT NULL)
);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'dispatcher' CHECK (role IN ('admin', 'dispatcher', 'driver')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Driver availability patterns table (recurring weekly patterns, Mo-Fr 08:00-18:00)
-- Patterns define when a driver is GENERALLY available (e.g., "every Monday 08:00-10:00")
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
    CONSTRAINT check_pattern_time_order CHECK (end_time > start_time)
);

-- Driver availability bookings table (actual bookings on specific dates)
-- Bookings track when a pattern is occupied by a trip on a specific date
CREATE TABLE IF NOT EXISTS driver_availability_bookings (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure no overlapping bookings for the same driver on the same date
    CONSTRAINT unique_driver_booking_slot UNIQUE (driver_id, date, start_time, end_time),
    -- Ensure valid time blocks (end_time > start_time)
    CONSTRAINT check_booking_time_order CHECK (end_time > start_time)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_patient_id ON trips(patient_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_pickup_destination_id ON trips(pickup_destination_id);
CREATE INDEX IF NOT EXISTS idx_trips_dropoff_destination_id ON trips(dropoff_destination_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_pickup_time ON trips(pickup_time);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available);
CREATE INDEX IF NOT EXISTS idx_destinations_type ON destinations(type);
CREATE INDEX IF NOT EXISTS idx_destinations_active ON destinations(is_active);
CREATE INDEX IF NOT EXISTS idx_patterns_driver_weekday ON driver_availability_patterns(driver_id, weekday);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_date ON driver_availability_bookings(driver_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON driver_availability_bookings(trip_id);
