-- ===========================================================================
-- 020_kpi_layer_analytics.sql
-- Comprehensive KPI Analytics Layer for Majestic Hotel
-- Calculates Financial KPIs (ADR, RevPAR, Revenue, Expenses, Net Profit) 
-- and Operational KPIs (Occupancy %, ALOS, Cancellation Rate, Building Performance)
-- ===========================================================================

-- 1. Analytical View: Detailed Reservation Financials & Occupancy Nights
CREATE OR REPLACE VIEW view_reservation_analytics AS
SELECT 
    r.reservation_id,
    r.reservation_number,
    r.hotel_id,
    r.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.nationality,
    r.status_id,
    s.status_code,
    s.status_name,
    r.booking_source,
    r.check_in_date,
    r.check_out_date,
    (r.check_out_date - r.check_in_date) AS nights_count,
    DATE_TRUNC('month', r.check_in_date)::DATE AS reservation_month,
    r.gross_amount,
    r.discount_amount,
    r.final_amount AS net_amount,
    COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.reservation_id = r.reservation_id AND p.payment_status = 'COMPLETED'), 0) AS total_paid,
    COALESCE((SELECT SUM(ref.amount) FROM refunds ref WHERE ref.reservation_id = r.reservation_id AND ref.refund_status = 'COMPLETED'), 0) AS total_refunded
FROM reservations r
JOIN customers c ON r.customer_id = c.customer_id
JOIN reservation_statuses s ON r.status_id = s.status_id;


-- 2. Function: Overall Hotel Executive Dashboard KPIs (Date Range Filterable)
CREATE OR REPLACE FUNCTION get_hotel_executive_kpis(
    p_start_date DATE DEFAULT '2026-06-01',
    p_end_date DATE DEFAULT '2026-11-30'
)
RETURNS TABLE (
    total_reservations BIGINT,
    confirmed_checkedin_reservations BIGINT,
    cancelled_reservations BIGINT,
    cancellation_rate_pct NUMERIC,
    total_occupied_nights BIGINT,
    total_available_room_nights BIGINT,
    occupancy_rate_pct NUMERIC,
    total_gross_revenue NUMERIC,
    total_discounts NUMERIC,
    total_net_revenue NUMERIC,
    total_expenses NUMERIC,
    net_operating_profit NUMERIC,
    profit_margin_pct NUMERIC,
    adr NUMERIC,
    revpar NUMERIC,
    alos NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
    v_total_rooms INT := 75; -- Total hotel capacity
    v_total_days INT;
    v_available_room_nights BIGINT;
    v_occupied_nights BIGINT;
    v_total_res BIGINT;
    v_confirmed_res BIGINT;
    v_cancelled_res BIGINT;
    v_gross NUMERIC;
    v_discounts NUMERIC;
    v_net_rev NUMERIC;
    v_total_exp NUMERIC;
    v_profit NUMERIC;
BEGIN
    v_total_days := GREATEST((p_end_date - p_start_date + 1), 1);
    v_available_room_nights := v_total_rooms * v_total_days;

    -- Reservations metrics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status_code IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')),
        COUNT(*) FILTER (WHERE status_code = 'CANCELLED'),
        COALESCE(SUM(gross_amount) FILTER (WHERE status_code <> 'CANCELLED'), 0),
        COALESCE(SUM(discount_amount) FILTER (WHERE status_code <> 'CANCELLED'), 0),
        COALESCE(SUM(net_amount) FILTER (WHERE status_code <> 'CANCELLED'), 0),
        COALESCE(SUM(nights_count) FILTER (WHERE status_code IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')), 0)
    INTO 
        v_total_res,
        v_confirmed_res,
        v_cancelled_res,
        v_gross,
        v_discounts,
        v_net_rev,
        v_occupied_nights
    FROM view_reservation_analytics
    WHERE check_in_date >= p_start_date AND check_in_date <= p_end_date;

    -- Total expenses
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_exp
    FROM expenses
    WHERE expense_date >= p_start_date AND expense_date <= p_end_date AND payment_status = 'POSTED';

    v_profit := v_net_rev - v_total_exp;

    RETURN QUERY SELECT
        v_total_res AS total_reservations,
        v_confirmed_res AS confirmed_checkedin_reservations,
        v_cancelled_res AS cancelled_reservations,
        ROUND((v_cancelled_res::NUMERIC / NULLIF(v_total_res, 0)) * 100, 2) AS cancellation_rate_pct,
        v_occupied_nights AS total_occupied_nights,
        v_available_room_nights AS total_available_room_nights,
        ROUND((v_occupied_nights::NUMERIC / NULLIF(v_available_room_nights, 0)) * 100, 2) AS occupancy_rate_pct,
        ROUND(v_gross, 2) AS total_gross_revenue,
        ROUND(v_discounts, 2) AS total_discounts,
        ROUND(v_net_rev, 2) AS total_net_revenue,
        ROUND(v_total_exp, 2) AS total_expenses,
        ROUND(v_profit, 2) AS net_operating_profit,
        ROUND((v_profit / NULLIF(v_net_rev, 0)) * 100, 2) AS profit_margin_pct,
        ROUND(v_net_rev / NULLIF(v_occupied_nights, 0), 2) AS adr,
        ROUND(v_net_rev / NULLIF(v_available_room_nights, 0), 2) AS revpar,
        ROUND(v_occupied_nights::NUMERIC / NULLIF(v_confirmed_res, 0), 2) AS alos;
END;
$$;


-- 3. Function: Monthly P&L and Operational Performance Summary
CREATE OR REPLACE FUNCTION get_monthly_pnl_summary(p_year INT DEFAULT 2026)
RETURNS TABLE (
    month_code TEXT,
    month_name TEXT,
    reservations_count BIGINT,
    occupied_nights BIGINT,
    occupancy_rate_pct NUMERIC,
    gross_revenue NUMERIC,
    discounts NUMERIC,
    net_revenue NUMERIC,
    total_expenses NUMERIC,
    net_profit NUMERIC,
    adr NUMERIC,
    revpar NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH monthly_days AS (
        SELECT 
            m.month_date,
            TO_CHAR(m.month_date, 'YYYY-MM') AS m_code,
            TO_CHAR(m.month_date, 'Month YYYY') AS m_name,
            (DATE_TRUNC('month', m.month_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE - DATE_TRUNC('month', m.month_date)::DATE + 1 AS days_in_month
        FROM (
            SELECT GENERATE_SERIES(
                MAKE_DATE(p_year, 6, 1),
                MAKE_DATE(p_year, 11, 30),
                INTERVAL '1 month'
            )::DATE AS month_date
        ) m
    ),
    monthly_rev AS (
        SELECT 
            DATE_TRUNC('month', check_in_date)::DATE AS m_date,
            COUNT(*) AS res_count,
            SUM(nights_count) AS occ_nights,
            SUM(gross_amount) AS gross_val,
            SUM(discount_amount) AS disc_val,
            SUM(net_amount) AS net_val
        FROM view_reservation_analytics
        WHERE EXTRACT(YEAR FROM check_in_date) = p_year AND status_code <> 'CANCELLED'
        GROUP BY DATE_TRUNC('month', check_in_date)::DATE
    ),
    monthly_exp AS (
        SELECT 
            DATE_TRUNC('month', expense_date)::DATE AS m_date,
            SUM(amount) AS exp_val
        FROM expenses
        WHERE EXTRACT(YEAR FROM expense_date) = p_year AND payment_status = 'POSTED'
        GROUP BY DATE_TRUNC('month', expense_date)::DATE
    )
    SELECT 
        d.m_code AS month_code,
        TRIM(d.m_name) AS month_name,
        COALESCE(r.res_count, 0) AS reservations_count,
        COALESCE(r.occ_nights, 0) AS occupied_nights,
        ROUND((COALESCE(r.occ_nights, 0)::NUMERIC / NULLIF(75 * d.days_in_month, 0)) * 100, 2) AS occupancy_rate_pct,
        ROUND(COALESCE(r.gross_val, 0), 2) AS gross_revenue,
        ROUND(COALESCE(r.disc_val, 0), 2) AS discounts,
        ROUND(COALESCE(r.net_val, 0), 2) AS net_revenue,
        ROUND(COALESCE(e.exp_val, 0), 2) AS total_expenses,
        ROUND(COALESCE(r.net_val, 0) - COALESCE(e.exp_val, 0), 2) AS net_profit,
        ROUND(COALESCE(r.net_val, 0) / NULLIF(COALESCE(r.occ_nights, 0), 0), 2) AS adr,
        ROUND(COALESCE(r.net_val, 0) / NULLIF(75 * d.days_in_month, 0), 2) AS revpar
    FROM monthly_days d
    LEFT JOIN monthly_rev r ON d.month_date = r.m_date
    LEFT JOIN monthly_exp e ON d.month_date = e.m_date
    ORDER BY d.month_date;
END;
$$;


-- 4. Function: Building-by-Building Performance Analysis
CREATE OR REPLACE FUNCTION get_building_performance_summary(
    p_start_date DATE DEFAULT '2026-06-01',
    p_end_date DATE DEFAULT '2026-11-30'
)
RETURNS TABLE (
    building_id INT,
    building_code TEXT,
    building_name TEXT,
    total_rooms BIGINT,
    total_reservations BIGINT,
    occupied_room_nights BIGINT,
    total_revenue NUMERIC,
    adr NUMERIC,
    building_revenue_share_pct NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
    v_total_hotel_revenue NUMERIC;
BEGIN
    SELECT COALESCE(SUM(final_amount), 1)
    INTO v_total_hotel_revenue
    FROM reservations
    WHERE check_in_date >= p_start_date AND check_in_date <= p_end_date AND status_id IN (2, 3, 4);

    RETURN QUERY
    SELECT 
        b.building_id,
        b.building_code::TEXT,
        b.building_name::TEXT,
        COUNT(DISTINCT rm.room_id) AS total_rooms,
        COUNT(DISTINCT r.reservation_id) AS total_reservations,
        COALESCE(SUM(rr.check_out_date - rr.check_in_date), 0) AS occupied_room_nights,
        ROUND(COALESCE(SUM(rr.total_room_price), 0), 2) AS total_revenue,
        ROUND(COALESCE(SUM(rr.total_room_price) / NULLIF(SUM(rr.check_out_date - rr.check_in_date), 0), 0), 2) AS adr,
        ROUND((COALESCE(SUM(rr.total_room_price), 0) / v_total_hotel_revenue) * 100, 2) AS building_revenue_share_pct
    FROM buildings b
    JOIN floors f ON b.building_id = f.building_id
    JOIN rooms rm ON f.floor_id = rm.floor_id
    LEFT JOIN reservation_rooms rr ON rm.room_id = rr.room_id
    LEFT JOIN reservations r ON rr.reservation_id = r.reservation_id AND r.status_id IN (2, 3, 4) AND r.check_in_date >= p_start_date AND r.check_in_date <= p_end_date
    GROUP BY b.building_id, b.building_code, b.building_name
    ORDER BY b.building_id;
END;
$$;


-- 5. Function: Room Type Revenue & Occupancy Analysis
CREATE OR REPLACE FUNCTION get_room_type_performance_summary(
    p_start_date DATE DEFAULT '2026-06-01',
    p_end_date DATE DEFAULT '2026-11-30'
)
RETURNS TABLE (
    room_type_id INT,
    room_type_code TEXT,
    room_type_name TEXT,
    rooms_count BIGINT,
    total_bookings BIGINT,
    total_nights_sold BIGINT,
    total_revenue NUMERIC,
    adr NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.room_type_id,
        rt.room_type_code::TEXT,
        rt.room_type_name::TEXT,
        COUNT(DISTINCT rm.room_id) AS rooms_count,
        COUNT(DISTINCT r.reservation_id) AS total_bookings,
        COALESCE(SUM(rr.check_out_date - rr.check_in_date), 0) AS total_nights_sold,
        ROUND(COALESCE(SUM(rr.total_room_price), 0), 2) AS total_revenue,
        ROUND(COALESCE(SUM(rr.total_room_price) / NULLIF(SUM(rr.check_out_date - rr.check_in_date), 0), 0), 2) AS adr
    FROM room_types rt
    JOIN rooms rm ON rt.room_type_id = rm.room_type_id
    LEFT JOIN reservation_rooms rr ON rm.room_id = rr.room_id
    LEFT JOIN reservations r ON rr.reservation_id = r.reservation_id AND r.status_id IN (2, 3, 4) AND r.check_in_date >= p_start_date AND r.check_in_date <= p_end_date
    GROUP BY rt.room_type_id, rt.room_type_code, rt.room_type_name
    ORDER BY total_revenue DESC;
END;
$$;
