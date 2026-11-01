/*
# Barbershop Appointment System — Initial Schema

## Overview
A single-tenant public booking app for a men's barbershop. Customers book
appointments without signing in; the admin manages the shop via a password-gated
panel. All mutations happen through SECURITY DEFINER functions so business rules
(slot availability, no past dates, no holidays, no double-booking, unique cancel
codes) are enforced server-side. The anon role can only SELECT a limited column
set (phone numbers and cancel codes are NOT exposed to other customers) and call
the public booking/cancellation functions. Admin actions take the admin password
as an argument and verify it against the `settings` row before mutating.

## Tables
1. `settings` (singleton, id=1)
   - shop_name, shop_phone, address, maps_link, instagram_url, whatsapp_number
   - work_start, work_end, slot_minutes, lunch_start, lunch_end
   - max_daily_appointments, admin_password
2. `appointments`
   - first_name, last_name, phone, appointment_date, appointment_time
   - cancel_code (4-digit), status ('active'|'cancelled'|'no_show')
   - created_at
   - Partial unique indexes prevent double-booking and same-customer same-day duplicates.
3. `holidays` — closed full days (date unique)
4. `closed_slots` — individual closed time slots on specific days

## Security
- RLS enabled on every table.
- anon SELECT on appointments is restricted to non-sensitive columns (no phone, no cancel_code).
- All inserts/updates happen via SECURITY DEFINER functions; anon has no direct INSERT/UPDATE/DELETE on appointments/holidays/closed_slots.
- Admin functions verify the supplied password against settings.admin_password.
- EXECUTE on public functions granted to anon, authenticated; admin functions revoked from PUBLIC and granted to anon, authenticated.
*/

-- ---------------------------------------------------------------------------
-- settings (singleton row)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name text NOT NULL DEFAULT 'İmaj Erkek Kuaförü',
  shop_phone text NOT NULL DEFAULT '+90 534 643 76 58',
  address text NOT NULL DEFAULT 'Yahya Kaptan Mah. Şehit Ergün Köncü Sk. No:10/D, 41050 İzmit / Kocaeli',
  maps_link text NOT NULL DEFAULT 'https://www.google.com/maps/place/%C4%B0maj+Erkek+Kuaf%C3%B6r%C3%BC/@40.7670274,29.948331,17z/data=!3m1!4b1!4m6!3m5!1s0x14cb4f8cfe91fd3d:0xf1f7da8e2ae95086!8m2!3d40.7670274!4d29.948331!16s%2Fg%2F11gwmhl937',
  instagram_url text NOT NULL DEFAULT 'https://instagram.com',
  whatsapp_number text NOT NULL DEFAULT '905346437658',
  work_start text NOT NULL DEFAULT '09:00',
  work_end text NOT NULL DEFAULT '19:20',
  slot_minutes integer NOT NULL DEFAULT 20,
  lunch_start text,
  lunch_end text,
  max_daily_appointments integer NOT NULL DEFAULT 31,
  admin_password text NOT NULL DEFAULT 'admin123',
  created_at timestamptz DEFAULT now()
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- settings are read publicly (shop info) but admin_password must never be exposed.
-- Grant SELECT only on the non-sensitive columns to anon/authenticated.
GRANT SELECT (shop_name, shop_phone, address, maps_link, instagram_url, whatsapp_number, work_start, work_end, slot_minutes, lunch_start, lunch_end, max_daily_appointments, id) ON settings TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  cancel_code text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','no_show')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Only non-sensitive columns readable by anon (no phone, no cancel_code, no id leak is fine to expose).
GRANT SELECT (id, first_name, last_name, appointment_date, appointment_time, status, created_at) ON appointments TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_appointments_public_cols" ON appointments;
CREATE POLICY "anon_select_appointments_public_cols"
  ON appointments FOR SELECT
  TO anon, authenticated
  USING (true);

-- No direct INSERT/UPDATE/DELETE granted to anon; all via SECURITY DEFINER functions.

-- Prevent two active appointments on the same date+time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_slot
  ON appointments (appointment_date, appointment_time)
  WHERE status = 'active';

-- Prevent the same phone from booking twice on the same day.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_phone_per_day
  ON appointments (phone, appointment_date)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);

-- ---------------------------------------------------------------------------
-- holidays
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date date NOT NULL UNIQUE,
  reason text
);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON holidays TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_holidays" ON holidays;
CREATE POLICY "anon_select_holidays"
  ON holidays FOR SELECT
  TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- closed_slots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS closed_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL,
  slot_time text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (slot_date, slot_time)
);

ALTER TABLE closed_slots ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON closed_slots TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_closed_slots" ON closed_slots;
CREATE POLICY "anon_select_closed_slots"
  ON closed_slots FOR SELECT
  TO anon, authenticated USING (true);

-- ===========================================================================
-- SECURITY DEFINER functions (run as owner, bypass RLS)
-- ===========================================================================

-- Helper: is the admin password correct?
CREATE OR REPLACE FUNCTION admin_is_authorized(p_password text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM settings WHERE id = 1 AND admin_password = p_password);
$$;

-- Customer: create appointment. Enforces all business rules. Returns cancel_code.
CREATE OR REPLACE FUNCTION create_appointment(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_appointment_date date,
  p_appointment_time text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code text;
  v_count integer;
  v_settings record;
BEGIN
  SELECT work_start, work_end, slot_minutes, lunch_start, lunch_end, max_daily_appointments
    INTO v_settings FROM settings WHERE id = 1;

  -- No past dates.
  IF p_appointment_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Geçmiş tarihe randevu alınamaz.';
  END IF;

  -- Must be within 3 years from today.
  IF p_appointment_date > (CURRENT_DATE + INTERVAL '3 years') THEN
    RAISE EXCEPTION '3 yıldan ileri tarihe randevu alınamaz.';
  END IF;

  -- Not a holiday.
  IF EXISTS (SELECT 1 FROM holidays WHERE holiday_date = p_appointment_date) THEN
    RAISE EXCEPTION 'Bu gün tatil olarak işaretli.';
  END IF;

  -- Time within working hours.
  IF p_appointment_time < v_settings.work_start OR p_appointment_time > v_settings.work_end THEN
    RAISE EXCEPTION 'Seçili saat çalışma saatleri dışında.';
  END IF;

  -- Not during lunch break (if set).
  IF v_settings.lunch_start IS NOT NULL AND v_settings.lunch_end IS NOT NULL THEN
    IF p_appointment_time >= v_settings.lunch_start AND p_appointment_time < v_settings.lunch_end THEN
      RAISE EXCEPTION 'Bu saat öğle molasına denk geliyor.';
    END IF;
  END IF;

  -- Slot not manually closed.
  IF EXISTS (SELECT 1 FROM closed_slots WHERE slot_date = p_appointment_date AND slot_time = p_appointment_time) THEN
    RAISE EXCEPTION 'Bu saat yönetici tarafından kapatılmış.';
  END IF;

  -- Slot not already booked (active).
  IF EXISTS (SELECT 1 FROM appointments WHERE appointment_date = p_appointment_date AND appointment_time = p_appointment_time AND status = 'active') THEN
    RAISE EXCEPTION 'Bu saat zaten dolu.';
  END IF;

  -- Same customer can't have two active appointments same day.
  IF EXISTS (SELECT 1 FROM appointments WHERE phone = p_phone AND appointment_date = p_appointment_date AND status = 'active') THEN
    RAISE EXCEPTION 'Aynı gün için zaten aktif randevunuz var.';
  END IF;

  -- Daily capacity check.
  SELECT count(*) INTO v_count
    FROM appointments
   WHERE appointment_date = p_appointment_date AND status = 'active';
  IF v_count >= v_settings.max_daily_appointments THEN
    RAISE EXCEPTION 'Bu gün randevu kapasitesi dolu.';
  END IF;

  -- Generate unique 4-digit cancel code.
  LOOP
    v_code := lpad(floor(random() * 10000)::text, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM appointments WHERE cancel_code = v_code AND status = 'active') THEN
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO appointments (first_name, last_name, phone, appointment_date, appointment_time, cancel_code, status)
  VALUES (p_first_name, p_last_name, p_phone, p_appointment_date, p_appointment_time, v_code, 'active');

  RETURN v_code;
END;
$$;

-- Customer: cancel own appointment with phone + cancel code.
CREATE OR REPLACE FUNCTION cancel_appointment(p_phone text, p_cancel_code text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE appointments
     SET status = 'cancelled'
   WHERE phone = p_phone
     AND cancel_code = p_cancel_code
     AND status = 'active';
  RETURN FOUND;
END;
$$;

-- Admin: list appointments in a date range (includes phone + cancel_code).
CREATE OR REPLACE FUNCTION admin_get_appointments(p_password text, p_from date, p_to date)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  phone text,
  appointment_date date,
  appointment_time text,
  cancel_code text,
  status text,
  created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.id, a.first_name, a.last_name, a.phone, a.appointment_date,
         a.appointment_time, a.cancel_code, a.status, a.created_at
    FROM appointments a
   WHERE a.appointment_date >= p_from AND a.appointment_date <= p_to
     AND admin_is_authorized(p_password)
   ORDER BY a.appointment_date, a.appointment_time;
$$;

-- Admin: cancel any appointment.
CREATE OR REPLACE FUNCTION admin_cancel_appointment(p_password text, p_appointment_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  UPDATE appointments SET status = 'cancelled' WHERE id = p_appointment_id;
  RETURN FOUND;
END;
$$;

-- Admin: toggle no-show status.
CREATE OR REPLACE FUNCTION admin_set_status(p_password text, p_appointment_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  IF p_status NOT IN ('active','cancelled','no_show') THEN RAISE EXCEPTION 'Geçersiz durum'; END IF;
  UPDATE appointments SET status = p_status WHERE id = p_appointment_id;
  RETURN FOUND;
END;
$$;

-- Admin: close a slot.
CREATE OR REPLACE FUNCTION admin_close_slot(p_password text, p_date date, p_time text, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  INSERT INTO closed_slots (slot_date, slot_time, reason) VALUES (p_date, p_time, p_reason)
  ON CONFLICT (slot_date, slot_time) DO UPDATE SET reason = EXCLUDED.reason;
END;
$$;

-- Admin: open a slot.
CREATE OR REPLACE FUNCTION admin_open_slot(p_password text, p_date date, p_time text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  DELETE FROM closed_slots WHERE slot_date = p_date AND slot_time = p_time;
END;
$$;

-- Admin: add holiday.
CREATE OR REPLACE FUNCTION admin_add_holiday(p_password text, p_date date, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  INSERT INTO holidays (holiday_date, reason) VALUES (p_date, p_reason)
  ON CONFLICT (holiday_date) DO UPDATE SET reason = EXCLUDED.reason;
END;
$$;

-- Admin: remove holiday.
CREATE OR REPLACE FUNCTION admin_remove_holiday(p_password text, p_date date)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  DELETE FROM holidays WHERE holiday_date = p_date;
END;
$$;

-- Admin: read full settings (including admin_password).
CREATE OR REPLACE FUNCTION admin_get_settings(p_password text)
RETURNS json
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT row_to_json(t) FROM (
    SELECT shop_name, shop_phone, address, maps_link, instagram_url, whatsapp_number,
           work_start, work_end, slot_minutes, lunch_start, lunch_end,
           max_daily_appointments, admin_password
      FROM settings WHERE id = 1 AND admin_is_authorized(p_password)
  ) t;
$$;

-- Admin: update settings.
CREATE OR REPLACE FUNCTION admin_update_settings(
  p_password text,
  p_shop_name text,
  p_shop_phone text,
  p_address text,
  p_maps_link text,
  p_instagram_url text,
  p_whatsapp_number text,
  p_work_start text,
  p_work_end text,
  p_slot_minutes integer,
  p_lunch_start text,
  p_lunch_end text,
  p_max_daily integer,
  p_new_password text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  UPDATE settings SET
    shop_name = p_shop_name,
    shop_phone = p_shop_phone,
    address = p_address,
    maps_link = p_maps_link,
    instagram_url = p_instagram_url,
    whatsapp_number = p_whatsapp_number,
    work_start = p_work_start,
    work_end = p_work_end,
    slot_minutes = p_slot_minutes,
    lunch_start = NULLIF(p_lunch_start, ''),
    lunch_end = NULLIF(p_lunch_end, ''),
    max_daily_appointments = p_max_daily,
    admin_password = COALESCE(NULLIF(p_new_password, ''), admin_password)
  WHERE id = 1;
END;
$$;

-- ===========================================================================
-- Function EXECUTE grants
-- ===========================================================================
-- Public functions (booking + customer cancel): callable by anon + authenticated.
REVOKE EXECUTE ON FUNCTION create_appointment(text,text,text,date,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cancel_appointment(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_appointment(text,text,text,date,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cancel_appointment(text,text) TO anon, authenticated;

-- Admin functions: callable by anon + authenticated (password verified inside),
-- but revoked from PUBLIC so no implicit grants remain.
REVOKE EXECUTE ON FUNCTION admin_is_authorized(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_get_appointments(text,date,date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_cancel_appointment(text,uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_set_status(text,uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_close_slot(text,date,text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_open_slot(text,date,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_add_holiday(text,date,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_remove_holiday(text,date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_get_settings(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_update_settings(text,text,text,text,text,text,text,text,text,integer,text,text,integer,text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION admin_is_authorized(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_appointments(text,date,date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_cancel_appointment(text,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_set_status(text,uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_close_slot(text,date,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_open_slot(text,date,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_add_holiday(text,date,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_remove_holiday(text,date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_settings(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_settings(text,text,text,text,text,text,text,text,text,integer,text,text,integer,text) TO anon, authenticated;
