import { Router, Request, Response } from 'express';
import { query } from '../database/connection';
import { DriverAvailabilityPattern, DriverAvailabilityBooking } from '../models/types';

const router = Router();

// ==================== PATTERNS (Recurring Weekly Availability) ====================

// Get all patterns for a specific driver
router.get('/patterns/driver/:driverId', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const result = await query(
      'SELECT * FROM driver_availability_patterns WHERE driver_id = $1 ORDER BY weekday, start_time',
      [driverId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching availability patterns:', error);
    res.status(500).json({ error: 'Failed to fetch availability patterns' });
  }
});

// Create new availability pattern(s)
router.post('/patterns', async (req: Request, res: Response) => {
  try {
    const patterns: DriverAvailabilityPattern[] = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const pattern of patterns) {
      const result = await query(
        `INSERT INTO driver_availability_patterns (driver_id, weekday, start_time, end_time)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [pattern.driver_id, pattern.weekday, pattern.start_time, pattern.end_time]
      );
      results.push(result.rows[0]);
    }

    res.status(201).json(Array.isArray(req.body) ? results : results[0]);
  } catch (error: any) {
    console.error('Error creating availability pattern:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Pattern already exists for this driver' });
    } else {
      res.status(500).json({ error: 'Failed to create availability pattern' });
    }
  }
});

// Delete availability pattern
router.delete('/patterns/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM driver_availability_patterns WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Availability pattern not found' });
    }

    res.json({ message: 'Availability pattern deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability pattern:', error);
    res.status(500).json({ error: 'Failed to delete availability pattern' });
  }
});

// Bulk delete patterns for a driver
router.delete('/patterns/driver/:driverId', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const result = await query(
      'DELETE FROM driver_availability_patterns WHERE driver_id = $1 RETURNING *',
      [driverId]
    );
    res.json({
      message: `${result.rows.length} patterns deleted successfully`,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error deleting availability patterns:', error);
    res.status(500).json({ error: 'Failed to delete availability patterns' });
  }
});

// ==================== BOOKINGS (Specific Date Bookings) ====================

// Get bookings for a specific driver and date range
router.get('/bookings/driver/:driverId', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    let queryText = 'SELECT * FROM driver_availability_bookings WHERE driver_id = $1';
    const params: any[] = [driverId];

    if (startDate && endDate) {
      queryText += ' AND date >= $2 AND date <= $3';
      params.push(startDate, endDate);
    }

    queryText += ' ORDER BY date, start_time';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get bookings for a specific date (all drivers)
router.get('/bookings/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const result = await query(
      `SELECT dab.*, d.first_name, d.last_name
       FROM driver_availability_bookings dab
       JOIN drivers d ON dab.driver_id = d.id
       WHERE dab.date = $1
       ORDER BY d.last_name, d.first_name, dab.start_time`,
      [date]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings for date:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ==================== AVAILABILITY CHECK (Combined Patterns + Bookings) ====================

// Get available drivers for a specific date and time
// This checks patterns and excludes drivers with bookings at that time
router.get('/available', async (req: Request, res: Response) => {
  try {
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'date, startTime, and endTime are required' });
    }

    // Calculate weekday from date (JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday)
    // Convert to our format: 1=Monday, ..., 5=Friday
    const dateObj = new Date(date as string);
    const jsWeekday = dateObj.getDay(); // 0-6
    const weekday = jsWeekday === 0 ? 7 : jsWeekday; // Convert Sunday (0) to 7, others stay same

    // Only accept Monday-Friday (1-5)
    if (weekday < 1 || weekday > 5) {
      return res.json([]); // Weekend, no availability
    }

    // Find drivers with matching patterns who are NOT booked at this time
    const result = await query(
      `SELECT DISTINCT
         dap.driver_id,
         dap.weekday,
         dap.start_time,
         dap.end_time,
         d.first_name,
         d.last_name,
         d.vehicle_type,
         d.vehicle_registration
       FROM driver_availability_patterns dap
       JOIN drivers d ON dap.driver_id = d.id
       WHERE dap.weekday = $1
         AND dap.start_time <= $2
         AND dap.end_time >= $3
         AND d.is_available = true
         AND NOT EXISTS (
           SELECT 1 FROM driver_availability_bookings dab
           WHERE dab.driver_id = dap.driver_id
             AND dab.date = $4
             AND dab.start_time <= $2
             AND dab.end_time >= $3
         )
       ORDER BY d.last_name, d.first_name`,
      [weekday, startTime, endTime, date]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
});

// ==================== BOOKING MANAGEMENT ====================

// Create a booking (occupy a time slot for a trip)
router.post('/bookings', async (req: Request, res: Response) => {
  try {
    const booking: DriverAvailabilityBooking = req.body;

    // Check if driver has a pattern for this weekday and time
    const dateObj = new Date(booking.date);
    const jsWeekday = dateObj.getDay();
    const weekday = jsWeekday === 0 ? 7 : jsWeekday;

    const patternCheck = await query(
      `SELECT id FROM driver_availability_patterns
       WHERE driver_id = $1
         AND weekday = $2
         AND start_time <= $3
         AND end_time >= $4`,
      [booking.driver_id, weekday, booking.start_time, booking.end_time]
    );

    if (patternCheck.rows.length === 0) {
      return res.status(400).json({
        error: 'Driver has no availability pattern for this weekday and time'
      });
    }

    // Create the booking
    const result = await query(
      `INSERT INTO driver_availability_bookings (driver_id, date, start_time, end_time, trip_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [booking.driver_id, booking.date, booking.start_time, booking.end_time, booking.trip_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating booking:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Time slot already booked for this driver' });
    } else {
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
});

// Delete a booking (free up a time slot)
router.delete('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM driver_availability_bookings WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Delete booking by trip ID (when trip is deleted)
router.delete('/bookings/trip/:tripId', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const result = await query(
      'DELETE FROM driver_availability_bookings WHERE trip_id = $1 RETURNING *',
      [tripId]
    );

    res.json({
      message: `${result.rows.length} bookings deleted successfully`,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error deleting bookings for trip:', error);
    res.status(500).json({ error: 'Failed to delete bookings' });
  }
});

export default router;
