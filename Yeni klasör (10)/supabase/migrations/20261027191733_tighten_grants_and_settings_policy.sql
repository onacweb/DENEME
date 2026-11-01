/*
# Tighten grants and add settings SELECT policy

## Why
The initial schema granted full CRUD to anon/authenticated on every table, relying
on RLS policies to block writes. That works but is sloppy defense-in-depth. This
migration:
1. Revokes INSERT/UPDATE/DELETE from anon and authenticated on appointments,
   holidays, closed_slots, and settings — all writes go through SECURITY DEFINER
   functions, so direct table writes are never needed.
2. Restricts the SELECT grant on appointments to the non-sensitive columns only
   (phone and cancel_code are NOT exposed to other customers).
3. Adds a SELECT policy on settings so the anon client can read shop info (RLS was
   enabled with no policy, meaning settings was unreadable). The grant already
   excluded the admin_password column; the policy just opens read access to the
   granted columns.

## Security changes
- REVOKE INSERT, UPDATE, DELETE on all 4 tables FROM anon, authenticated.
- REVOKE SELECT on appointments FROM anon, authenticated; re-grant SELECT on the
  public column subset only.
- Add "anon_select_settings" SELECT policy on settings (TO anon, authenticated).
- No data is touched; no columns or types change.
*/

-- appointments: only public columns readable, no direct writes
REVOKE SELECT, INSERT, UPDATE, DELETE ON appointments FROM anon, authenticated;
GRANT SELECT (id, first_name, last_name, appointment_date, appointment_time, status, created_at) ON appointments TO anon, authenticated;

-- settings: only the public column set (admin_password already excluded by column grant)
REVOKE SELECT, INSERT, UPDATE, DELETE ON settings FROM anon, authenticated;
GRANT SELECT (shop_name, shop_phone, address, maps_link, instagram_url, whatsapp_number, work_start, work_end, slot_minutes, lunch_start, lunch_end, max_daily_appointments, id) ON settings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings"
  ON settings FOR SELECT
  TO anon, authenticated USING (true);

-- holidays: read-only for anon/authenticated
REVOKE INSERT, UPDATE, DELETE ON holidays FROM anon, authenticated;

-- closed_slots: read-only for anon/authenticated
REVOKE INSERT, UPDATE, DELETE ON closed_slots FROM anon, authenticated;
