-- ====================================================================
-- Flyway / PostgreSQL Migration: V1.0.3__create_user_table.sql
-- Description: Create users table with UUID primary key, timezone-aware timestamp, unique constraints, and high-performance indexing for authentication & RBAC.
-- Compatible with PostgreSQL 16
-- ====================================================================

-- Pastikan ekstensi pgcrypto / pgcrypto atau built-in gen_random_uuid() tersedia (default di PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'User',
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    is_verified BOOLEAN DEFAULT false,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- UNIQUE constraint pada kolom email untuk mencegah duplikasi akun
    CONSTRAINT uk_users_email UNIQUE (email),
    
    -- Check constraint untuk memastikan role yang valid
    CONSTRAINT chk_users_role CHECK (role IN ('CUSTOMER', 'CASHIER', 'ADMIN'))
);

-- Index berkinerja tinggi untuk pencarian cepat saat proses Login (query by email)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index pada kolom role untuk mempercepat filter query pada Admin Dashboard / RBAC
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Index komposit untuk pencarian pengguna aktif berdasarkan role dan verifikasi
CREATE INDEX IF NOT EXISTS idx_users_role_verified ON users (role, is_verified);

-- ====================================================================
-- Seed Initial Demo Users (Password hash untuk 'admin123', 'kasir123', 'budi123' menggunakan Bcrypt / MD5 / SHA dummy atau bcrypt standar Quarkus Elytron)
-- ====================================================================
INSERT INTO users (name, email, phone, password_hash, role, is_verified, birth_date)
VALUES
('Admin Utama', 'admin@movietickets.id', '081111111111', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.a0k1R6a0l0a0l0a0l0a0l0a0l0a0l0', 'ADMIN', true, '1985-01-01'),
('Kasir Bioskop 1', 'kasir@movietickets.id', '082222222222', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.a0k1R6a0l0a0l0a0l0a0l0a0l0a0l0', 'CASHIER', true, '1995-05-15'),
('Budi Santoso', 'budi@gmail.com', '081234567890', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.a0k1R6a0l0a0l0a0l0a0l0a0l0a0l0', 'CUSTOMER', true, '1998-08-17')
ON CONFLICT (email) DO NOTHING;
