-- ===========================================================================
-- 030_kpi_customer_and_channel_analytics.sql
-- Customer Loyalty, Booking Channels, and Demographics Analytics Layer
-- ===========================================================================

-- 1. View: Customer Loyalty & Spending Segmentation (RFM: Recency, Frequency, Monetary)
CREATE OR REPLACE VIEW view_customer_loyalty_analytics AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email,
    c.phone,
    c.nationality,
    COUNT(r.reservation_id) AS total_bookings,
    COUNT(r.reservation_id) FILTER (WHERE r.status_id IN (2, 3, 4)) AS completed_bookings,
    COALESCE(SUM(r.check_out_date - r.check_in_date) FILTER (WHERE r.status_id IN (2, 3, 4)), 0) AS total_nights_stayed,
    COALESCE(SUM(r.final_amount) FILTER (WHERE r.status_id IN (2, 3, 4)), 0) AS total_spend,
    ROUND(COALESCE(AVG(r.final_amount) FILTER (WHERE r.status_id IN (2, 3, 4)), 0), 2) AS avg_booking_value,
    MAX(r.check_in_date) AS last_booking_date,
    CASE 
        WHEN COALESCE(SUM(r.final_amount) FILTER (WHERE r.status_id IN (2, 3, 4)), 0) >= 100000 THEN 'VIP_PLATINUM'
        WHEN COALESCE(SUM(r.final_amount) FILTER (WHERE r.status_id IN (2, 3, 4)), 0) >= 40000 THEN 'VIP_GOLD'
        WHEN COUNT(r.reservation_id) FILTER (WHERE r.status_id IN (2, 3, 4)) >= 3 THEN 'REPEAT_GUEST'
        ELSE 'REGULAR_GUEST'
    END AS loyalty_tier
FROM customers c
LEFT JOIN reservations r ON c.customer_id = r.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.phone, c.nationality;


-- 2. Function: Get Top Spending VIP Customers
CREATE OR REPLACE FUNCTION get_top_spending_customers(p_limit INT DEFAULT 20)
RETURNS TABLE (
    customer_id INT,
    customer_name TEXT,
    phone TEXT,
    nationality TEXT,
    total_bookings BIGINT,
    total_nights_stayed BIGINT,
    total_spend NUMERIC,
    avg_booking_value NUMERIC,
    loyalty_tier TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.customer_id,
        v.customer_name::TEXT,
        v.phone::TEXT,
        v.nationality::TEXT,
        v.completed_bookings AS total_bookings,
        v.total_nights_stayed,
        ROUND(v.total_spend, 2) AS total_spend,
        v.avg_booking_value,
        v.loyalty_tier::TEXT
    FROM view_customer_loyalty_analytics v
    WHERE v.total_spend > 0
    ORDER BY v.total_spend DESC
    LIMIT p_limit;
END;
$$;


-- 3. Function: Booking Channel Performance Summary
CREATE OR REPLACE FUNCTION get_booking_channel_performance_summary(
    p_start_date DATE DEFAULT '2026-06-01',
    p_end_date DATE DEFAULT '2026-11-30'
)
RETURNS TABLE (
    booking_source TEXT,
    total_bookings BIGINT,
    confirmed_bookings BIGINT,
    cancelled_bookings BIGINT,
    cancellation_rate_pct NUMERIC,
    total_nights_sold BIGINT,
    total_gross_revenue NUMERIC,
    total_discounts NUMERIC,
    total_net_revenue NUMERIC,
    revenue_share_pct NUMERIC,
    adr NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
    v_total_channel_revenue NUMERIC;
BEGIN
    SELECT COALESCE(SUM(final_amount), 1)
    INTO v_total_channel_revenue
    FROM reservations
    WHERE check_in_date >= p_start_date AND check_in_date <= p_end_date AND status_id IN (2, 3, 4);

    RETURN QUERY
    SELECT 
        COALESCE(r.booking_source, 'UNKNOWN')::TEXT AS booking_source,
        COUNT(r.reservation_id) AS total_bookings,
        COUNT(r.reservation_id) FILTER (WHERE s.status_code IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')) AS confirmed_bookings,
        COUNT(r.reservation_id) FILTER (WHERE s.status_code = 'CANCELLED') AS cancelled_bookings,
        ROUND((COUNT(r.reservation_id) FILTER (WHERE s.status_code = 'CANCELLED')::NUMERIC / NULLIF(COUNT(r.reservation_id), 0)) * 100, 2) AS cancellation_rate_pct,
        COALESCE(SUM(r.check_out_date - r.check_in_date) FILTER (WHERE s.status_code IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')), 0) AS total_nights_sold,
        ROUND(COALESCE(SUM(r.gross_amount) FILTER (WHERE s.status_code <> 'CANCELLED'), 0), 2) AS total_gross_revenue,
        ROUND(COALESCE(SUM(r.discount_amount) FILTER (WHERE s.status_code <> 'CANCELLED'), 0), 2) AS total_discounts,
        ROUND(COALESCE(SUM(r.final_amount) FILTER (WHERE s.status_code <> 'CANCELLED'), 0), 2) AS total_net_revenue,
        ROUND((COALESCE(SUM(r.final_amount) FILTER (WHERE s.status_code <> 'CANCELLED'), 0) / v_total_channel_revenue) * 100, 2) AS revenue_share_pct,
        ROUND(COALESCE(SUM(r.final_amount) FILTER (WHERE s.status_code <> 'CANCELLED'), 0) / NULLIF(SUM(r.check_out_date - r.check_in_date) FILTER (WHERE s.status_code IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')), 0), 2) AS adr
    FROM reservations r
    JOIN reservation_statuses s ON r.status_id = s.status_id
    WHERE r.check_in_date >= p_start_date AND r.check_in_date <= p_end_date
    GROUP BY r.booking_source
    ORDER BY total_net_revenue DESC;
END;
$$;


-- 4. Function: Demographics & Geographical Revenue Summary
CREATE OR REPLACE FUNCTION get_demographic_revenue_summary(
    p_start_date DATE DEFAULT '2026-06-01',
    p_end_date DATE DEFAULT '2026-11-30'
)
RETURNS TABLE (
    nationality TEXT,
    total_customers BIGINT,
    total_bookings BIGINT,
    total_nights_stayed BIGINT,
    total_revenue NUMERIC,
    revenue_share_pct NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
    v_grand_revenue NUMERIC;
BEGIN
    SELECT COALESCE(SUM(final_amount), 1)
    INTO v_grand_revenue
    FROM reservations
    WHERE check_in_date >= p_start_date AND check_in_date <= p_end_date AND status_id IN (2, 3, 4);

    RETURN QUERY
    SELECT 
        COALESCE(c.nationality, 'غير محدد')::TEXT AS nationality,
        COUNT(DISTINCT c.customer_id) AS total_customers,
        COUNT(DISTINCT r.reservation_id) AS total_bookings,
        COALESCE(SUM(r.check_out_date - r.check_in_date), 0) AS total_nights_stayed,
        ROUND(COALESCE(SUM(r.final_amount), 0), 2) AS total_revenue,
        ROUND((COALESCE(SUM(r.final_amount), 0) / v_grand_revenue) * 100, 2) AS revenue_share_pct
    FROM customers c
    JOIN reservations r ON c.customer_id = r.customer_id AND r.status_id IN (2, 3, 4) AND r.check_in_date >= p_start_date AND r.check_in_date <= p_end_date
    GROUP BY c.nationality
    ORDER BY total_revenue DESC;
END;
$$;
