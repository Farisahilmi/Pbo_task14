-- V1.0.5: Add indexes for performance optimization and document ticket self-healing mechanism

-- Add indexes on bookings table for faster queries by user_id and status
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings(booking_code);

-- Add indexes on tickets table for faster query by booking_id
CREATE INDEX IF NOT EXISTS idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);

-- Note: Ticket repair for existing PAID bookings without tickets is automatically handled
-- by TicketService.repairMissingTicketsOnStartup() during Quarkus startup to ensure
-- proper UUID generation and seat labeling without complex PL/pgSQL routines.
