import { Router, Request, Response } from 'express';
import { query } from '../database/connection';
import { isDriver } from '../middleware/auth';

const router = Router();

// All driver-trip routes require driver role

// Get trips for the logged-in driver
router.get('/my-trips', isDriver, async (req: Request, res: Response) => {
  try {
    const driver_id = req.session.driver_id;
    const status = req.query.status as string | undefined;

    if (!driver_id) {
      return res.status(400).json({ error: 'Driver ID not found in session' });
    }

    // Build query with optional status filter
    let queryText = `
      SELECT
        t.id,
        t.patient_id,
        t.driver_id,
        t.recurring_trip_id,
        t.pickup_destination_id,
        t.pickup_address,
        t.pickup_time,
        t.appointment_destination_id,
        t.appointment_address,
        t.appointment_time,
        t.dropoff_destination_id,
        t.dropoff_address,
        t.dropoff_time,
        t.return_pickup_time,
        t.return_pickup_destination_id,
        t.return_pickup_address,
        t.return_driver_id,
        t.distance_km,
        t.status,
        t.notes,
        t.created_at,
        t.updated_at,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        CONCAT(rd.first_name, ' ', rd.last_name) as return_driver_name,
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
      WHERE (t.driver_id = $1 OR t.return_driver_id = $1)
    `;

    const params: any[] = [driver_id];

    if (status) {
      queryText += ' AND t.status = $2';
      params.push(status);
    }

    queryText += ' ORDER BY t.pickup_time ASC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Update trip status (Driver only)
router.patch('/:id/status', isDriver, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const driver_id = req.session.driver_id;

    if (!driver_id) {
      return res.status(400).json({ error: 'Driver ID not found in session' });
    }

    // Validate status
    if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if trip belongs to this driver
    const checkResult = await query(
      'SELECT id FROM trips WHERE id = $1 AND (driver_id = $2 OR return_driver_id = $2)',
      [id, driver_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found or not assigned to you' });
    }

    // Update status
    const result = await query(
      `UPDATE trips
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ error: 'Failed to update trip status' });
  }
});

export default router;
