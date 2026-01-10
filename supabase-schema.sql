-- Supabase Database Schema for ICAMS Project
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  login_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'admin_assistant', 'staff')),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- In production, use Supabase Auth instead
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  purchase_date DATE NOT NULL,
  warranty_expiry DATE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'maintenance', 'inactive')),
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id VARCHAR(255) NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  staff_id VARCHAR(255) NOT NULL,
  staff_name VARCHAR(255) NOT NULL,
  issue_description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(255) NOT NULL,
  staff_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL CHECK (status IN ('new', 'reviewed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('maintenance', 'warranty', 'general')),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_assets_asset_id ON assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_staff_id ON maintenance_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_feedback_staff_id ON feedback(staff_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- Enable Row Level Security (RLS) - Optional but recommended
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security requirements)
-- Example: Allow authenticated users to read their own data
-- CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);

-- Insert demo data (optional)
INSERT INTO users (id, login_id, name, role, email, password) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Admin User', 'admin', 'admin@icams.edu', 'admin123'),
  ('00000000-0000-0000-0000-000000000002', 'assistant', 'Admin Assistant', 'admin_assistant', 'assistant@icams.edu', 'assist123'),
  ('00000000-0000-0000-0000-000000000003', 'staff', 'Staff Member', 'staff', 'staff@icams.edu', 'staff123')
ON CONFLICT (login_id) DO NOTHING;

INSERT INTO assets (id, asset_id, name, category, location, purchase_date, warranty_expiry, status) VALUES
  ('00000000-0000-0000-0000-000000000010', 'LAB-001', 'Dell Optiplex 7090', 'Computer', 'Computer Lab 1', '2023-01-15', '2026-01-15', 'active'),
  ('00000000-0000-0000-0000-000000000011', 'PROJ-045', 'Epson EB-2250U Projector', 'Projector', 'Conference Room A', '2023-03-20', '2025-03-20', 'active'),
  ('00000000-0000-0000-0000-000000000012', 'FURN-102', 'Office Desk Herman Miller', 'Furniture', 'Office Block B', '2022-11-10', NULL, 'active')
ON CONFLICT (asset_id) DO NOTHING;

