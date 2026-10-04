-- ===========================================================================
-- 050_kpi_operational_inventory_queries.sql
-- Operational Inventory, Room Capacity, Pricing & Active Promotions Query Helper
-- Designed for n8n AI Agent operational lookups
-- ===========================================================================

-- 1. View: Detailed Room Types, Capacity, Pricing & Applicable Discounts
CREATE OR REPLACE VIEW view_room_types_capacity_and_pricing AS
SELECT 
    rt.room_type_id,
    rt.room_type_code,
    rt.room_type_name,
    rt.max_occupancy,
    rt.max_adults,
    rt.max_children,
    COUNT(DISTINCT rm.room_id) AS total_rooms_count,
    COALESCE(MIN(gnp.price_per_person_per_night), 0) AS min_price_per_night,
    COALESCE(MAX(gnp.price_per_person_per_night), 0) AS max_price_per_night,
    ARRAY_TO_STRING(ARRAY(
        SELECT p.promotion_name || ' (' || pt.discount_value || CASE WHEN pt.discount_type = 'PERCENTAGE' THEN '%' ELSE ' EGP' END || ')'
        FROM promotions p
        JOIN promotion_tiers pt ON p.promotion_id = pt.promotion_id
        WHERE p.is_active = true
    ), ' | ') AS active_promotions_summary
FROM room_types rt
JOIN rooms rm ON rt.room_type_id = rm.room_type_id
LEFT JOIN guest_night_prices gnp ON rt.room_type_id = gnp.room_type_id AND gnp.age_category_id = 3
GROUP BY rt.room_type_id, rt.room_type_code, rt.room_type_name, rt.max_occupancy, rt.max_adults, rt.max_children;


-- 2. Function: Check Real-time Room Availability for Specific Dates or Room Type
CREATE OR REPLACE FUNCTION get_room_availability_status(
    p_check_in DATE DEFAULT CURRENT_DATE,
    p_check_out DATE DEFAULT (CURRENT_DATE + INTERVAL '1 day')::DATE,
    p_room_type_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    room_type_id INT,
    room_type_name TEXT,
    max_adults INT,
    max_children INT,
    max_occupancy INT,
    total_rooms BIGINT,
    available_rooms_count BIGINT,
    booked_rooms_count BIGINT,
    price_per_person_per_night NUMERIC,
    active_promotions TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.room_type_id,
        rt.room_type_name::TEXT,
        rt.max_adults,
        rt.max_children,
        rt.max_occupancy,
        COUNT(DISTINCT rm.room_id) AS total_rooms,
        COUNT(DISTINCT rm.room_id) - COUNT(DISTINCT rr.room_id) FILTER (
            WHERE r.status_id IN (2, 3) 
            AND (rr.check_in_date < p_check_out AND rr.check_out_date > p_check_in)
        ) AS available_rooms_count,
        COUNT(DISTINCT rr.room_id) FILTER (
            WHERE r.status_id IN (2, 3) 
            AND (rr.check_in_date < p_check_out AND rr.check_out_date > p_check_in)
        ) AS booked_rooms_count,
        ROUND(COALESCE(AVG(gnp.price_per_person_per_night), 1500), 2) AS price_per_person_per_night,
        v.active_promotions_summary::TEXT
    FROM room_types rt
    JOIN rooms rm ON rt.room_type_id = rm.room_type_id
    JOIN view_room_types_capacity_and_pricing v ON rt.room_type_id = v.room_type_id
    LEFT JOIN guest_night_prices gnp ON rm.room_id = gnp.room_id AND gnp.age_category_id = 3
    LEFT JOIN reservation_rooms rr ON rm.room_id = rr.room_id
    LEFT JOIN reservations r ON rr.reservation_id = r.reservation_id
    WHERE (p_room_type_search IS NULL OR rt.room_type_name ILIKE '%' || p_room_type_search || '%' OR rt.room_type_code ILIKE '%' || p_room_type_search || '%')
    GROUP BY rt.room_type_id, rt.room_type_name, rt.max_adults, rt.max_children, rt.max_occupancy, v.active_promotions_summary
    ORDER BY rt.room_type_id;
END;
$$;


-- 3. Function: Operational General Q&A Search (Search Rooms, Building, Floor, Status, Price)
CREATE OR REPLACE FUNCTION get_operational_room_search(p_query TEXT DEFAULT NULL)
RETURNS TABLE (
    room_number TEXT,
    building_name TEXT,
    floor_name TEXT,
    room_type_name TEXT,
    max_adults INT,
    max_children INT,
    operational_status TEXT,
    base_price_adult NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rm.room_number::TEXT,
        b.building_name::TEXT,
        f.floor_name::TEXT,
        rt.room_type_name::TEXT,
        rt.max_adults,
        rt.max_children,
        ros.status_name::TEXT AS operational_status,
        ROUND(COALESCE(gnp.price_per_person_per_night, 1500), 2) AS base_price_adult
    FROM rooms rm
    JOIN floors f ON rm.floor_id = f.floor_id
    JOIN buildings b ON f.building_id = b.building_id
    JOIN room_types rt ON rm.room_type_id = rt.room_type_id
    JOIN room_operational_statuses ros ON rm.operational_status_id = ros.status_id
    LEFT JOIN guest_night_prices gnp ON rm.room_id = gnp.room_id AND gnp.age_category_id = 3 AND gnp.pricing_period_id = 1
    WHERE (
        p_query IS NULL 
        OR rm.room_number ILIKE '%' || p_query || '%'
        OR b.building_name ILIKE '%' || p_query || '%'
        OR rt.room_type_name ILIKE '%' || p_query || '%'
    )
    ORDER BY rm.room_id
    LIMIT 50;
END;
$$;
