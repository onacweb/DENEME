/*
# Add multi-admin support (founder + manager roles)

## Why
Replaces the single shared admin_password in settings with a proper `admins`
table supporting named users and roles (founder / admin).

## Changes
1. New `admins` table (username, password, display_name, role).
2. Seed two admins.
3. admin_check, admin_is_authorized, admin_role functions.
4. All admin RPCs take p_username + p_password.
5. admin_update_settings is FOUNDER-ONLY.
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('founder', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

INSERT INTO admins (username, password, display_name, role) VALUES
  ('fıratonac', '635825', 'Fırat Onaç', 'founder'),
  ('sinankulac41', 'sinankulac1966', 'Sinan Kulac', 'admin')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

DROP FUNCTION IF EXISTS admin_is_authorized(text);
DROP FUNCTION IF EXISTS admin_get_appointments(text,date,date);
DROP FUNCTION IF EXISTS admin_cancel_appointment(text,uuid);
DROP FUNCTION IF EXISTS admin_set_status(text,uuid,text);
DROP FUNCTION IF EXISTS admin_close_slot(text,date,text,text);
DROP FUNCTION IF EXISTS admin_open_slot(text,date,text);
DROP FUNCTION IF EXISTS admin_add_holiday(text,date,text);
DROP FUNCTION IF EXISTS admin_remove_holiday(text,date);
DROP FUNCTION IF EXISTS admin_get_settings(text);
-- old admin_update_settings: 14 args (p_password + 13 fields including p_new_password)
DROP FUNCTION IF EXISTS admin_update_settings(text,text,text,text,text,text,text,text,text,integer,text,text,integer,text);

CREATE OR REPLACE FUNCTION admin_check(p_username text, p_password text)
RETURNS json
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT json_build_object('username', username, 'display_name', display_name, 'role', role)
  FROM admins WHERE username = p_username AND password = p_password;
$$;

CREATE OR REPLACE FUNCTION admin_is_authorized(p_username text, p_password text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE username = p_username AND password = p_password);
$$;

CREATE OR REPLACE FUNCTION admin_role(p_username text, p_password text)
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM admins WHERE username = p_username AND password = p_password;
$$;

CREATE OR REPLACE FUNCTION admin_get_appointments(p_username text, p_password text, p_from date, p_to date)
RETURNS TABLE (id uuid, first_name text, last_name text, phone text, appointment_date date, appointment_time text, cancel_code text, status text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.id, a.first_name, a.last_name, a.phone, a.appointment_date, a.appointment_time, a.cancel_code, a.status, a.created_at
  FROM appointments a
  WHERE a.appointment_date >= p_from AND a.appointment_date <= p_to
    AND admin_is_authorized(p_username, p_password)
  ORDER BY a.appointment_date, a.appointment_time;
$$;

CREATE OR REPLACE FUNCTION admin_cancel_appointment(p_username text, p_password text, p_appointment_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_username, p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  UPDATE appointments SET status = 'cancelled' WHERE id = p_appointment_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_status(p_username text, p_password text, p_appointment_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_username, p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  IF p_status NOT IN ('active','cancelled','no_show') THEN RAISE EXCEPTION 'Geçersiz durum'; END IF;
  UPDATE appointments SET status = p_status WHERE id = p_appointment_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION admin_close_slot(p_username text, p_password text, p_date date, p_time text, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_username, p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  INSERT INTO closed_slots (slot_date, slot_time, reason) VALUES (p_date, p_time, p_reason)
  ON CONFLICT (slot_date, slot_time) DO UPDATE SET reason = EXCLUDED.reason;
END;
$$;

CREATE OR REPLACE FUNCTION admin_open_slot(p_username text, p_password text, p_date date, p_time text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_username, p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  DELETE FROM closed_slots WHERE slot_date = p_date AND slot_time = p_time;
END;
$$;

CREATE OR REPLACE FUNCTION admin_add_holiday(p_username text, p_password text, p_date date, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_username, p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  INSERT INTO holidays (holiday_date, reason) VALUES (p_date, p_reason)
  ON CONFLICT (holiday_date) DO UPDATE SET reason = EXCLUDED.reason;
END;
$$;

CREATE OR REPLACE FUNCTION admin_remove_holiday(p_username text, p_password text, p_date date)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT admin_is_authorized(p_username, p_password) THEN RAISE EXCEPTION 'Yetkisiz'; END IF;
  DELETE FROM holidays WHERE holiday_date = p_date;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_settings(p_username text, p_password text)
RETURNS json
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT row_to_json(t) FROM (
    SELECT shop_name, shop_phone, address, maps_link, instagram_url, whatsapp_number,
           work_start, work_end, slot_minutes, lunch_start, lunch_end, max_daily_appointments
    FROM settings WHERE id = 1 AND admin_is_authorized(p_username, p_password)
  ) t;
$$;

-- FOUNDER-ONLY: 14 args (p_username, p_password + 12 setting fields)
CREATE OR REPLACE FUNCTION admin_update_settings(
  p_username text, p_password text,
  p_shop_name text, p_shop_phone text, p_address text, p_maps_link text,
  p_instagram_url text, p_whatsapp_number text, p_work_start text, p_work_end text,
  p_slot_minutes integer, p_lunch_start text, p_lunch_end text, p_max_daily integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF admin_role(p_username, p_password) <> 'founder' THEN RAISE EXCEPTION 'Bu işlem yalnızca kurucu tarafından yapılabilir.'; END IF;
  UPDATE settings SET
    shop_name = p_shop_name, shop_phone = p_shop_phone, address = p_address,
    maps_link = p_maps_link, instagram_url = p_instagram_url, whatsapp_number = p_whatsapp_number,
    work_start = p_work_start, work_end = p_work_end, slot_minutes = p_slot_minutes,
    lunch_start = NULLIF(p_lunch_start, ''), lunch_end = NULLIF(p_lunch_end, ''),
    max_daily_appointments = p_max_daily
  WHERE id = 1;
END;
$$;

-- EXECUTE grants (signatures must match exactly)
REVOKE EXECUTE ON FUNCTION admin_check(text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_is_authorized(text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_role(text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_get_appointments(text,text,date,date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_cancel_appointment(text,text,uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_set_status(text,text,uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_close_slot(text,text,date,text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_open_slot(text,text,date,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_add_holiday(text,text,date,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_remove_holiday(text,text,date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_get_settings(text,text) FROM PUBLIC;
-- 14 args: text,text,text,text,text,text,text,text,text,text,integer,text,text,integer
REVOKE EXECUTE ON FUNCTION admin_update_settings(text,text,text,text,text,text,text,text,text,text,integer,text,text,integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION admin_check(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_is_authorized(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_role(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_appointments(text,text,date,date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_cancel_appointment(text,text,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_set_status(text,text,uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_close_slot(text,text,date,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_open_slot(text,text,date,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_add_holiday(text,text,date,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_remove_holiday(text,text,date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_settings(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_settings(text,text,text,text,text,text,text,text,text,text,integer,text,text,integer) TO anon, authenticated;
