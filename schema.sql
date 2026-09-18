-- ==============================================================================
-- Roommate Finder - College 3rd Semester Project (Phase 5: Final Integration)
-- Database Schema: schema.sql
-- Relational Database: MySQL 8.0+
-- ==============================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS roommate_finder
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 2. Select Database
USE roommate_finder;

-- ------------------------------------------------------------------------------
-- 3. Table: users
-- Description: Stores student authentication credentials and personal identity.
-- Constraints:
--   - id: Primary Key (Auto-Incrementing integer)
--   - email: Unique Key (Prevents duplicate student registrations)
--   - password_hash: Bcrypt hash (Passphrase is never stored in plain text)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: student_profiles
-- Description: Stores living preferences, budget, and lifestyle habits.
-- Relationship: One-to-One with `users` (enforced via UNIQUE key on user_id).
-- Constraints:
--   - user_id: Foreign Key referencing users(id) ON DELETE CASCADE
-- ------------------------------------------------------------------------------
CREATE TABLE student_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  preferred_location VARCHAR(255) NOT NULL,
  min_budget INT NOT NULL,
  max_budget INT NOT NULL,
  food_preference VARCHAR(50) NOT NULL,
  smoking_preference VARCHAR(50) NOT NULL,
  study_habit VARCHAR(50) NOT NULL,
  sleeping_schedule VARCHAR(50) NOT NULL,
  cleanliness_preference VARCHAR(50) NOT NULL,
  preferred_roommates INT NOT NULL DEFAULT 1,
  about_me TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Seed Demonstration Data (Password for all sample students: Password123!)
-- Hash: $2a$10$O8A1txPXosgim/jNlMrw4.3AfOU81cFtfqKcsaVExVLKTRrSsj7sK
-- ------------------------------------------------------------------------------
INSERT INTO users (id, full_name, email, password_hash, age, gender, phone) VALUES
(1, 'Aarav Sharma', 'aarav@college.edu', '$2a$10$O8A1txPXosgim/jNlMrw4.3AfOU81cFtfqKcsaVExVLKTRrSsj7sK', 20, 'Male', '9876543210'),
(2, 'Priya Nair', 'priya@college.edu', '$2a$10$O8A1txPXosgim/jNlMrw4.3AfOU81cFtfqKcsaVExVLKTRrSsj7sK', 19, 'Female', '9876543211'),
(3, 'Rohan Patel', 'rohan@college.edu', '$2a$10$O8A1txPXosgim/jNlMrw4.3AfOU81cFtfqKcsaVExVLKTRrSsj7sK', 21, 'Male', '9876543212'),
(4, 'Sneha Mukherjee', 'sneha@college.edu', '$2a$10$O8A1txPXosgim/jNlMrw4.3AfOU81cFtfqKcsaVExVLKTRrSsj7sK', 20, 'Female', '9876543213'),
(5, 'Vikram Singh', 'vikram@college.edu', '$2a$10$O8A1txPXosgim/jNlMrw4.3AfOU81cFtfqKcsaVExVLKTRrSsj7sK', 22, 'Male', '9876543214');

INSERT INTO student_profiles (user_id, preferred_location, min_budget, max_budget, food_preference, smoking_preference, study_habit, sleeping_schedule, cleanliness_preference, preferred_roommates, about_me) VALUES
(1, 'North Campus', 5000, 8000, 'Vegetarian', 'Non-Smoker', 'Quiet', 'Night Owl', 'High', 1, 'Computer Science 3rd semester student. Looking for a quiet, focused roommate near North Campus.'),
(2, 'West End', 4500, 7000, 'Vegetarian', 'Non-Smoker', 'Moderate', 'Early Sleeper', 'High', 2, 'Design major who spends free time sketching. Clean, hygienic and respects personal quiet hours.'),
(3, 'South Campus', 7000, 11000, 'Non-Vegetarian', 'Non-Smoker', 'Moderate', 'Early Sleeper', 'Moderate', 1, 'Mechanical Engineering student. Fitness enthusiast, early riser, tidy and looking for a 2BHK flatmate.'),
(4, 'North Campus', 6000, 9500, 'Non-Vegetarian', 'No Preference', 'Flexible', 'Night Owl', 'Moderate', 2, 'Law student preparing for competitive moot court. Friendly, cooperative and loves collaborative study sessions.'),
(5, 'University Town', 8000, 13000, 'Vegetarian', 'Non-Smoker', 'Quiet', 'Flexible', 'High', 1, 'Data science enthusiast looking for a peaceful flat close to the university library.');

-- Verification Queries
SHOW TABLES;
SELECT id, full_name, email, age, gender, phone FROM users;
SELECT * FROM student_profiles;
