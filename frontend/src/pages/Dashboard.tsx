import { useEffect, useState } from 'react';
import { patientAPI, driverAPI, tripAPI } from '../services/api';

// MUI Components
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';

// MUI Icons
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LoopIcon from '@mui/icons-material/Loop';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <Card sx={{ backgroundColor: color, color: '#fff', borderRadius: 2 }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="subtitle1">
          {title}
        </Typography>
      </Box>
      <Avatar sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
        {icon}
      </Avatar>
    </CardContent>
  </Card>
);

const ChartPlaceholder = ({ title }: { title: string }) => (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            <Typography>Chart data would be displayed here.</Typography>
        </Box>
    </Paper>
);


function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDrivers: 0,
    scheduledTrips: 0,
    inProgressTrips: 0,
  });
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
    <Container maxWidth={false} sx={{ mt: -2 }}>
      <Grid container spacing={3}>
        {/* Stat Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Patients" value={stats.totalPatients} icon={<PeopleIcon />} color="#5D87FF" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Drivers" value={stats.totalDrivers} icon={<LocalHospitalIcon />} color="#49BEFF" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Scheduled Trips" value={stats.scheduledTrips} icon={<ScheduleIcon />} color="#FFAE1F" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="In Progress" value={stats.inProgressTrips} icon={<LoopIcon />} color="#FA896B" />
        </Grid>

        {/* Chart Placeholders */}
        <Grid item xs={12} lg={8}>
            <ChartPlaceholder title="Revenue Updates" />
        </Grid>
        <Grid item xs={12} lg={4}>
            <ChartPlaceholder title="Yearly Breakup" />
        </Grid>
        <Grid item xs={12} lg={4}>
            <ChartPlaceholder title="Monthly Earnings" />
        </Grid>
         <Grid item xs={12} lg={8}>
            <ChartPlaceholder title="Employee Salary" />
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
