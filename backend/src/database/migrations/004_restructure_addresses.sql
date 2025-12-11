-- Migration: Restructure addresses into separate fields
-- Splits address field into street, house_number, city, and postal_code

-- Step 1: Add new address fields to patients table
ALTER TABLE patients
ADD COLUMN street VARCHAR(200),
ADD COLUMN house_number VARCHAR(20),
ADD COLUMN city VARCHAR(100),
ADD COLUMN postal_code VARCHAR(20);

-- Step 2: Migrate existing address data (if needed, can be done manually)
-- Note: This assumes addresses are currently in a single field
-- Manual data migration may be required after this migration

-- Step 3: Add comment for clarity
COMMENT ON COLUMN patients.address IS 'Deprecated: Use street, house_number, city, postal_code instead';
COMMENT ON COLUMN patients.street IS 'Street name';
COMMENT ON COLUMN patients.house_number IS 'House/building number';
COMMENT ON COLUMN patients.city IS 'City name';
COMMENT ON COLUMN patients.postal_code IS 'Postal/ZIP code';

-- Step 4: Add new address fields to destinations table
ALTER TABLE destinations
ADD COLUMN street VARCHAR(200),
ADD COLUMN house_number VARCHAR(20);

-- Note: destinations table already has city and postal_code columns

-- Step 5: Add comment for clarity
COMMENT ON COLUMN destinations.address IS 'Deprecated: Use street, house_number, city, postal_code instead';
COMMENT ON COLUMN destinations.street IS 'Street name';
COMMENT ON COLUMN destinations.house_number IS 'House/building number';

-- Step 6: Create index for city searches
CREATE INDEX IF NOT EXISTS idx_patients_city ON patients(city);
CREATE INDEX IF NOT EXISTS idx_patients_postal_code ON patients(postal_code);

-- Note: Indexes for destinations city/postal_code already exist

-- After migration, you can optionally drop the old address column:
-- ALTER TABLE patients DROP COLUMN address;
-- ALTER TABLE destinations DROP COLUMN address;
-- But we keep it for now for backwards compatibility
