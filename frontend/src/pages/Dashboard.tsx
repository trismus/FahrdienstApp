import { useEffect, useState } from 'react';
import { tripAPI, patientAPI, driverAPI, type Trip } from '../services/api';

// MUI Components
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

// MUI Icons
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LoopIcon from '@mui/icons-material/Loop';

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <Card sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h5" component="div">
        {value}
      </Typography>
      <Typography color="text.secondary">
        {title}
      </Typography>
    </Box>
    <Box sx={{ color: 'primary.main' }}>
      {icon}
    </Box>
  </Card>
);

const getStatusChip = (status: string) => {
    let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
    if (status === 'scheduled') color = 'primary';
    if (status === 'in_progress') color = 'warning';
    if (status === 'completed') color = 'success';
    if (status === 'cancelled') color = 'error';

    return <Chip label={status} color={color} size="small" />;
}


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
        .sort((a, b) => new Date(a.pickup_time).getTime() - new Date(b.pickup_time).getTime())
        .slice(0, 5);
      setUpcomingTrips(upcoming);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom component="h1">
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Stat Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Patients" value={stats.totalPatients} icon={<PeopleIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Drivers" value={stats.totalDrivers} icon={<LocalHospitalIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Scheduled Trips" value={stats.scheduledTrips} icon={<ScheduleIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="In Progress" value={stats.inProgressTrips} icon={<LoopIcon fontSize="large" />} />
        </Grid>

        {/* Upcoming Trips Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom component="h2">
              Upcoming Trips
            </Typography>
            {upcomingTrips.length === 0 ? (
              <Typography sx={{ p: 2 }}>No upcoming trips scheduled.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell>Pickup Time</TableCell>
                      <TableCell>Pickup Address</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.patient_name}</TableCell>
                        <TableCell>{trip.driver_name || 'Unassigned'}</TableCell>
                        <TableCell>{new Date(trip.pickup_time).toLocaleString()}</TableCell>
                        <TableCell>{trip.pickup_address}</TableCell>
                        <TableCell>{getStatusChip(trip.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
