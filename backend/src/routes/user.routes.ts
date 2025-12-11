import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database/connection';
import { isAdmin, isSelfOrAdmin } from '../middleware/auth';
import { User } from '../models/types';

const router = Router();

// All user routes require admin role except password change
// which can be done by self or admin

// Get all users (Admin only)
router.get('/', isAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, username, email, role, driver_id, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (Admin only)
router.get('/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, username, email, role, driver_id, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (Admin only)
router.post('/', isAdmin, async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, driver_id } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Username, email, password, and role are required' });
    }

    // Validate role
    if (!['admin', 'dispatcher', 'driver'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // If role is driver, driver_id is required
    if (role === 'driver' && !driver_id) {
      return res.status(400).json({ error: 'driver_id is required for driver role' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, driver_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, driver_id, created_at, updated_at`,
      [username, email, password_hash, role, driver_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.constraint === 'users_username_key') {
        return res.status(409).json({ error: 'Username already exists' });
      }
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, role, driver_id } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ error: 'Username, email, and role are required' });
    }

    // Validate role
    if (!['admin', 'dispatcher', 'driver'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // If role is driver, driver_id is required
    if (role === 'driver' && !driver_id) {
      return res.status(400).json({ error: 'driver_id is required for driver role' });
    }

    const result = await query(
      `UPDATE users
       SET username = $1, email = $2, role = $3, driver_id = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, username, email, role, driver_id, created_at, updated_at`,
      [username, email, role, driver_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating user:', error);

    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.constraint === 'users_username_key') {
        return res.status(409).json({ error: 'Username already exists' });
      }
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (parseInt(id) === req.session.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change password (Self or Admin)
router.patch('/:id/password', isSelfOrAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id`,
      [password_hash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
