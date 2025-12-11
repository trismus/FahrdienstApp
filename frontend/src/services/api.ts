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

// Weekly recurring availability pattern (e.g., "every Monday 08:00-10:00")
export interface AvailabilityPattern {
  id?: number;
  driver_id: number;
  weekday: number; // 1=Monday, 2=Tuesday, ..., 5=Friday
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
}

// Specific booking on a date (when a pattern is occupied by a trip)
export interface AvailabilityBooking {
  id?: number;
  driver_id: number;
  date: string;
  start_time: string;
  end_time: string;
  trip_id?: number;
  created_at?: string;
  updated_at?: string;
}

// Available driver response (includes driver info)
export interface AvailableDriver {
  driver_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  first_name: string;
  last_name: string;
  vehicle_type?: string;
  vehicle_registration?: string;
}

export interface TimeBlock {
  start: string;
  end: string;
  label: string;
}

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

// Availability API
export const availabilityAPI = {
  // Patterns (recurring weekly availability)
  getPatternsByDriver: (driverId: number) =>
    api.get<AvailabilityPattern[]>(`/availability/patterns/driver/${driverId}`),
  createPatterns: (patterns: AvailabilityPattern | AvailabilityPattern[]) =>
    api.post<AvailabilityPattern | AvailabilityPattern[]>('/availability/patterns', patterns),
  deletePattern: (id: number) =>
    api.delete(`/availability/patterns/${id}`),
  deleteAllPatterns: (driverId: number) =>
    api.delete(`/availability/patterns/driver/${driverId}`),

  // Bookings (specific date bookings)
  getBookingsByDriver: (driverId: number, startDate?: string, endDate?: string) => {
    let url = `/availability/bookings/driver/${driverId}`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get<AvailabilityBooking[]>(url);
  },
  getBookingsByDate: (date: string) =>
    api.get<AvailabilityBooking[]>(`/availability/bookings/date/${date}`),
  createBooking: (booking: AvailabilityBooking) =>
    api.post<AvailabilityBooking>('/availability/bookings', booking),
  deleteBooking: (id: number) =>
    api.delete(`/availability/bookings/${id}`),
  deleteBookingsByTrip: (tripId: number) =>
    api.delete(`/availability/bookings/trip/${tripId}`),

  // Availability check (combined patterns + bookings)
  getAvailable: (date: string, startTime: string, endTime: string) =>
    api.get<AvailableDriver[]>(`/availability/available?date=${date}&startTime=${startTime}&endTime=${endTime}`),
};

export default api;
