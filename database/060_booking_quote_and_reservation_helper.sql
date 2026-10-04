-- ===========================================================================
-- 060_booking_quote_and_reservation_helper.sql
-- Real-time Booking Quote, Date Availability & Discount Calculator
-- Designed for n8n AI Agent customer reservation queries
-- ===========================================================================

-- Function: Calculate Real-time Booking Quote for Specific Dates & Guests Count
CREATE OR REPLACE FUNCTION calculate_booking_quote_and_availability(
    p_check_in DATE,
    p_check_out DATE,
    p_adults INT DEFAULT 2,
    p_children INT DEFAULT 0,
    p_room_type_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    room_type_id BIGINT,
    room_type_name TEXT,
    max_adults INT,
    max_children INT,
    max_occupancy INT,
    nights_count INT,
    available_rooms_count BIGINT,
    price_per_night NUMERIC,
    gross_stay_total NUMERIC,
    applied_promotion TEXT,
    discount_amount NUMERIC,
    final_net_total NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
    v_nights INT;
BEGIN
    v_nights := GREATEST((p_check_out - p_check_in), 1);

    RETURN QUERY
    WITH room_base AS (
        SELECT 
            rt.room_type_id::BIGINT AS r_type_id,
            rt.room_type_name::TEXT AS r_name,
            rt.max_adults::INT AS m_adults,
            rt.max_children::INT AS m_children,
            rt.max_occupancy::INT AS m_occ,
            (COUNT(DISTINCT rm.room_id) - COUNT(DISTINCT rr.room_id) FILTER (
                WHERE r.status_id IN (2, 3) 
                AND (rr.check_in_date < p_check_out AND rr.check_out_date > p_check_in)
            ))::BIGINT AS avail_rooms,
            ROUND(COALESCE(AVG(gnp.price_per_person_per_night), 1500), 2) AS adult_rate
        FROM room_types rt
        JOIN rooms rm ON rt.room_type_id = rm.room_type_id
        LEFT JOIN guest_night_prices gnp ON rm.room_id = gnp.room_id AND gnp.age_category_id = 3
        LEFT JOIN reservation_rooms rr ON rm.room_id = rr.room_id
        LEFT JOIN reservations r ON rr.reservation_id = r.reservation_id
        WHERE rt.max_adults >= p_adults 
          AND rt.max_children >= p_children 
          AND rt.max_occupancy >= (p_adults + p_children)
          AND (p_room_type_search IS NULL OR rt.room_type_name ILIKE '%' || p_room_type_search || '%')
        GROUP BY rt.room_type_id, rt.room_type_name, rt.max_adults, rt.max_children, rt.max_occupancy
    ),
    quote_calc AS (
        SELECT 
            rb.r_type_id,
            rb.r_name,
            rb.m_adults,
            rb.m_children,
            rb.m_occ,
            rb.avail_rooms,
            (rb.adult_rate * p_adults + (rb.adult_rate * 0.5) * p_children) AS nightly_rate,
            ((rb.adult_rate * p_adults + (rb.adult_rate * 0.5) * p_children) * v_nights) AS gross_total,
            CASE 
                WHEN v_nights >= 5 THEN 'خصم الإقامة الطويلة (20%)'
                WHEN v_nights >= 2 THEN 'عرض الصيف الصيفي (15%)'
                ELSE 'لا يوجد خصم متاح'
            END AS promo_name,
            CASE 
                WHEN v_nights >= 5 THEN ROUND(((rb.adult_rate * p_adults + (rb.adult_rate * 0.5) * p_children) * v_nights) * 0.20, 2)
                WHEN v_nights >= 2 THEN ROUND(((rb.adult_rate * p_adults + (rb.adult_rate * 0.5) * p_children) * v_nights) * 0.15, 2)
                ELSE 0.00
            END AS disc_val
        FROM room_base rb
    )
    SELECT 
        q.r_type_id::BIGINT AS room_type_id,
        q.r_name::TEXT AS room_type_name,
        q.m_adults::INT AS max_adults,
        q.m_children::INT AS max_children,
        q.m_occ::INT AS max_occupancy,
        v_nights::INT AS nights_count,
        q.avail_rooms::BIGINT AS available_rooms_count,
        ROUND(q.nightly_rate, 2)::NUMERIC AS price_per_night,
        ROUND(q.gross_total, 2)::NUMERIC AS gross_stay_total,
        q.promo_name::TEXT AS applied_promotion,
        ROUND(q.disc_val, 2)::NUMERIC AS discount_amount,
        ROUND(q.gross_total - q.disc_val, 2)::NUMERIC AS final_net_total
    FROM quote_calc q
    ORDER BY (q.gross_total - q.disc_val) ASC;
END;
$$;
