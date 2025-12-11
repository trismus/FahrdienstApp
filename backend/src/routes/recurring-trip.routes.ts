import { Router, Request, Response } from 'express';
import { isOperator } from '../middleware/auth';
import { query } from '../database/connection';
import { RecurringTrip } from '../models/types';

const router = Router();

// Get all recurring trips
router.get('/', isOperator, async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT rt.*,
              p.first_name || ' ' || p.last_name as patient_name,
              pd.name as pickup_destination_name,
              ad.name as appointment_destination_name,
              dd.name as dropoff_destination_name,
              rpd.name as return_pickup_destination_name
       FROM recurring_trips rt
       LEFT JOIN patients p ON rt.patient_id = p.id
       LEFT JOIN destinations pd ON rt.pickup_destination_id = pd.id
       LEFT JOIN destinations ad ON rt.appointment_destination_id = ad.id
       LEFT JOIN destinations dd ON rt.dropoff_destination_id = dd.id
       LEFT JOIN destinations rpd ON rt.return_pickup_destination_id = rpd.id
       ORDER BY rt.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recurring trips:', error);
    res.status(500).json({ error: 'Failed to fetch recurring trips' });
  }
});

// Get recurring trips by patient
router.get('/patient/:patientId', isOperator, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await query(
      `SELECT rt.*,
              p.first_name || ' ' || p.last_name as patient_name,
              pd.name as pickup_destination_name,
              ad.name as appointment_destination_name,
              dd.name as dropoff_destination_name,
              rpd.name as return_pickup_destination_name
       FROM recurring_trips rt
       LEFT JOIN patients p ON rt.patient_id = p.id
       LEFT JOIN destinations pd ON rt.pickup_destination_id = pd.id
       LEFT JOIN destinations ad ON rt.appointment_destination_id = ad.id
       LEFT JOIN destinations dd ON rt.dropoff_destination_id = dd.id
       LEFT JOIN destinations rpd ON rt.return_pickup_destination_id = rpd.id
       WHERE rt.patient_id = $1 AND rt.is_active = true
       ORDER BY rt.start_date DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recurring trips for patient:', error);
    res.status(500).json({ error: 'Failed to fetch recurring trips for patient' });
  }
});

// Get a single recurring trip by ID
router.get('/:id', isOperator, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT rt.*,
              p.first_name || ' ' || p.last_name as patient_name,
              pd.name as pickup_destination_name,
              ad.name as appointment_destination_name,
              dd.name as dropoff_destination_name,
              rpd.name as return_pickup_destination_name
       FROM recurring_trips rt
       LEFT JOIN patients p ON rt.patient_id = p.id
       LEFT JOIN destinations pd ON rt.pickup_destination_id = pd.id
       LEFT JOIN destinations ad ON rt.appointment_destination_id = ad.id
       LEFT JOIN destinations dd ON rt.dropoff_destination_id = dd.id
       LEFT JOIN destinations rpd ON rt.return_pickup_destination_id = rpd.id
       WHERE rt.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurring trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching recurring trip:', error);
    res.status(500).json({ error: 'Failed to fetch recurring trip' });
  }
});

// Create a new recurring trip
router.post('/', isOperator, async (req: Request, res: Response) => {
  try {
    const recurringTrip: RecurringTrip = req.body;

    // Validate required fields
    if (!recurringTrip.patient_id || !recurringTrip.recurrence_pattern ||
        !recurringTrip.weekdays || recurringTrip.weekdays.length === 0 ||
        !recurringTrip.start_date || !recurringTrip.pickup_time_of_day) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate that either end_date or occurrences is provided
    if (!recurringTrip.end_date && !recurringTrip.occurrences) {
      return res.status(400).json({ error: 'Either end_date or occurrences must be provided' });
    }

    // Validate that at least one location is provided
    if (!recurringTrip.pickup_destination_id && !recurringTrip.pickup_address) {
      return res.status(400).json({ error: 'Either pickup_destination_id or pickup_address must be provided' });
    }

    if (!recurringTrip.appointment_destination_id && !recurringTrip.appointment_address) {
      return res.status(400).json({ error: 'Either appointment_destination_id or appointment_address must be provided' });
    }

    const result = await query(
      `INSERT INTO recurring_trips (
        patient_id, recurrence_pattern, weekdays, start_date, end_date, occurrences,
        pickup_destination_id, pickup_address, pickup_time_of_day,
        appointment_destination_id, appointment_address, appointment_time_offset,
        dropoff_destination_id, dropoff_address,
        has_return, return_pickup_time_offset, return_pickup_destination_id, return_pickup_address,
        notes, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        recurringTrip.patient_id,
        recurringTrip.recurrence_pattern,
        recurringTrip.weekdays,
        recurringTrip.start_date,
        recurringTrip.end_date || null,
        recurringTrip.occurrences || null,
        recurringTrip.pickup_destination_id || null,
        recurringTrip.pickup_address || null,
        recurringTrip.pickup_time_of_day,
        recurringTrip.appointment_destination_id || null,
        recurringTrip.appointment_address || null,
        recurringTrip.appointment_time_offset || null,
        recurringTrip.dropoff_destination_id || null,
        recurringTrip.dropoff_address || null,
        recurringTrip.has_return || false,
        recurringTrip.return_pickup_time_offset || null,
        recurringTrip.return_pickup_destination_id || null,
        recurringTrip.return_pickup_address || null,
        recurringTrip.notes || null,
        recurringTrip.is_active !== undefined ? recurringTrip.is_active : true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating recurring trip:', error);
    res.status(500).json({ error: error.message || 'Failed to create recurring trip' });
  }
});

// Update a recurring trip
router.put('/:id', isOperator, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recurringTrip: RecurringTrip = req.body;

    const result = await query(
      `UPDATE recurring_trips SET
        patient_id = $1,
        recurrence_pattern = $2,
        weekdays = $3,
        start_date = $4,
        end_date = $5,
        occurrences = $6,
        pickup_destination_id = $7,
        pickup_address = $8,
        pickup_time_of_day = $9,
        appointment_destination_id = $10,
        appointment_address = $11,
        appointment_time_offset = $12,
        dropoff_destination_id = $13,
        dropoff_address = $14,
        has_return = $15,
        return_pickup_time_offset = $16,
        return_pickup_destination_id = $17,
        return_pickup_address = $18,
        notes = $19,
        is_active = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21
      RETURNING *`,
      [
        recurringTrip.patient_id,
        recurringTrip.recurrence_pattern,
        recurringTrip.weekdays,
        recurringTrip.start_date,
        recurringTrip.end_date || null,
        recurringTrip.occurrences || null,
        recurringTrip.pickup_destination_id || null,
        recurringTrip.pickup_address || null,
        recurringTrip.pickup_time_of_day,
        recurringTrip.appointment_destination_id || null,
        recurringTrip.appointment_address || null,
        recurringTrip.appointment_time_offset || null,
        recurringTrip.dropoff_destination_id || null,
        recurringTrip.dropoff_address || null,
        recurringTrip.has_return || false,
        recurringTrip.return_pickup_time_offset || null,
        recurringTrip.return_pickup_destination_id || null,
        recurringTrip.return_pickup_address || null,
        recurringTrip.notes || null,
        recurringTrip.is_active !== undefined ? recurringTrip.is_active : true,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurring trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating recurring trip:', error);
    res.status(500).json({ error: error.message || 'Failed to update recurring trip' });
  }
});

// Delete a recurring trip
router.delete('/:id', isOperator, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM recurring_trips WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurring trip not found' });
    }

    res.json({ message: 'Recurring trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring trip:', error);
    res.status(500).json({ error: 'Failed to delete recurring trip' });
  }
});

// Deactivate a recurring trip (soft delete)
router.patch('/:id/deactivate', isOperator, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE recurring_trips SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurring trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error deactivating recurring trip:', error);
    res.status(500).json({ error: 'Failed to deactivate recurring trip' });
  }
});

// Generate trip instances from a recurring trip
router.post('/:id/generate', isOperator, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { generateUntil } = req.body; // Optional: date to generate until

    // Call the PL/pgSQL function to generate trip instances
    const result = await query(
      'SELECT generate_recurring_trip_instances($1, $2) as instances_created',
      [id, generateUntil || null]
    );

    const instancesCreated = result.rows[0].instances_created;

    res.json({
      message: `Successfully generated ${instancesCreated} trip instance(s)`,
      instances_created: instancesCreated
    });
  } catch (error: any) {
    console.error('Error generating trip instances:', error);
    res.status(500).json({ error: error.message || 'Failed to generate trip instances' });
  }
});

// Get all trip instances for a recurring trip
router.get('/:id/trips', isOperator, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT t.*,
              p.first_name || ' ' || p.last_name as patient_name,
              d.first_name || ' ' || d.last_name as driver_name,
              pd.name as pickup_destination_name,
              ad.name as appointment_destination_name,
              dd.name as dropoff_destination_name
       FROM trips t
       LEFT JOIN patients p ON t.patient_id = p.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       LEFT JOIN destinations pd ON t.pickup_destination_id = pd.id
       LEFT JOIN destinations ad ON t.appointment_destination_id = ad.id
       LEFT JOIN destinations dd ON t.dropoff_destination_id = dd.id
       WHERE t.recurring_trip_id = $1
       ORDER BY t.pickup_time ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trip instances:', error);
    res.status(500).json({ error: 'Failed to fetch trip instances' });
  }
});

export default router;
