export interface Patient {
  id?: number;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  phone?: string;
  email?: string;
  address?: string; // Deprecated - use structured fields below
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  medical_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Driver {
  id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  license_number: string;
  vehicle_type?: string;
  vehicle_registration?: string;
  is_available?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Destination {
  id?: number;
  name: string;
  type: 'hospital' | 'clinic' | 'practice' | 'rehab' | 'pharmacy' | 'other';
  address?: string; // Deprecated - use structured fields below
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Trip {
  id?: number;
  patient_id: number;
  driver_id?: number;
  recurring_trip_id?: number;

  // Initial pickup (to destination)
  pickup_destination_id?: number;
  pickup_address?: string;
  pickup_time: Date;

  // Appointment at destination
  appointment_destination_id?: number;
  appointment_address?: string;
  appointment_time?: Date;

  // Final dropoff (after appointment)
  dropoff_destination_id?: number;
  dropoff_address?: string;
  dropoff_time?: Date;

  // Optional return pickup (separate return trip)
  return_pickup_time?: Date;
  return_pickup_destination_id?: number;
  return_pickup_address?: string;
  return_driver_id?: number;

  // Metadata
  distance_km?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface RecurringTrip {
  id?: number;
  patient_id: number;

  // Pattern configuration
  recurrence_pattern: 'weekly' | 'biweekly' | 'monthly';
  weekdays: number[]; // 1=Monday, 2=Tuesday, ..., 7=Sunday
  start_date: Date;
  end_date?: Date; // NULL means indefinite
  occurrences?: number; // Alternative to end_date

  // Trip template
  pickup_destination_id?: number;
  pickup_address?: string;
  pickup_time_of_day: string; // TIME format 'HH:MM:SS'

  appointment_destination_id?: number;
  appointment_address?: string;
  appointment_time_offset?: string; // INTERVAL format (e.g., '1 hour')

  dropoff_destination_id?: number;
  dropoff_address?: string;

  // Optional return trip
  has_return?: boolean;
  return_pickup_time_offset?: string; // INTERVAL format
  return_pickup_destination_id?: number;
  return_pickup_address?: string;

  // Metadata
  notes?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  password_hash?: string; // Only for DB, not exposed in API responses
  role?: 'admin' | 'dispatcher' | 'driver';
  driver_id?: number; // FK to drivers table, required for role='driver'
  created_at?: Date;
  updated_at?: Date;
}

// Weekly recurring availability pattern (e.g., "every Monday 08:00-10:00")
export interface DriverAvailabilityPattern {
  id?: number;
  driver_id: number;
  weekday: number; // 1=Monday, 2=Tuesday, ..., 5=Friday
  start_time: string; // TIME in format 'HH:MM:SS'
  end_time: string;   // TIME in format 'HH:MM:SS'
  created_at?: Date;
  updated_at?: Date;
}

// Specific booking on a date (when a pattern is occupied by a trip)
export interface DriverAvailabilityBooking {
  id?: number;
  driver_id: number;
  date: Date;
  start_time: string; // TIME in format 'HH:MM:SS'
  end_time: string;   // TIME in format 'HH:MM:SS'
  trip_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

// Helper type for the standard 2-hour blocks (Mo-Fr 08:00-18:00)
export type TimeBlock = {
  start: string;
  end: string;
  label: string;
};

export const STANDARD_TIME_BLOCKS: TimeBlock[] = [
  { start: '08:00:00', end: '10:00:00', label: '08:00 - 10:00' },
  { start: '10:00:00', end: '12:00:00', label: '10:00 - 12:00' },
  { start: '12:00:00', end: '14:00:00', label: '12:00 - 14:00' },
  { start: '14:00:00', end: '16:00:00', label: '14:00 - 16:00' },
  { start: '16:00:00', end: '18:00:00', label: '16:00 - 18:00' }
];

export const WEEKDAYS = [
  { value: 1, label: 'Montag', short: 'Mo' },
  { value: 2, label: 'Dienstag', short: 'Di' },
  { value: 3, label: 'Mittwoch', short: 'Mi' },
  { value: 4, label: 'Donnerstag', short: 'Do' },
  { value: 5, label: 'Freitag', short: 'Fr' }
];
