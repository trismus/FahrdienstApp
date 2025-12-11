export interface Patient {
  id?: number;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  phone?: string;
  email?: string;
  address?: string;
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
  address: string;
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
  pickup_destination_id?: number;
  pickup_address?: string;
  pickup_time: Date;
  dropoff_destination_id?: number;
  dropoff_address?: string;
  dropoff_time?: Date;
  distance_km?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  password_hash: string;
  role?: 'admin' | 'dispatcher' | 'driver';
  created_at?: Date;
  updated_at?: Date;
}
