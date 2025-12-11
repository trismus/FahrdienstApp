import { useEffect, useState } from 'react';
import { driverTripAPI, type Trip } from '../services/api';

function MyTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadTrips();
  }, [filter]);

  const loadTrips = async () => {
    try {
      const response = await driverTripAPI.getMyTrips(filter || undefined);
      setTrips(response.data);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await driverTripAPI.updateStatus(id, status);
      loadTrips();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return <div className="loading">Lade Fahrten...</div>;
  }

  return (
    <div className="my-trips-page">
      <div className="page-header">
        <h2>Meine Fahrten</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('')}
          >
            Alle
          </button>
          <button
            className={`btn ${filter === 'scheduled' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('scheduled')}
          >
            Geplant
          </button>
          <button
            className={`btn ${filter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('in_progress')}
          >
            In Fahrt
          </button>
          <button
            className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('completed')}
          >
            Abgeschlossen
          </button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Datum/Zeit</th>
            <th>Patient</th>
            <th>Abholung</th>
            <th>Ziel</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {trips.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                Keine Fahrten gefunden
              </td>
            </tr>
          ) : (
            trips.map((trip) => (
              <tr key={trip.id}>
                <td>{new Date(trip.pickup_time).toLocaleString('de-DE')}</td>
                <td><strong>{trip.patient_name}</strong></td>
                <td>
                  {trip.pickup_destination_name || trip.pickup_address}
                </td>
                <td>
                  {trip.appointment_destination_name || trip.appointment_address}
                </td>
                <td>
                  <span className={`status-badge status-${trip.status}`}>
                    {trip.status === 'scheduled' && 'Geplant'}
                    {trip.status === 'in_progress' && 'In Fahrt'}
                    {trip.status === 'completed' && 'Abgeschlossen'}
                    {trip.status === 'cancelled' && 'Abgebrochen'}
                  </span>
                </td>
                <td className="actions">
                  {trip.status === 'scheduled' && (
                    <button
                      className="btn btn-small"
                      onClick={() => handleStatusChange(trip.id!, 'in_progress')}
                    >
                      Fahrt starten
                    </button>
                  )}
                  {trip.status === 'in_progress' && (
                    <button
                      className="btn btn-small"
                      onClick={() => handleStatusChange(trip.id!, 'completed')}
                    >
                      Abschließen
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default MyTrips;
