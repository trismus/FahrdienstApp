-- Migration: Add user-driver link and session storage
-- Links driver users to driver records and sets up session storage

-- Step 1: Add driver_id to users table
ALTER TABLE users
ADD COLUMN driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL;

-- Step 2: Create index for driver_id lookups
CREATE INDEX IF NOT EXISTS idx_users_driver_id ON users(driver_id);

-- Step 3: Add constraint to ensure driver role has driver_id
-- Note: We check role != 'driver' OR driver_id IS NOT NULL
-- This allows admin and dispatcher to have NULL driver_id
ALTER TABLE users
ADD CONSTRAINT check_driver_has_driver_id
  CHECK (role != 'driver' OR driver_id IS NOT NULL);

-- Step 4: Create session table for express-session with connect-pg-simple
-- This table stores user sessions
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Step 5: Add comments for documentation
COMMENT ON COLUMN users.driver_id IS 'Foreign key to drivers table. Required for users with role=driver';
COMMENT ON TABLE "session" IS 'Session storage for express-session';
