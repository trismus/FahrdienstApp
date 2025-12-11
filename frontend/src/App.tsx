import { BrowserRouter as Router, Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Drivers from './pages/Drivers';
import DriverAvailability from './pages/DriverAvailability';
import Destinations from './pages/Destinations';
import Trips from './pages/Trips';
import RecurringTrips from './pages/RecurringTrips';
import Users from './pages/Users';
import MyTrips from './pages/MyTrips';

// MUI Components
import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';

// MUI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PlaceIcon from '@mui/icons-material/Place';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import RepeatIcon from '@mui/icons-material/Repeat';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import CommuteIcon from '@mui/icons-material/Commute';

const drawerWidth = 240;

const commonNavItems = [
  { text: 'Dashboard', path: '/', icon: <DashboardIcon />, role: 'operator' },
  { text: 'Patienten', path: '/patients', icon: <PeopleIcon />, role: 'operator' },
  { text: 'Fahrer', path: '/drivers', icon: <LocalHospitalIcon />, role: 'operator' },
  { text: 'Verfügbarkeit', path: '/availability', icon: <EventAvailableIcon />, role: 'operator' },
  { text: 'Ziele', path: '/destinations', icon: <PlaceIcon />, role: 'operator' },
  { text: 'Fahrten', path: '/trips', icon: <DirectionsCarIcon />, role: 'operator' },
  { text: 'Terminserie', path: '/recurring-trips', icon: <Repeat />, role: 'operator' },
  { text: 'Benutzer', path: '/users', icon: <SupervisorAccountIcon />, role: 'admin' },
];

const driverNavItems = [
    { text: 'Meine Fahrten', path: '/my-trips', icon: <CommuteIcon />, role: 'driver' },
];


function AppContent() {
  const { user, logout, isAdmin, isDriver } = useAuth();
  const location = useLocation();

  if (!user) {
    // This should ideally not be reached if ProtectedRoute is set up correctly,
    // but as a fallback, we render the Login component.
    return <Login />;
  }

  const navItems = isDriver() ? driverNavItems : commonNavItems.filter(item => item.role === 'operator' || (item.role === 'admin' && isAdmin()));

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Fahrdienst App
          </Typography>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            ({user.username})
          </Typography>
          <Button color="inherit" onClick={logout}>
            Abmelden
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Routes>
          {isDriver() ? (
            // Driver routes
            <>
                <Route path="/" element={<MyTrips />} />
                <Route path="/my-trips" element={<ProtectedRoute requiredRole="driver"><MyTrips /></ProtectedRoute>} />
            </>
          ) : (
            // Operator & Admin routes
            <>
              <Route path="/" element={<ProtectedRoute requireOperator><Dashboard /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute requireOperator><Patients /></ProtectedRoute>} />
              <Route path="/drivers" element={<ProtectedRoute requireOperator><Drivers /></ProtectedRoute>} />
              <Route path="/availability" element={<ProtectedRoute requireOperator><DriverAvailability /></ProtectedRoute>} />
              <Route path="/destinations" element={<ProtectedRoute requireOperator><Destinations /></ProtectedRoute>} />
              <Route path="/trips" element={<ProtectedRoute requireOperator><Trips /></ProtectedRoute>} />
              <Route path="/recurring-trips" element={<ProtectedRoute requireOperator><RecurringTrips /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>} />
            </>
          )}
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
