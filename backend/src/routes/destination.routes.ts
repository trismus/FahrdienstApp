import { Router, Request, Response } from 'express';
import { query } from '../database/connection';
import { Destination } from '../models/types';
import { isOperator } from '../middleware/auth';

const router = Router();

// All destination routes require operator or admin role

// Get all destinations
router.get('/', isOperator, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM destinations ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// Get active destinations only
router.get('/active', isOperator, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM destinations WHERE is_active = true ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active destinations:', error);
    res.status(500).json({ error: 'Failed to fetch active destinations' });
  }
});

// Get destinations by type
router.get('/type/:type', isOperator, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const result = await query(
      'SELECT * FROM destinations WHERE type = $1 AND is_active = true ORDER BY name ASC',
      [type]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching destinations by type:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// Get destination by ID
router.get('/:id', isOperator, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM destinations WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching destination:', error);
    res.status(500).json({ error: 'Failed to fetch destination' });
  }
});

// Create new destination
router.post('/', isOperator, async (req: Request, res: Response) => {
  try {
    const destination: Destination = req.body;
    const result = await query(
      `INSERT INTO destinations (name, type, address, city, postal_code, phone, email, contact_person, notes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        destination.name,
        destination.type,
        destination.address,
        destination.city,
        destination.postal_code,
        destination.phone,
        destination.email,
        destination.contact_person,
        destination.notes,
        destination.is_active !== undefined ? destination.is_active : true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating destination:', error);
    res.status(500).json({ error: 'Failed to create destination' });
  }
});

// Update destination
router.put('/:id', isOperator, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const destination: Destination = req.body;

    const result = await query(
      `UPDATE destinations
       SET name = $1, type = $2, address = $3, city = $4,
           postal_code = $5, phone = $6, email = $7,
           contact_person = $8, notes = $9, is_active = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        destination.name,
        destination.type,
        destination.address,
        destination.city,
        destination.postal_code,
        destination.phone,
        destination.email,
        destination.contact_person,
        destination.notes,
        destination.is_active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).json({ error: 'Failed to update destination' });
  }
});

// Delete destination
router.delete('/:id', isOperator, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM destinations WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({ error: 'Failed to delete destination' });
  }
});

export default router;
