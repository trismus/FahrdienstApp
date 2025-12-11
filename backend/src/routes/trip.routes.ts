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
             d.first_name || ' ' || d.last_name as driver_name
      FROM trips t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN drivers d ON t.driver_id = d.id
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
             d.first_name || ' ' || d.last_name as driver_name
      FROM trips t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN drivers d ON t.driver_id = d.id
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
             d.first_name || ' ' || d.last_name as driver_name
      FROM trips t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN drivers d ON t.driver_id = d.id
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
      `INSERT INTO trips (patient_id, driver_id, pickup_address, pickup_time, dropoff_address, dropoff_time, distance_km, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        trip.patient_id,
        trip.driver_id,
        trip.pickup_address,
        trip.pickup_time,
        trip.dropoff_address,
        trip.dropoff_time,
        trip.distance_km,
        trip.status || 'scheduled',
        trip.notes
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
       SET patient_id = $1, driver_id = $2, pickup_address = $3, pickup_time = $4,
           dropoff_address = $5, dropoff_time = $6, distance_km = $7,
           status = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        trip.patient_id,
        trip.driver_id,
        trip.pickup_address,
        trip.pickup_time,
        trip.dropoff_address,
        trip.dropoff_time,
        trip.distance_km,
        trip.status,
        trip.notes,
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
