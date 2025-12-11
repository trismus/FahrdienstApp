import { useEffect, useState } from 'react';
import { tripAPI, patientAPI, destinationAPI, availabilityAPI, type Trip, type Patient, type Destination, type AvailableDriver } from '../services/api';

function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableDriversList, setAvailableDriversList] = useState<AvailableDriver[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [usePickupDestination, setUsePickupDestination] = useState(false);
  const [useAppointmentDestination, setUseAppointmentDestination] = useState(true);
  const [useDropoffDestination, setUseDropoffDestination] = useState(false);
  const [useReturnPickupDestination, setUseReturnPickupDestination] = useState(false);
  const [hasReturn, setHasReturn] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');
  const [formData, setFormData] = useState<Trip>({
    patient_id: 0,
    driver_id: undefined,
    pickup_destination_id: undefined,
    pickup_address: '',
    pickup_time: '',
    appointment_destination_id: undefined,
    appointment_address: '',
    appointment_time: '',
    dropoff_destination_id: undefined,
    dropoff_address: '',
    dropoff_time: '',
    return_pickup_time: '',
    return_pickup_destination_id: undefined,
    return_pickup_address: '',
    return_driver_id: undefined,
    distance_km: undefined,
    status: 'scheduled',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.pickup_time) {
      loadAvailableDrivers();
    }
  }, [formData.pickup_time]);

  // Auto-fill pickup and dropoff addresses when patient is selected
  useEffect(() => {
    if (formData.patient_id && patients.length > 0) {
      const selectedPatient = patients.find(p => p.id === formData.patient_id);
      if (selectedPatient) {
        const patientAddress = formatAddress(selectedPatient);
        if (patientAddress) {
          setFormData(prev => ({
            ...prev,
            pickup_address: !prev.pickup_destination_id ? patientAddress : prev.pickup_address,
            dropoff_address: !prev.dropoff_destination_id ? patientAddress : prev.dropoff_address,
          }));
        }
      }
    }
  }, [formData.patient_id, patients]);

  // Auto-fill return pickup address when appointment location changes and hasReturn is true
  useEffect(() => {
    if (hasReturn) {
      if (formData.appointment_destination_id && destinations.length > 0 && !useReturnPickupDestination) {
        const appointmentDest = destinations.find(d => d.id === formData.appointment_destination_id);
        if (appointmentDest) {
          const appointmentAddress = formatAddress(appointmentDest);
          setFormData(prev => ({
            ...prev,
            return_pickup_address: appointmentAddress,
          }));
        }
      } else if (formData.appointment_address && !useReturnPickupDestination) {
        setFormData(prev => ({
          ...prev,
          return_pickup_address: formData.appointment_address,
        }));
      } else if (formData.appointment_destination_id && useReturnPickupDestination) {
        setFormData(prev => ({
          ...prev,
          return_pickup_destination_id: formData.appointment_destination_id,
        }));
      }
    }
  }, [hasReturn, formData.appointment_destination_id, formData.appointment_address, destinations, useReturnPickupDestination]);

  const loadData = async () => {
    try {
      const [tripsRes, patientsRes, destinationsRes] = await Promise.all([
        tripAPI.getAll(),
        patientAPI.getAll(),
        destinationAPI.getActive(),
      ]);
      setTrips(tripsRes.data);
      setPatients(patientsRes.data);
      setDestinations(destinationsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (item: Patient | Destination) => {
    if (item.street && item.house_number) {
      return `${item.street} ${item.house_number}, ${item.postal_code || ''} ${item.city || ''}`.trim();
    }
    return (item as any).address || '';
  };

  const loadAvailableDrivers = async () => {
    if (!formData.pickup_time) {
      setAvailableDriversList([]);
      setAvailabilityMessage('');
      return;
    }

    try {
      const pickupDate = new Date(formData.pickup_time);
      const date = pickupDate.toISOString().split('T')[0];
      const time = pickupDate.toTimeString().split(' ')[0];

      // Get available drivers for this date and time
      const response = await availabilityAPI.getAvailable(date, time, time);
      const availableDrivers = response.data;
      setAvailableDriversList(availableDrivers);

      if (availableDrivers.length === 0) {
        setAvailabilityMessage('Keine Fahrer mit passenden Verfügbarkeitsmustern gefunden.');
      } else {
        setAvailabilityMessage(`${availableDrivers.length} Fahrer verfügbar.`);
      }
    } catch (error) {
      console.error('Error loading available drivers:', error);
      setAvailableDriversList([]);
      setAvailabilityMessage('Fehler beim Laden der verfügbaren Fahrer.');
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
        appointment_destination_id: useAppointmentDestination ? formData.appointment_destination_id : undefined,
        appointment_address: useAppointmentDestination ? undefined : formData.appointment_address,
        dropoff_destination_id: useDropoffDestination ? formData.dropoff_destination_id : undefined,
        dropoff_address: useDropoffDestination ? undefined : formData.dropoff_address,
        return_pickup_time: hasReturn ? formData.return_pickup_time : undefined,
        return_pickup_destination_id: hasReturn && useReturnPickupDestination ? formData.return_pickup_destination_id : undefined,
        return_pickup_address: hasReturn && !useReturnPickupDestination ? formData.return_pickup_address : undefined,
        return_driver_id: hasReturn ? formData.return_driver_id : undefined,
      };

      // Validate driver availability if a driver is selected
      if (formData.driver_id && formData.pickup_time) {
        const matchingDriver = availableDriversList.find(
          driver => driver.driver_id === formData.driver_id
        );

        if (!matchingDriver) {
          alert('Der ausgewählte Fahrer hat kein Verfügbarkeitsmuster für diese Zeit. Bitte wählen Sie einen anderen Fahrer oder ändern Sie die Zeit.');
          return;
        }
      }

      let tripId: number;
      if (editingTrip) {
        await tripAPI.update(editingTrip.id!, tripData);
        tripId = editingTrip.id!;
      } else {
        const response = await tripAPI.create(tripData);
        tripId = response.data.id!;
      }

      // Create a booking if a driver is selected
      if (formData.driver_id && formData.pickup_time) {
        const pickupDate = new Date(formData.pickup_time);
        const date = pickupDate.toISOString().split('T')[0];

        const matchingDriver = availableDriversList.find(
          driver => driver.driver_id === formData.driver_id
        );

        if (matchingDriver) {
          await availabilityAPI.createBooking({
            driver_id: formData.driver_id,
            date: date,
            start_time: matchingDriver.start_time,
            end_time: matchingDriver.end_time,
            trip_id: tripId,
          });
        }
      }

      loadData();
      resetForm();
    } catch (error: any) {
      console.error('Error saving trip:', error);
      alert(`Fehler beim Speichern: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setUsePickupDestination(!!trip.pickup_destination_id);
    setUseAppointmentDestination(!!trip.appointment_destination_id);
    setUseDropoffDestination(!!trip.dropoff_destination_id);
    setUseReturnPickupDestination(!!trip.return_pickup_destination_id);
    setHasReturn(!!trip.return_pickup_time);
    setFormData({
      patient_id: trip.patient_id,
      driver_id: trip.driver_id,
      pickup_destination_id: trip.pickup_destination_id,
      pickup_address: trip.pickup_address || '',
      pickup_time: trip.pickup_time.slice(0, 16),
      appointment_destination_id: trip.appointment_destination_id,
      appointment_address: trip.appointment_address || '',
      appointment_time: trip.appointment_time ? trip.appointment_time.slice(0, 16) : '',
      dropoff_destination_id: trip.dropoff_destination_id,
      dropoff_address: trip.dropoff_address || '',
      dropoff_time: trip.dropoff_time ? trip.dropoff_time.slice(0, 16) : '',
      return_pickup_time: trip.return_pickup_time ? trip.return_pickup_time.slice(0, 16) : '',
      return_pickup_destination_id: trip.return_pickup_destination_id,
      return_pickup_address: trip.return_pickup_address || '',
      return_driver_id: trip.return_driver_id,
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
      appointment_destination_id: undefined,
      appointment_address: '',
      appointment_time: '',
      dropoff_destination_id: undefined,
      dropoff_address: '',
      dropoff_time: '',
      return_pickup_time: '',
      return_pickup_destination_id: undefined,
      return_pickup_address: '',
      return_driver_id: undefined,
      distance_km: undefined,
      status: 'scheduled',
      notes: '',
    });
    setUsePickupDestination(false);
    setUseAppointmentDestination(true);
    setUseDropoffDestination(false);
    setUseReturnPickupDestination(false);
    setHasReturn(false);
    setEditingTrip(null);
    setShowForm(false);
    setAvailableDriversList([]);
    setAvailabilityMessage('');
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
            <div>
              <select
                value={formData.driver_id || ''}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">Fahrer auswählen (Optional)</option>
                {availableDriversList.length > 0 ? (
                  availableDriversList.map((driver) => (
                    <option key={driver.driver_id} value={driver.driver_id}>
                      {driver.first_name} {driver.last_name} - {driver.vehicle_type || 'Kein Fahrzeug'}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Keine verfügbaren Fahrer</option>
                )}
              </select>
              {availabilityMessage && (
                <p className={`text-sm mt-1 ${availableDriversList.length > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {availabilityMessage}
                </p>
              )}
            </div>
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
                      {dest.name} - {formatAddress(dest)}
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

          {/* Appointment Location */}
          <div className="location-section">
            <h4>Termin</h4>
            <div className="form-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useAppointmentDestination}
                  onChange={(e) => setUseAppointmentDestination(e.target.checked)}
                />
                Gespeichertes Ziel verwenden
              </label>
            </div>
            <div className="form-grid">
              {useAppointmentDestination ? (
                <select
                  value={formData.appointment_destination_id || ''}
                  onChange={(e) => setFormData({ ...formData, appointment_destination_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  required={useAppointmentDestination}
                >
                  <option value="">Terminort (Ziel) auswählen *</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name} - {formatAddress(dest)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Terminadresse *"
                  value={formData.appointment_address}
                  onChange={(e) => setFormData({ ...formData, appointment_address: e.target.value })}
                  required={!useAppointmentDestination}
                />
              )}
              <input
                type="datetime-local"
                placeholder="Terminzeit"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              />
            </div>
          </div>

          {/* Dropoff Location */}
          <div className="location-section">
            <h4>Rückfahrt nach Termin</h4>
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
                      {dest.name} - {formatAddress(dest)}
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

          {/* Optional Return Pickup */}
          <div className="location-section">
            <div className="form-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasReturn}
                  onChange={(e) => setHasReturn(e.target.checked)}
                />
                <strong>Rückfahrt nach Termin (optional)</strong>
              </label>
            </div>

            {hasReturn && (
              <>
                <h4>Abholung für Rückfahrt</h4>
                <div className="form-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={useReturnPickupDestination}
                      onChange={(e) => setUseReturnPickupDestination(e.target.checked)}
                    />
                    Gespeichertes Ziel verwenden
                  </label>
                </div>
                <div className="form-grid">
                  {useReturnPickupDestination ? (
                    <select
                      value={formData.return_pickup_destination_id || ''}
                      onChange={(e) => setFormData({ ...formData, return_pickup_destination_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    >
                      <option value="">Abholort für Rückfahrt auswählen</option>
                      {destinations.map((dest) => (
                        <option key={dest.id} value={dest.id}>
                          {dest.name} - {formatAddress(dest)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Abholadresse für Rückfahrt"
                      value={formData.return_pickup_address}
                      onChange={(e) => setFormData({ ...formData, return_pickup_address: e.target.value })}
                    />
                  )}
                  <input
                    type="datetime-local"
                    placeholder="Abholzeit für Rückfahrt"
                    value={formData.return_pickup_time}
                    onChange={(e) => setFormData({ ...formData, return_pickup_time: e.target.value })}
                  />
                </div>
                <div className="form-grid">
                  <select
                    value={formData.return_driver_id || ''}
                    onChange={(e) => setFormData({ ...formData, return_driver_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  >
                    <option value="">Fahrer für Rückfahrt (Optional)</option>
                    {availableDriversList.map((driver) => (
                      <option key={driver.driver_id} value={driver.driver_id}>
                        {driver.first_name} {driver.last_name} - {driver.vehicle_type || 'Kein Fahrzeug'}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
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
