import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { connectDatabase } from './database/connection';
import { sessionConfig } from './config/session';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import driverTripRoutes from './routes/driver-trips.routes';
import patientRoutes from './routes/patient.routes';
import driverRoutes from './routes/driver.routes';
import destinationRoutes from './routes/destination.routes';
import tripRoutes from './routes/trip.routes';
import recurringTripRoutes from './routes/recurring-trip.routes';
import availabilityRoutes from './routes/availability.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost',
  credentials: true, // Allow cookies to be sent
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (must be after cookie parser and before routes)
app.use(session(sessionConfig));

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Fahrdienst API is running' });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/driver-trips', driverTripRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/recurring-trips', recurringTripRoutes);
app.use('/api/availability', availabilityRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
