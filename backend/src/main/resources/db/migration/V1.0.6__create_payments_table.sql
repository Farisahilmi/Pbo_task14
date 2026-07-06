-- V1.0.6: Create payments table for Midtrans Sandbox SNAP API integration

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    snap_token VARCHAR(255),
    redirect_url TEXT,
    gross_amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50) NOT NULL, -- PENDING, SETTLEMENT, CAPTURE, DENY, CANCEL, EXPIRE
    transaction_id VARCHAR(100), -- Transaction ID from Midtrans
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
