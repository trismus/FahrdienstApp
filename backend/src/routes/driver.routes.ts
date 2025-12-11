import { Router, Request, Response } from 'express';
import { query } from '../database/connection';
import { Driver } from '../models/types';

const router = Router();

// Get all drivers
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM drivers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Get available drivers
router.get('/available', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM drivers WHERE is_available = true ORDER BY last_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
});

// Get driver by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM drivers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// Create new driver
router.post('/', async (req: Request, res: Response) => {
  try {
    const driver: Driver = req.body;
    const result = await query(
      `INSERT INTO drivers (first_name, last_name, phone, email, license_number, vehicle_type, vehicle_registration, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        driver.first_name,
        driver.last_name,
        driver.phone,
        driver.email,
        driver.license_number,
        driver.vehicle_type,
        driver.vehicle_registration,
        driver.is_available !== undefined ? driver.is_available : true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// Update driver
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driver: Driver = req.body;

    const result = await query(
      `UPDATE drivers
       SET first_name = $1, last_name = $2, phone = $3, email = $4,
           license_number = $5, vehicle_type = $6, vehicle_registration = $7,
           is_available = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        driver.first_name,
        driver.last_name,
        driver.phone,
        driver.email,
        driver.license_number,
        driver.vehicle_type,
        driver.vehicle_registration,
        driver.is_available,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// Delete driver
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM drivers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

export default router;
