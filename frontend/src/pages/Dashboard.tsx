import { useEffect, useState } from 'react';
import { tripAPI, patientAPI, driverAPI, type Trip } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDrivers: 0,
    scheduledTrips: 0,
    inProgressTrips: 0,
  });
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [patientsRes, driversRes, tripsRes] = await Promise.all([
        patientAPI.getAll(),
        driverAPI.getAll(),
        tripAPI.getAll(),
      ]);

      const trips = tripsRes.data;
      setStats({
        totalPatients: patientsRes.data.length,
        totalDrivers: driversRes.data.length,
        scheduledTrips: trips.filter((t) => t.status === 'scheduled').length,
        inProgressTrips: trips.filter((t) => t.status === 'in_progress').length,
      });

      const upcoming = trips
        .filter((t) => t.status === 'scheduled')
        .slice(0, 5);
      setUpcomingTrips(upcoming);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalPatients}</h3>
          <p>Total Patients</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalDrivers}</h3>
          <p>Total Drivers</p>
        </div>
        <div className="stat-card">
          <h3>{stats.scheduledTrips}</h3>
          <p>Scheduled Trips</p>
        </div>
        <div className="stat-card">
          <h3>{stats.inProgressTrips}</h3>
          <p>In Progress</p>
        </div>
      </div>

      <div className="upcoming-trips">
        <h3>Upcoming Trips</h3>
        {upcomingTrips.length === 0 ? (
          <p>No upcoming trips scheduled.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Driver</th>
                <th>Pickup Time</th>
                <th>Pickup Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingTrips.map((trip) => (
                <tr key={trip.id}>
                  <td>{trip.patient_name}</td>
                  <td>{trip.driver_name || 'Unassigned'}</td>
                  <td>{new Date(trip.pickup_time).toLocaleString()}</td>
                  <td>{trip.pickup_address}</td>
                  <td>
                    <span className={`status-badge status-${trip.status}`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
