import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database/connection';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const result = await query(
      'SELECT id, username, email, password_hash, role, driver_id FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Check if password_hash exists
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.driver_id = user.driver_id;

    // Return user info (without password hash)
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      driver_id: user.driver_id,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user endpoint
router.get('/me', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;

    const result = await query(
      'SELECT id, username, email, role, driver_id FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

export default router;
