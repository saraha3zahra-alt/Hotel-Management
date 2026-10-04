-- ===========================================================================
-- 040_kpi_advanced_predictive_analytics.sql
-- Advanced Hotel Analytics: Promotions Effectiveness, Lead Time Windows, 
-- Seasonal Elasticity & Payment Method Breakdown
-- ===========================================================================

-- 1. Function: Promotion & Discount Effectiveness Analytics
CREATE OR REPLACE FUNCTION get_promotion_effectiveness_summary(
    p_start_date DATE DEFAULT '2026-06-01',
    p_end_date DATE DEFAULT '2026-11-30'
)
RETURNS TABLE (
    promotion_id INT,
    promotion_code TEXT,
    promotion_name TEXT,
    total_redemptions BIGINT,
    total_discount_given NUMERIC,
    total_net_revenue NUMERIC,
    avg_discount_per_booking NUMERIC,
    revenue_generated_per_discount_pound NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.promotion_id,
        p.promotion_code::TEXT,
        p.promotion_name::TEXT,
        COUNT(r.reservation_id) AS total_redemptions,
        ROUND(COALESCE(SUM(r.discount_amount), 0), 2) AS total_discount_given,
        ROUND(COALESCE(SUM(r.final_amount), 0), 2) AS total_net_revenue,
        ROUND(COALESCE(AVG(r.discount_amount), 0), 2) AS avg_discount_per_booking,
        ROUND(COALESCE(SUM(r.final_amount) / NULLIF(SUM(r.discount_amount), 0), 0), 2) AS revenue_generated_per_discount_pound
    FROM promotions p
    JOIN reservations r ON r.discount_amount > 0 AND r.status_id IN (2, 3, 4) AND r.check_in_date >= p_start_date AND r.check_in_date <= p_end_date
    GROUP BY p.promotion_id, p.promotion_code, p.promotion_name
    ORDER BY total_net_revenue DESC;
END;
$$;


-- 2. Function: Booking Lead-Time Window Analytics (Advance Booking Behavior)
CREATE OR REPLACE FUNCTION get_booking_lead_time_analytics(
    p_start_date DATE DEFAULT '2026-06-01',
    p_end_date DATE DEFAULT '2026-11-30'
)
RETURNS TABLE (
    lead_time_window TEXT,
    total_bookings BIGINT,
    confirmed_bookings BIGINT,
    cancelled_bookings BIGINT,
    cancellation_rate_pct NUMERIC,
    total_net_revenue NUMERIC,
    adr NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH lead_time_calc AS (
        SELECT 
            r.reservation_id,
            r.status_id,
            s.status_code,
            (r.check_in_date - r.created_at::DATE) AS lead_days,
            (r.check_out_date - r.check_in_date) AS nights,
            r.final_amount AS net_val,
            CASE 
                WHEN (r.check_in_date - r.created_at::DATE) <= 2 THEN '1. LAST_MINUTE (0-2 Days)'
                WHEN (r.check_in_date - r.created_at::DATE) BETWEEN 3 AND 7 THEN '2. SHORT_NOTICE (3-7 Days)'
                WHEN (r.check_in_date - r.created_at::DATE) BETWEEN 8 AND 30 THEN '3. STANDARD (8-30 Days)'
                ELSE '4. ADVANCE_BOOKING (> 30 Days)'
            END AS window_category
        FROM reservations r
        JOIN reservation_statuses s ON r.status_id = s.status_id
        WHERE r.check_in_date >= p_start_date AND r.check_in_date <= p_end_date
    )
    SELECT 
        l.window_category::TEXT AS lead_time_window,
        COUNT(l.reservation_id) AS total_bookings,
        COUNT(l.reservation_id) FILTER (WHERE l.status_code IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')) AS confirmed_bookings,
        COUNT(l.reservation_id) FILTER (WHERE l.status_code = 'CANCELLED') AS cancelled_bookings,
        ROUND((COUNT(l.reservation_id) FILTER (WHERE l.status_code = 'CANCELLED')::NUMERIC / NULLIF(COUNT(l.reservation_id), 0)) * 100, 2) AS cancellation_rate_pct,
        ROUND(COALESCE(SUM(l.net_val) FILTER (WHERE l.status_code <> 'CANCELLED'), 0), 2) AS total_net_revenue,
        ROUND(COALESCE(SUM(l.net_val) FILTER (WHERE l.status_code <> 'CANCELLED'), 0) / NULLIF(SUM(l.nights) FILTER (WHERE l.status_code IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')), 0), 2) AS adr
    FROM lead_time_calc l
    GROUP BY l.window_category
    ORDER BY l.window_category;
END;
$$;


-- 3. Function: Seasonal Pricing Elasticity & Demand Comparison
CREATE OR REPLACE FUNCTION get_seasonal_pricing_elasticity_summary(p_year INT DEFAULT 2026)
RETURNS TABLE (
    pricing_period_id INT,
    period_code TEXT,
    period_name TEXT,
    start_date DATE,
    end_date DATE,
    total_bookings BIGINT,
    occupied_nights BIGINT,
    total_net_revenue NUMERIC,
    adr NUMERIC,
    revpar NUMERIC,
    avg_discount_rate_pct NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.pricing_period_id,
        pp.period_code::TEXT,
        pp.period_name::TEXT,
        pp.start_date,
        pp.end_date,
        COUNT(r.reservation_id) AS total_bookings,
        COALESCE(SUM(r.check_out_date - r.check_in_date), 0) AS occupied_nights,
        ROUND(COALESCE(SUM(r.final_amount), 0), 2) AS total_net_revenue,
        ROUND(COALESCE(SUM(r.final_amount) / NULLIF(SUM(r.check_out_date - r.check_in_date), 0), 0), 2) AS adr,
        ROUND(COALESCE(SUM(r.final_amount) / NULLIF(75 * GREATEST((pp.end_date - pp.start_date + 1), 1), 0), 0), 2) AS revpar,
        ROUND((COALESCE(SUM(r.discount_amount), 0) / NULLIF(SUM(r.gross_amount), 0)) * 100, 2) AS avg_discount_rate_pct
    FROM pricing_periods pp
    LEFT JOIN reservations r ON r.check_in_date >= pp.start_date AND r.check_in_date <= pp.end_date AND r.status_id IN (2, 3, 4)
    WHERE EXTRACT(YEAR FROM pp.start_date) = p_year
    GROUP BY pp.pricing_period_id, pp.period_code, pp.period_name, pp.start_date, pp.end_date
    ORDER BY pp.priority;
END;
$$;


-- 4. Function: Payment Method & Financial Settlement Breakdown
CREATE OR REPLACE FUNCTION get_payment_method_breakdown(
    p_start_date DATE DEFAULT '2026-06-01',
    p_end_date DATE DEFAULT '2026-11-30'
)
RETURNS TABLE (
    payment_method_id INT,
    method_code TEXT,
    method_name TEXT,
    total_transactions BIGINT,
    total_amount_collected NUMERIC,
    avg_transaction_val NUMERIC,
    transaction_volume_share_pct NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
    v_total_collected NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount), 1)
    INTO v_total_collected
    FROM payments
    WHERE payment_date >= p_start_date AND payment_date <= p_end_date AND status IN ('SUCCESSFUL', 'COMPLETED');

    RETURN QUERY
    SELECT 
        pm.payment_method_id,
        pm.method_code::TEXT,
        pm.method_name::TEXT,
        COUNT(p.payment_id) AS total_transactions,
        ROUND(COALESCE(SUM(p.amount), 0), 2) AS total_amount_collected,
        ROUND(COALESCE(AVG(p.amount), 0), 2) AS avg_transaction_val,
        ROUND((COALESCE(SUM(p.amount), 0) / v_total_collected) * 100, 2) AS transaction_volume_share_pct
    FROM payment_methods pm
    LEFT JOIN payments p ON pm.payment_method_id = p.payment_method_id AND p.status IN ('SUCCESSFUL', 'COMPLETED') AND p.payment_date >= p_start_date AND p.payment_date <= p_end_date
    GROUP BY pm.payment_method_id, pm.method_code, pm.method_name
    ORDER BY total_amount_collected DESC;
END;
$$;
