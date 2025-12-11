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
