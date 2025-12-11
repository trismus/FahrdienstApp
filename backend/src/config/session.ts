import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from '../database/connection';

const PgSession = connectPgSimple(session);

// Extend express-session types for our custom session data
declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
    role: 'admin' | 'dispatcher' | 'driver';
    driver_id?: number;
  }
}

// Session configuration
export const sessionConfig: session.SessionOptions = {
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: false, // We create it via migration
  }),
  secret: process.env.SESSION_SECRET || 'your_session_secret_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevents XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // CSRF protection
  },
};
