-- ==============================================
-- MBC Department Management System
-- Database Initialization Script
-- ==============================================

-- Create database if it doesn't exist
-- Note: This will be handled by Docker environment variables

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (these will be created by Prisma migrations)
-- This file serves as documentation and backup

-- ==============================================
-- Initial System Configuration
-- ==============================================

-- Insert default system configuration
-- This will be handled by the application seeder

-- ==============================================
-- Indexes for Performance
-- ==============================================

-- These indexes will be created by Prisma migrations
-- Listed here for reference:

-- User indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- CREATE INDEX IF NOT EXISTS idx_users_institution_branch ON users(institution_id, branch_id);

-- Course indexes
-- CREATE INDEX IF NOT EXISTS idx_courses_branch_semester ON courses(branch_id, semester);
-- CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

-- Assignment indexes
-- CREATE INDEX IF NOT EXISTS idx_assignments_course_due_date ON assignments(course_id, due_date);
-- CREATE INDEX IF NOT EXISTS idx_assignments_professor ON assignments(professor_id);

-- Attendance indexes
-- CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON attendance(course_id, date);
-- CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);

-- Submission indexes
-- CREATE INDEX IF NOT EXISTS idx_submissions_assignment_student ON submissions(assignment_id, student_id);
-- CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

-- Notice indexes
-- CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at);
-- CREATE INDEX IF NOT EXISTS idx_notices_expires_at ON notices(expires_at);

-- Audit log indexes
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ==============================================
-- Row Level Security (RLS) Setup
-- ==============================================

-- Enable RLS on sensitive tables
-- This will be configured in Supabase dashboard or via migrations

-- ==============================================
-- Database Maintenance
-- ==============================================

-- Set up automatic cleanup for old audit logs (optional)
-- This can be implemented as a scheduled job

COMMENT ON DATABASE mbc_db IS 'MBC Department Management System Database - Modern TypeScript Implementation';