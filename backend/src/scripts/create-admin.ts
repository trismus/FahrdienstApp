// backend/src/scripts/create-admin.ts
import bcrypt from 'bcrypt';
import { pool, query } from '../database/connection';

const createAdmin = async () => {
  const adminUsername = 'admin';
  const adminEmail = 'admin@example.com';
  const adminPassword = 'changeme'; // IMPORTANT: Change this password after first login
  const adminRole = 'admin';

  console.log('Starting admin user creation script...');

  try {
    // Check if admin user already exists
    const existingUser = await query('SELECT * FROM users WHERE username = $1', [adminUsername]);

    if (existingUser.rowCount > 0) {
      console.log(`User "${adminUsername}" already exists. No action taken.`);
      return;
    }

    console.log(`User "${adminUsername}" not found, creating new admin user...`);

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    console.log('Password hashed successfully.');

    // Insert the new admin user
    const result = await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, role',
      [adminUsername, adminEmail, passwordHash, adminRole]
    );

    if (result.rowCount > 0) {
      console.log('---');
      console.log('✅ Admin user created successfully!');
      console.log('---');
      console.log('You can now log in with the following credentials:');
      console.log(`Username: ${adminUsername}`);
      console.log(`Password: ${adminPassword}`);
      console.log('---');
      console.log('⚠️ IMPORTANT: Please change this password immediately after your first login.');
      console.log('---');
    } else {
      throw new Error('Failed to insert admin user into the database.');
    }
  } catch (error) {
    console.error('❌ An error occurred during admin creation:', error);
  } finally {
    console.log('Closing database connection...');
    await pool.end();
    console.log('Database connection closed.');
  }
};

// Run the script
createAdmin();
