-- ====================================================================
-- Flyway / PostgreSQL Migration: V1.0.4__add_google_auth_to_users.sql
-- Description: Add Google OAuth 2.0 / OpenID Connect authentication support columns to users table.
-- Compatible with PostgreSQL 16
-- ====================================================================

-- 1. Ubah password_hash menjadi NULLABLE karena akun dari Google OAuth tidak memiliki password lokal
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Tambahkan kolom google_id (sub claim), avatar_url, dan auth_provider
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1024),
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'LOCAL' NOT NULL;

-- 3. Tambahkan UNIQUE constraint dan index untuk google_id guna mempercepat login dan mencegah duplikasi
ALTER TABLE users ADD CONSTRAINT uk_users_google_id UNIQUE (google_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users (auth_provider);

-- 4. Check constraint untuk memastikan auth_provider yang valid
ALTER TABLE users ADD CONSTRAINT chk_users_auth_provider CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));
