-- Add price column to session_types table
ALTER TABLE session_types ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Update existing session types with sample prices (in IDR)
UPDATE session_types SET price = 150000 WHERE name = 'Beginner Pilates';
UPDATE session_types SET price = 200000 WHERE name = 'Intermediate Pilates';
UPDATE session_types SET price = 250000 WHERE name = 'Advanced Pilates';
