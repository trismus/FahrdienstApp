import { useEffect, useState } from 'react';
import { tripAPI, patientAPI, driverAPI, type Trip, type Patient, type Driver } from '../services/api';

function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<Trip>({
    patient_id: 0,
    driver_id: undefined,
    pickup_address: '',
    pickup_time: '',
    dropoff_address: '',
    dropoff_time: '',
    distance_km: undefined,
    status: 'scheduled',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tripsRes, patientsRes, driversRes] = await Promise.all([
        tripAPI.getAll(),
        patientAPI.getAll(),
        driverAPI.getAll(),
      ]);
      setTrips(tripsRes.data);
      setPatients(patientsRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTrip) {
        await tripAPI.update(editingTrip.id!, formData);
      } else {
        await tripAPI.create(formData);
      }
      loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      patient_id: trip.patient_id,
      driver_id: trip.driver_id,
      pickup_address: trip.pickup_address,
      pickup_time: trip.pickup_time.slice(0, 16),
      dropoff_address: trip.dropoff_address,
      dropoff_time: trip.dropoff_time ? trip.dropoff_time.slice(0, 16) : '',
      distance_km: trip.distance_km,
      status: trip.status,
      notes: trip.notes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await tripAPI.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting trip:', error);
      }
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await tripAPI.updateStatus(id, status);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: 0,
      driver_id: undefined,
      pickup_address: '',
      pickup_time: '',
      dropoff_address: '',
      dropoff_time: '',
      distance_km: undefined,
      status: 'scheduled',
      notes: '',
    });
    setEditingTrip(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Loading trips...</div>;
  }

  return (
    <div className="trips-page">
      <div className="page-header">
        <h2>Trips</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Schedule Trip'}
        </button>
      </div>

      {showForm && (
        <form className="trip-form" onSubmit={handleSubmit}>
          <h3>{editingTrip ? 'Edit Trip' : 'New Trip'}</h3>
          <div className="form-grid">
            <select
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: parseInt(e.target.value) })}
              required
            >
              <option value="">Select Patient *</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
            <select
              value={formData.driver_id || ''}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">Select Driver (Optional)</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.first_name} {driver.last_name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Pickup Address *"
              value={formData.pickup_address}
              onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              placeholder="Pickup Time *"
              value={formData.pickup_time}
              onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Dropoff Address *"
              value={formData.dropoff_address}
              onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              placeholder="Dropoff Time"
              value={formData.dropoff_time}
              onChange={(e) => setFormData({ ...formData, dropoff_time: e.target.value })}
            />
            <input
              type="number"
              step="0.1"
              placeholder="Distance (km)"
              value={formData.distance_km || ''}
              onChange={(e) => setFormData({ ...formData, distance_km: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Trip['status'] })}
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingTrip ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Driver</th>
            <th>Pickup Time</th>
            <th>Pickup Address</th>
            <th>Dropoff Address</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td>{trip.patient_name}</td>
              <td>{trip.driver_name || 'Unassigned'}</td>
              <td>{new Date(trip.pickup_time).toLocaleString()}</td>
              <td>{trip.pickup_address}</td>
              <td>{trip.dropoff_address}</td>
              <td>
                <select
                  className={`status-select status-${trip.status}`}
                  value={trip.status}
                  onChange={(e) => handleStatusChange(trip.id!, e.target.value)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => handleEdit(trip)}>
                  Edit
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(trip.id!)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Trips;
