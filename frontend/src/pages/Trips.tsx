import { useEffect, useState } from 'react';
import { tripAPI, patientAPI, driverAPI, destinationAPI, type Trip, type Patient, type Driver, type Destination } from '../services/api';

function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [usePickupDestination, setUsePickupDestination] = useState(true);
  const [useDropoffDestination, setUseDropoffDestination] = useState(true);
  const [formData, setFormData] = useState<Trip>({
    patient_id: 0,
    driver_id: undefined,
    pickup_destination_id: undefined,
    pickup_address: '',
    pickup_time: '',
    dropoff_destination_id: undefined,
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
      const [tripsRes, patientsRes, driversRes, destinationsRes] = await Promise.all([
        tripAPI.getAll(),
        patientAPI.getAll(),
        driverAPI.getAll(),
        destinationAPI.getActive(),
      ]);
      setTrips(tripsRes.data);
      setPatients(patientsRes.data);
      setDrivers(driversRes.data);
      setDestinations(destinationsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data based on selection
      const tripData = {
        ...formData,
        pickup_destination_id: usePickupDestination ? formData.pickup_destination_id : undefined,
        pickup_address: usePickupDestination ? undefined : formData.pickup_address,
        dropoff_destination_id: useDropoffDestination ? formData.dropoff_destination_id : undefined,
        dropoff_address: useDropoffDestination ? undefined : formData.dropoff_address,
      };

      if (editingTrip) {
        await tripAPI.update(editingTrip.id!, tripData);
      } else {
        await tripAPI.create(tripData);
      }
      loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setUsePickupDestination(!!trip.pickup_destination_id);
    setUseDropoffDestination(!!trip.dropoff_destination_id);
    setFormData({
      patient_id: trip.patient_id,
      driver_id: trip.driver_id,
      pickup_destination_id: trip.pickup_destination_id,
      pickup_address: trip.pickup_address || '',
      pickup_time: trip.pickup_time.slice(0, 16),
      dropoff_destination_id: trip.dropoff_destination_id,
      dropoff_address: trip.dropoff_address || '',
      dropoff_time: trip.dropoff_time ? trip.dropoff_time.slice(0, 16) : '',
      distance_km: trip.distance_km,
      status: trip.status,
      notes: trip.notes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Möchten Sie diese Fahrt wirklich löschen?')) {
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
      pickup_destination_id: undefined,
      pickup_address: '',
      pickup_time: '',
      dropoff_destination_id: undefined,
      dropoff_address: '',
      dropoff_time: '',
      distance_km: undefined,
      status: 'scheduled',
      notes: '',
    });
    setUsePickupDestination(true);
    setUseDropoffDestination(true);
    setEditingTrip(null);
    setShowForm(false);
  };

  const getDestinationName = (destinationId?: number) => {
    if (!destinationId) return null;
    const dest = destinations.find(d => d.id === destinationId);
    return dest ? dest.name : null;
  };

  if (loading) {
    return <div className="loading">Lade Fahrten...</div>;
  }

  return (
    <div className="trips-page">
      <div className="page-header">
        <h2>Fahrten</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : 'Neue Fahrt'}
        </button>
      </div>

      {showForm && (
        <form className="trip-form" onSubmit={handleSubmit}>
          <h3>{editingTrip ? 'Fahrt bearbeiten' : 'Neue Fahrt'}</h3>
          <div className="form-grid">
            <select
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: parseInt(e.target.value) })}
              required
            >
              <option value="">Patient auswählen *</option>
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
              <option value="">Fahrer auswählen (Optional)</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.first_name} {driver.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup Location */}
          <div className="location-section">
            <h4>Abholung</h4>
            <div className="form-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={usePickupDestination}
                  onChange={(e) => setUsePickupDestination(e.target.checked)}
                />
                Gespeichertes Ziel verwenden
              </label>
            </div>
            <div className="form-grid">
              {usePickupDestination ? (
                <select
                  value={formData.pickup_destination_id || ''}
                  onChange={(e) => setFormData({ ...formData, pickup_destination_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  required={usePickupDestination}
                >
                  <option value="">Abholort (Ziel) auswählen *</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name} - {dest.address}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Abholadresse *"
                  value={formData.pickup_address}
                  onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                  required={!usePickupDestination}
                />
              )}
              <input
                type="datetime-local"
                placeholder="Abholzeit *"
                value={formData.pickup_time}
                onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Dropoff Location */}
          <div className="location-section">
            <h4>Zielort</h4>
            <div className="form-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useDropoffDestination}
                  onChange={(e) => setUseDropoffDestination(e.target.checked)}
                />
                Gespeichertes Ziel verwenden
              </label>
            </div>
            <div className="form-grid">
              {useDropoffDestination ? (
                <select
                  value={formData.dropoff_destination_id || ''}
                  onChange={(e) => setFormData({ ...formData, dropoff_destination_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  required={useDropoffDestination}
                >
                  <option value="">Zielort auswählen *</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name} - {dest.address}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Zieladresse *"
                  value={formData.dropoff_address}
                  onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
                  required={!useDropoffDestination}
                />
              )}
              <input
                type="datetime-local"
                placeholder="Ankunftszeit"
                value={formData.dropoff_time}
                onChange={(e) => setFormData({ ...formData, dropoff_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid">
            <input
              type="number"
              step="0.1"
              placeholder="Distanz (km)"
              value={formData.distance_km || ''}
              onChange={(e) => setFormData({ ...formData, distance_km: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Trip['status'] })}
            >
              <option value="scheduled">Geplant</option>
              <option value="in_progress">In Fahrt</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Abgebrochen</option>
            </select>
          </div>
          <textarea
            placeholder="Notizen"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingTrip ? 'Aktualisieren' : 'Erstellen'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Fahrer</th>
            <th>Abholzeit</th>
            <th>Von</th>
            <th>Nach</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td>{trip.patient_name}</td>
              <td>{trip.driver_name || 'Nicht zugewiesen'}</td>
              <td>{new Date(trip.pickup_time).toLocaleString('de-DE')}</td>
              <td>
                {trip.pickup_destination_id ? (
                  <strong>{getDestinationName(trip.pickup_destination_id)}</strong>
                ) : (
                  trip.pickup_address
                )}
              </td>
              <td>
                {trip.dropoff_destination_id ? (
                  <strong>{getDestinationName(trip.dropoff_destination_id)}</strong>
                ) : (
                  trip.dropoff_address
                )}
              </td>
              <td>
                <select
                  className={`status-select status-${trip.status}`}
                  value={trip.status}
                  onChange={(e) => handleStatusChange(trip.id!, e.target.value)}
                >
                  <option value="scheduled">Geplant</option>
                  <option value="in_progress">In Fahrt</option>
                  <option value="completed">Abgeschlossen</option>
                  <option value="cancelled">Abgebrochen</option>
                </select>
              </td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => handleEdit(trip)}>
                  Bearbeiten
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(trip.id!)}>
                  Löschen
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
