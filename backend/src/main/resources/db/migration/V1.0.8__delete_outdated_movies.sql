-- V1.0.8__delete_outdated_movies.sql

-- Identifikasi film yang akan dihapus berdasarkan judul spesifik dan kriteria kedaluwarsa/tidak valid
CREATE TEMP TABLE movies_to_delete AS
SELECT id FROM movies
WHERE title IN ('KKN di Desa Penari', 'Dune', 'Dune: Part One', 'Dune: Part Two')
   OR release_date < CURRENT_DATE - INTERVAL '6 months'
   OR poster_url IS NULL OR poster_url = ''
   OR trailer_url IS NULL OR trailer_url = '';

-- 1. Hapus ticket yang terkait booking_seat dari showtime film tersebut
DELETE FROM tickets
WHERE booking_id IN (
    SELECT id FROM bookings WHERE showtime_id IN (
        SELECT id FROM showtimes WHERE movie_id IN (SELECT id FROM movies_to_delete)
    )
);

-- 2. Hapus booking_seats yang terkait bookings dari showtime film tersebut
DELETE FROM booking_seats
WHERE booking_id IN (
    SELECT id FROM bookings WHERE showtime_id IN (
        SELECT id FROM showtimes WHERE movie_id IN (SELECT id FROM movies_to_delete)
    )
);

-- 3. Hapus payments yang terkait bookings
DELETE FROM payments
WHERE booking_id IN (
    SELECT id FROM bookings WHERE showtime_id IN (
        SELECT id FROM showtimes WHERE movie_id IN (SELECT id FROM movies_to_delete)
    )
);

-- 4. Hapus bookings yang terkait showtimes
DELETE FROM bookings
WHERE showtime_id IN (
    SELECT id FROM showtimes WHERE movie_id IN (SELECT id FROM movies_to_delete)
);

-- 5. Hapus showtimes
DELETE FROM showtimes
WHERE movie_id IN (SELECT id FROM movies_to_delete);

-- 6. Terakhir, hapus film-film tersebut
DELETE FROM movies
WHERE id IN (SELECT id FROM movies_to_delete);

-- Hapus temporary table
DROP TABLE movies_to_delete;
