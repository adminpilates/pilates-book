-- Insert default session types
INSERT INTO session_types (name, description, capacity, duration, color) VALUES
('Beginner Pilates', 'Perfect for those new to Pilates. Focus on basic movements and breathing techniques.', 8, 60, 'bg-green-100 text-green-800'),
('Intermediate Pilates', 'Build strength and flexibility with more challenging exercises.', 6, 75, 'bg-blue-100 text-blue-800'),
('Advanced Pilates', 'Intensive workout for experienced practitioners. Advanced techniques and equipment.', 4, 90, 'bg-purple-100 text-purple-800');

-- Insert sample sessions for the next week
INSERT INTO sessions (session_type_id, date, time) VALUES
-- Beginner sessions
(1, '2024-01-15', '09:00'),
(1, '2024-01-15', '18:00'),
(1, '2024-01-16', '09:00'),
(1, '2024-01-16', '18:00'),
(1, '2024-01-17', '09:00'),
(1, '2024-01-17', '18:00'),

-- Intermediate sessions
(2, '2024-01-15', '10:00'),
(2, '2024-01-15', '19:00'),
(2, '2024-01-16', '10:00'),
(2, '2024-01-16', '19:00'),
(2, '2024-01-17', '10:00'),
(2, '2024-01-17', '19:00'),

-- Advanced sessions
(3, '2024-01-15', '11:00'),
(3, '2024-01-15', '17:00'),
(3, '2024-01-16', '11:00'),
(3, '2024-01-16', '17:00'),
(3, '2024-01-17', '11:00'),
(3, '2024-01-17', '17:00');

-- Insert some sample bookings
INSERT INTO bookings (session_id, first_name, last_name, email, phone, experience, medical_conditions) VALUES
(1, 'Sarah', 'Johnson', 'sarah.johnson@email.com', '(555) 123-4567', 'BEGINNER', 'Lower back issues'),
(1, 'Mike', 'Chen', 'mike.chen@email.com', '(555) 234-5678', 'BEGINNER', ''),
(1, 'Emma', 'Wilson', 'emma.wilson@email.com', '(555) 345-6789', 'BEGINNER', ''),
(7, 'David', 'Brown', 'david.brown@email.com', '(555) 456-7890', 'INTERMEDIATE', ''),
(7, 'Lisa', 'Garcia', 'lisa.garcia@email.com', '(555) 567-8901', 'INTERMEDIATE', 'Knee surgery recovery'),
(13, 'John', 'Smith', 'john.smith@email.com', '(555) 678-9012', 'ADVANCED', '');
