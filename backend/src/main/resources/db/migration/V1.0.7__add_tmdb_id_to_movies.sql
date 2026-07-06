-- ============================================================
-- Flyway Migration: V1.0.7__add_tmdb_id_to_movies.sql
-- Description: Add tmdb_id column (BIGINT, UNIQUE) to movies table
--              for deduplication and accurate TMDB upsert
-- ============================================================

ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_id BIGINT;

-- Unique constraint to prevent duplicate imports of the same TMDB film
ALTER TABLE movies DROP CONSTRAINT IF EXISTS uq_movies_tmdb_id;
ALTER TABLE movies ADD CONSTRAINT uq_movies_tmdb_id UNIQUE (tmdb_id);

-- Performance index for lookup during upsert
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies (tmdb_id);
