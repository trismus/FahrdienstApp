import { Router, Request, Response } from 'express';
import { query } from '../database/connection';
import { Trip } from '../models/types';

const router = Router();

// Get all trips
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT t.*,
             p.first_name || ' ' || p.last_name as patient_name,
             d.first_name || ' ' || d.last_name as driver_name,
             rd.first_name || ' ' || rd.last_name as return_driver_name,
             pd.name as pickup_destination_name,
             ad.name as appointment_destination_name,
             dd.name as dropoff_destination_name,
             rpd.name as return_pickup_destination_name
      FROM trips t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN drivers rd ON t.return_driver_id = rd.id
      LEFT JOIN destinations pd ON t.pickup_destination_id = pd.id
      LEFT JOIN destinations ad ON t.appointment_destination_id = ad.id
      LEFT JOIN destinations dd ON t.dropoff_destination_id = dd.id
      LEFT JOIN destinations rpd ON t.return_pickup_destination_id = rpd.id
      ORDER BY t.pickup_time DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get trips by status
router.get('/status/:status', async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const result = await query(`
      SELECT t.*,
             p.first_name || ' ' || p.last_name as patient_name,
             d.first_name || ' ' || d.last_name as driver_name,
             rd.first_name || ' ' || rd.last_name as return_driver_name,
             pd.name as pickup_destination_name,
             ad.name as appointment_destination_name,
             dd.name as dropoff_destination_name,
             rpd.name as return_pickup_destination_name
      FROM trips t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN drivers rd ON t.return_driver_id = rd.id
      LEFT JOIN destinations pd ON t.pickup_destination_id = pd.id
      LEFT JOIN destinations ad ON t.appointment_destination_id = ad.id
      LEFT JOIN destinations dd ON t.dropoff_destination_id = dd.id
      LEFT JOIN destinations rpd ON t.return_pickup_destination_id = rpd.id
      WHERE t.status = $1
      ORDER BY t.pickup_time ASC
    `, [status]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trips by status:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get trip by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT t.*,
             p.first_name || ' ' || p.last_name as patient_name,
             d.first_name || ' ' || d.last_name as driver_name,
             rd.first_name || ' ' || rd.last_name as return_driver_name,
             pd.name as pickup_destination_name,
             ad.name as appointment_destination_name,
             dd.name as dropoff_destination_name,
             rpd.name as return_pickup_destination_name
      FROM trips t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN drivers rd ON t.return_driver_id = rd.id
      LEFT JOIN destinations pd ON t.pickup_destination_id = pd.id
      LEFT JOIN destinations ad ON t.appointment_destination_id = ad.id
      LEFT JOIN destinations dd ON t.dropoff_destination_id = dd.id
      LEFT JOIN destinations rpd ON t.return_pickup_destination_id = rpd.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Create new trip
router.post('/', async (req: Request, res: Response) => {
  try {
    const trip: Trip = req.body;
    const result = await query(
      `INSERT INTO trips (
        patient_id, driver_id, recurring_trip_id,
        pickup_destination_id, pickup_address, pickup_time,
        appointment_destination_id, appointment_address, appointment_time,
        dropoff_destination_id, dropoff_address, dropoff_time,
        return_pickup_time, return_pickup_destination_id, return_pickup_address, return_driver_id,
        distance_km, status, notes
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        trip.patient_id,
        trip.driver_id || null,
        trip.recurring_trip_id || null,
        trip.pickup_destination_id || null,
        trip.pickup_address || null,
        trip.pickup_time,
        trip.appointment_destination_id || null,
        trip.appointment_address || null,
        trip.appointment_time || null,
        trip.dropoff_destination_id || null,
        trip.dropoff_address || null,
        trip.dropoff_time || null,
        trip.return_pickup_time || null,
        trip.return_pickup_destination_id || null,
        trip.return_pickup_address || null,
        trip.return_driver_id || null,
        trip.distance_km || null,
        trip.status || 'scheduled',
        trip.notes || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Update trip
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trip: Trip = req.body;

    const result = await query(
      `UPDATE trips
       SET patient_id = $1, driver_id = $2, recurring_trip_id = $3,
           pickup_destination_id = $4, pickup_address = $5, pickup_time = $6,
           appointment_destination_id = $7, appointment_address = $8, appointment_time = $9,
           dropoff_destination_id = $10, dropoff_address = $11, dropoff_time = $12,
           return_pickup_time = $13, return_pickup_destination_id = $14,
           return_pickup_address = $15, return_driver_id = $16,
           distance_km = $17, status = $18, notes = $19,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $20
       RETURNING *`,
      [
        trip.patient_id,
        trip.driver_id || null,
        trip.recurring_trip_id || null,
        trip.pickup_destination_id || null,
        trip.pickup_address || null,
        trip.pickup_time,
        trip.appointment_destination_id || null,
        trip.appointment_address || null,
        trip.appointment_time || null,
        trip.dropoff_destination_id || null,
        trip.dropoff_address || null,
        trip.dropoff_time || null,
        trip.return_pickup_time || null,
        trip.return_pickup_destination_id || null,
        trip.return_pickup_address || null,
        trip.return_driver_id || null,
        trip.distance_km || null,
        trip.status,
        trip.notes || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Update trip status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      `UPDATE trips
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ error: 'Failed to update trip status' });
  }
});

// Delete trip
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM trips WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

export default router;
