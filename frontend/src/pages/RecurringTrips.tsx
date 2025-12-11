import { useEffect, useState } from 'react';
import { recurringTripAPI, patientAPI, destinationAPI, WEEKDAYS, type RecurringTrip, type Patient, type Destination } from '../services/api';

function RecurringTrips() {
  const [recurringTrips, setRecurringTrips] = useState<RecurringTrip[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecurringTrip, setEditingRecurringTrip] = useState<RecurringTrip | null>(null);
  const [usePickupDestination, setUsePickupDestination] = useState(false);
  const [useAppointmentDestination, setUseAppointmentDestination] = useState(true);
  const [useDropoffDestination, setUseDropoffDestination] = useState(false);
  const [useReturnPickupDestination, setUseReturnPickupDestination] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [formData, setFormData] = useState<RecurringTrip>({
    patient_id: 0,
    recurrence_pattern: 'weekly',
    weekdays: [],
    start_date: '',
    end_date: '',
    occurrences: undefined,
    pickup_destination_id: undefined,
    pickup_address: '',
    pickup_time_of_day: '08:00:00',
    appointment_destination_id: undefined,
    appointment_address: '',
    appointment_time_offset: '01:00:00',
    dropoff_destination_id: undefined,
    dropoff_address: '',
    has_return: false,
    return_pickup_time_offset: '02:00:00',
    return_pickup_destination_id: undefined,
    return_pickup_address: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

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

  // Auto-fill return pickup address when appointment location changes
  useEffect(() => {
    if (formData.has_return) {
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
  }, [formData.has_return, formData.appointment_destination_id, formData.appointment_address, destinations, useReturnPickupDestination]);

  const loadData = async () => {
    try {
      const [recurringRes, patientsRes, destinationsRes] = await Promise.all([
        recurringTripAPI.getAll(),
        patientAPI.getAll(),
        destinationAPI.getActive(),
      ]);
      setRecurringTrips(recurringRes.data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const recurringTripData = {
        ...formData,
        weekdays: selectedWeekdays,
        pickup_destination_id: usePickupDestination ? formData.pickup_destination_id : undefined,
        pickup_address: usePickupDestination ? undefined : formData.pickup_address,
        appointment_destination_id: useAppointmentDestination ? formData.appointment_destination_id : undefined,
        appointment_address: useAppointmentDestination ? undefined : formData.appointment_address,
        dropoff_destination_id: useDropoffDestination ? formData.dropoff_destination_id : undefined,
        dropoff_address: useDropoffDestination ? undefined : formData.dropoff_address,
        return_pickup_destination_id: formData.has_return && useReturnPickupDestination ? formData.return_pickup_destination_id : undefined,
        return_pickup_address: formData.has_return && !useReturnPickupDestination ? formData.return_pickup_address : undefined,
      };

      if (editingRecurringTrip) {
        await recurringTripAPI.update(editingRecurringTrip.id!, recurringTripData);
      } else {
        const response = await recurringTripAPI.create(recurringTripData);
        // Automatically generate trips after creating
        if (response.data.id) {
          await recurringTripAPI.generate(response.data.id);
        }
      }
      loadData();
      resetForm();
    } catch (error: any) {
      console.error('Error saving recurring trip:', error);
      alert(`Fehler beim Speichern: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEdit = (recurringTrip: RecurringTrip) => {
    setEditingRecurringTrip(recurringTrip);
    setUsePickupDestination(!!recurringTrip.pickup_destination_id);
    setUseAppointmentDestination(!!recurringTrip.appointment_destination_id);
    setUseDropoffDestination(!!recurringTrip.dropoff_destination_id);
    setUseReturnPickupDestination(!!recurringTrip.return_pickup_destination_id);
    setSelectedWeekdays(recurringTrip.weekdays);
    setFormData({
      patient_id: recurringTrip.patient_id,
      recurrence_pattern: recurringTrip.recurrence_pattern,
      weekdays: recurringTrip.weekdays,
      start_date: recurringTrip.start_date,
      end_date: recurringTrip.end_date || '',
      occurrences: recurringTrip.occurrences,
      pickup_destination_id: recurringTrip.pickup_destination_id,
      pickup_address: recurringTrip.pickup_address || '',
      pickup_time_of_day: recurringTrip.pickup_time_of_day,
      appointment_destination_id: recurringTrip.appointment_destination_id,
      appointment_address: recurringTrip.appointment_address || '',
      appointment_time_offset: recurringTrip.appointment_time_offset || '01:00:00',
      dropoff_destination_id: recurringTrip.dropoff_destination_id,
      dropoff_address: recurringTrip.dropoff_address || '',
      has_return: recurringTrip.has_return || false,
      return_pickup_time_offset: recurringTrip.return_pickup_time_offset || '02:00:00',
      return_pickup_destination_id: recurringTrip.return_pickup_destination_id,
      return_pickup_address: recurringTrip.return_pickup_address || '',
      notes: recurringTrip.notes || '',
      is_active: recurringTrip.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Möchten Sie diese Terminserie wirklich löschen? Alle zugehörigen Fahrten bleiben bestehen.')) {
      try {
        await recurringTripAPI.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting recurring trip:', error);
      }
    }
  };

  const handleGenerate = async (id: number) => {
    if (window.confirm('Möchten Sie neue Fahrten aus dieser Serie generieren?')) {
      try {
        const response = await recurringTripAPI.generate(id);
        alert(response.data.message);
        loadData();
      } catch (error: any) {
        console.error('Error generating trips:', error);
        alert(`Fehler beim Generieren: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const toggleWeekday = (weekday: number) => {
    if (selectedWeekdays.includes(weekday)) {
      setSelectedWeekdays(selectedWeekdays.filter(w => w !== weekday));
    } else {
      setSelectedWeekdays([...selectedWeekdays, weekday].sort());
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: 0,
      recurrence_pattern: 'weekly',
      weekdays: [],
      start_date: '',
      end_date: '',
      occurrences: undefined,
      pickup_destination_id: undefined,
      pickup_address: '',
      pickup_time_of_day: '08:00:00',
      appointment_destination_id: undefined,
      appointment_address: '',
      appointment_time_offset: '01:00:00',
      dropoff_destination_id: undefined,
      dropoff_address: '',
      has_return: false,
      return_pickup_time_offset: '02:00:00',
      return_pickup_destination_id: undefined,
      return_pickup_address: '',
      notes: '',
      is_active: true,
    });
    setSelectedWeekdays([]);
    setUsePickupDestination(false);
    setUseAppointmentDestination(true);
    setUseDropoffDestination(false);
    setUseReturnPickupDestination(false);
    setEditingRecurringTrip(null);
    setShowForm(false);
  };

  const getWeekdaysDisplay = (weekdays: number[]): string => {
    return weekdays
      .map(wd => WEEKDAYS.find(w => w.value === wd)?.short || '')
      .join(', ');
  };

  if (loading) {
    return <div className="loading">Lade Terminserie...</div>;
  }

  return (
    <div className="recurring-trips-page">
      <div className="page-header">
        <h2>Terminserie</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : 'Neue Terminserie'}
        </button>
      </div>

      {showForm && (
        <form className="recurring-trip-form" onSubmit={handleSubmit}>
          <h3>{editingRecurringTrip ? 'Terminserie bearbeiten' : 'Neue Terminserie'}</h3>

          {/* Patient Selection */}
          <div className="form-section">
            <h4>Patient</h4>
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
          </div>

          {/* Recurrence Pattern */}
          <div className="form-section">
            <h4>Wiederholungsmuster</h4>
            <div className="form-grid">
              <select
                value={formData.recurrence_pattern}
                onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value as RecurringTrip['recurrence_pattern'] })}
                required
              >
                <option value="weekly">Wöchentlich</option>
                <option value="biweekly">Alle 2 Wochen</option>
                <option value="monthly">Monatlich</option>
              </select>
            </div>

            <div className="weekday-selection" style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Wochentage auswählen:</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {WEEKDAYS.map((weekday) => (
                  <button
                    key={weekday.value}
                    type="button"
                    onClick={() => toggleWeekday(weekday.value)}
                    className={`btn ${selectedWeekdays.includes(weekday.value) ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ minWidth: '60px' }}
                  >
                    {weekday.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <div>
                <label>Startdatum *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Enddatum</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value, occurrences: undefined })}
                />
              </div>
              <div>
                <label>Oder Anzahl Wiederholungen</label>
                <input
                  type="number"
                  min="1"
                  placeholder="z.B. 10"
                  value={formData.occurrences || ''}
                  onChange={(e) => setFormData({ ...formData, occurrences: e.target.value ? parseInt(e.target.value) : undefined, end_date: '' })}
                />
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="form-section">
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
                  <option value="">Abholort auswählen *</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name} - {formatAddress(dest)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Abholadresse * (automatisch Patientenadresse)"
                  value={formData.pickup_address}
                  onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                  required={!usePickupDestination}
                />
              )}
              <input
                type="time"
                value={formData.pickup_time_of_day}
                onChange={(e) => setFormData({ ...formData, pickup_time_of_day: e.target.value + ':00' })}
                required
              />
            </div>
          </div>

          {/* Appointment Location */}
          <div className="form-section">
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
                  <option value="">Terminort auswählen *</option>
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
              <div>
                <label>Zeitversatz zum Termin (Stunden)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="z.B. 1"
                  value={formData.appointment_time_offset ? parseFloat(formData.appointment_time_offset.split(':')[0]) : 1}
                  onChange={(e) => {
                    const hours = parseFloat(e.target.value);
                    const minutes = (hours % 1) * 60;
                    setFormData({ ...formData, appointment_time_offset: `${Math.floor(hours).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00` });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dropoff Location */}
          <div className="form-section">
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
                >
                  <option value="">Zielort auswählen</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name} - {formatAddress(dest)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Zieladresse (automatisch Patientenadresse)"
                  value={formData.dropoff_address}
                  onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
                />
              )}
            </div>
          </div>

          {/* Optional Return */}
          <div className="form-section">
            <div className="form-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.has_return}
                  onChange={(e) => setFormData({ ...formData, has_return: e.target.checked })}
                />
                <strong>Separate Rückfahrt (optional)</strong>
              </label>
            </div>

            {formData.has_return && (
              <>
                <div className="form-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={useReturnPickupDestination}
                      onChange={(e) => setUseReturnPickupDestination(e.target.checked)}
                    />
                    Gespeichertes Ziel für Rückfahrt-Abholung verwenden
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
                      placeholder="Abholadresse für Rückfahrt (automatisch Terminadresse)"
                      value={formData.return_pickup_address}
                      onChange={(e) => setFormData({ ...formData, return_pickup_address: e.target.value })}
                    />
                  )}
                  <div>
                    <label>Zeitversatz für Rückfahrt (Stunden)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="z.B. 2"
                      value={formData.return_pickup_time_offset ? parseFloat(formData.return_pickup_time_offset.split(':')[0]) : 2}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value);
                        const minutes = (hours % 1) * 60;
                        setFormData({ ...formData, return_pickup_time_offset: `${Math.floor(hours).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00` });
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          <div className="form-section">
            <textarea
              placeholder="Notizen"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingRecurringTrip ? 'Aktualisieren' : 'Erstellen und Fahrten generieren'}
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
            <th>Muster</th>
            <th>Wochentage</th>
            <th>Zeitraum</th>
            <th>Abholzeit</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {recurringTrips.map((recurringTrip) => (
            <tr key={recurringTrip.id}>
              <td>{recurringTrip.patient_name}</td>
              <td>
                {recurringTrip.recurrence_pattern === 'weekly' && 'Wöchentlich'}
                {recurringTrip.recurrence_pattern === 'biweekly' && 'Alle 2 Wochen'}
                {recurringTrip.recurrence_pattern === 'monthly' && 'Monatlich'}
              </td>
              <td>{getWeekdaysDisplay(recurringTrip.weekdays)}</td>
              <td>
                {new Date(recurringTrip.start_date).toLocaleDateString('de-DE')}
                {' - '}
                {recurringTrip.end_date
                  ? new Date(recurringTrip.end_date).toLocaleDateString('de-DE')
                  : `${recurringTrip.occurrences}x`}
              </td>
              <td>{recurringTrip.pickup_time_of_day.substring(0, 5)}</td>
              <td>
                <span className={`status-badge ${recurringTrip.is_active ? 'status-available' : 'status-unavailable'}`}>
                  {recurringTrip.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => handleGenerate(recurringTrip.id!)}>
                  Fahrten generieren
                </button>
                <button className="btn btn-small" onClick={() => handleEdit(recurringTrip)}>
                  Bearbeiten
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(recurringTrip.id!)}>
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

export default RecurringTrips;
