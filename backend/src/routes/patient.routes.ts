import { Router, Request, Response } from 'express';
import { query } from '../database/connection';
import { Patient } from '../models/types';

const router = Router();

// Get all patients
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM patients WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient
router.post('/', async (req: Request, res: Response) => {
  try {
    const patient: Patient = req.body;
    const result = await query(
      `INSERT INTO patients (first_name, last_name, date_of_birth, phone, email, address, medical_notes, emergency_contact_name, emergency_contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        patient.first_name,
        patient.last_name,
        patient.date_of_birth,
        patient.phone,
        patient.email,
        patient.address,
        patient.medical_notes,
        patient.emergency_contact_name,
        patient.emergency_contact_phone
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patient: Patient = req.body;

    const result = await query(
      `UPDATE patients
       SET first_name = $1, last_name = $2, date_of_birth = $3, phone = $4,
           email = $5, address = $6, medical_notes = $7,
           emergency_contact_name = $8, emergency_contact_phone = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        patient.first_name,
        patient.last_name,
        patient.date_of_birth,
        patient.phone,
        patient.email,
        patient.address,
        patient.medical_notes,
        patient.emergency_contact_name,
        patient.emergency_contact_phone,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export default router;
