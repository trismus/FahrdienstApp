import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Patient {
  id?: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  medical_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
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
}

export interface Trip {
  id?: number;
  patient_id: number;
  driver_id?: number;
  pickup_destination_id?: number;
  pickup_address?: string;
  pickup_time: string;
  dropoff_destination_id?: number;
  dropoff_address?: string;
  dropoff_time?: string;
  distance_km?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  patient_name?: string;
  driver_name?: string;
  pickup_destination_name?: string;
  dropoff_destination_name?: string;
}

// Patient API
export const patientAPI = {
  getAll: () => api.get<Patient[]>('/patients'),
  getById: (id: number) => api.get<Patient>(`/patients/${id}`),
  create: (patient: Patient) => api.post<Patient>('/patients', patient),
  update: (id: number, patient: Patient) => api.put<Patient>(`/patients/${id}`, patient),
  delete: (id: number) => api.delete(`/patients/${id}`),
};

// Driver API
export const driverAPI = {
  getAll: () => api.get<Driver[]>('/drivers'),
  getAvailable: () => api.get<Driver[]>('/drivers/available'),
  getById: (id: number) => api.get<Driver>(`/drivers/${id}`),
  create: (driver: Driver) => api.post<Driver>('/drivers', driver),
  update: (id: number, driver: Driver) => api.put<Driver>(`/drivers/${id}`, driver),
  delete: (id: number) => api.delete(`/drivers/${id}`),
};

// Destination API
export const destinationAPI = {
  getAll: () => api.get<Destination[]>('/destinations'),
  getActive: () => api.get<Destination[]>('/destinations/active'),
  getByType: (type: string) => api.get<Destination[]>(`/destinations/type/${type}`),
  getById: (id: number) => api.get<Destination>(`/destinations/${id}`),
  create: (destination: Destination) => api.post<Destination>('/destinations', destination),
  update: (id: number, destination: Destination) => api.put<Destination>(`/destinations/${id}`, destination),
  delete: (id: number) => api.delete(`/destinations/${id}`),
};

// Trip API
export const tripAPI = {
  getAll: () => api.get<Trip[]>('/trips'),
  getByStatus: (status: string) => api.get<Trip[]>(`/trips/status/${status}`),
  getById: (id: number) => api.get<Trip>(`/trips/${id}`),
  create: (trip: Trip) => api.post<Trip>('/trips', trip),
  update: (id: number, trip: Trip) => api.put<Trip>(`/trips/${id}`, trip),
  updateStatus: (id: number, status: string) => api.patch<Trip>(`/trips/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/trips/${id}`),
};

export default api;
