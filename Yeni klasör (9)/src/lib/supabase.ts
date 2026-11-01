import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type Appointment = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  cancel_code: string;
  status: 'active' | 'cancelled' | 'no_show';
  created_at: string;
};

export type Settings = {
  shop_name: string;
  shop_phone: string;
  address: string;
  maps_link: string;
  instagram_url: string;
  whatsapp_number: string;
  work_start: string;
  work_end: string;
  slot_minutes: number;
  lunch_start: string | null;
  lunch_end: string | null;
  max_daily_appointments: number;
};

export type PublicSettings = Pick<
  Settings,
  | 'shop_name'
  | 'shop_phone'
  | 'address'
  | 'maps_link'
  | 'instagram_url'
  | 'whatsapp_number'
  | 'work_start'
  | 'work_end'
  | 'slot_minutes'
  | 'lunch_start'
  | 'lunch_end'
  | 'max_daily_appointments'
>;

export const fetchSettings = async (): Promise<Settings> => {
  const { data, error } = await supabase
    .from('settings')
    .select(
      'shop_name, shop_phone, address, maps_link, instagram_url, whatsapp_number, work_start, work_end, slot_minutes, lunch_start, lunch_end, max_daily_appointments, id',
    )
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data as Settings;
};

export const fetchHolidays = async (): Promise<string[]> => {
  const { data, error } = await supabase.from('holidays').select('holiday_date');
  if (error) throw error;
  return (data || []).map((r) => r.holiday_date);
};

export const fetchClosedSlots = async (date: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('closed_slots')
    .select('slot_time')
    .eq('slot_date', date);
  if (error) throw error;
  return (data || []).map((r) => r.slot_time);
};

export type PublicSlot = {
  time: string;
  booked: boolean;
};

export const fetchBookedSlots = async (date: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('appointment_date', date)
    .eq('status', 'active');
  if (error) throw error;
  return (data || []).map((r) => r.appointment_time);
};

export const bookAppointment = async (
  first: string,
  last: string,
  phone: string,
  date: string,
  time: string,
): Promise<string> => {
  const { data, error } = await supabase.rpc('create_appointment', {
    p_first_name: first,
    p_last_name: last,
    p_phone: phone,
    p_appointment_date: date,
    p_appointment_time: time,
  });
  if (error) throw error;
  return data as string;
};

export const cancelOwnAppointment = async (phone: string, code: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('cancel_appointment', {
    p_phone: phone,
    p_cancel_code: code,
  });
  if (error) throw error;
  return data as boolean;
};

export const adminLogin = async (
  username: string,
  password: string,
): Promise<{ username: string; display_name: string; role: string } | null> => {
  const { data, error } = await supabase.rpc('admin_check', {
    p_username: username,
    p_password: password,
  });
  if (error) throw error;
  return (data as { username: string; display_name: string; role: string } | null) || null;
};

export const adminGetAppointments = async (
  username: string,
  password: string,
  from: string,
  to: string,
): Promise<Appointment[]> => {
  const { data, error } = await supabase.rpc('admin_get_appointments', {
    p_username: username,
    p_password: password,
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return (data || []) as Appointment[];
};

export const adminCancelAppointment = async (
  username: string,
  password: string,
  id: string,
): Promise<boolean> => {
  const { data, error } = await supabase.rpc('admin_cancel_appointment', {
    p_username: username,
    p_password: password,
    p_appointment_id: id,
  });
  if (error) throw error;
  return data as boolean;
};

export const adminSetStatus = async (
  username: string,
  password: string,
  id: string,
  status: string,
): Promise<boolean> => {
  const { data, error } = await supabase.rpc('admin_set_status', {
    p_username: username,
    p_password: password,
    p_appointment_id: id,
    p_status: status,
  });
  if (error) throw error;
  return data as boolean;
};

export const adminCloseSlot = async (
  username: string,
  password: string,
  date: string,
  time: string,
  reason: string,
): Promise<void> => {
  const { error } = await supabase.rpc('admin_close_slot', {
    p_username: username,
    p_password: password,
    p_date: date,
    p_time: time,
    p_reason: reason,
  });
  if (error) throw error;
};

export const adminOpenSlot = async (
  username: string,
  password: string,
  date: string,
  time: string,
): Promise<void> => {
  const { error } = await supabase.rpc('admin_open_slot', {
    p_username: username,
    p_password: password,
    p_date: date,
    p_time: time,
  });
  if (error) throw error;
};

export const adminAddHoliday = async (
  username: string,
  password: string,
  date: string,
  reason: string,
): Promise<void> => {
  const { error } = await supabase.rpc('admin_add_holiday', {
    p_username: username,
    p_password: password,
    p_date: date,
    p_reason: reason,
  });
  if (error) throw error;
};

export const adminRemoveHoliday = async (
  username: string,
  password: string,
  date: string,
): Promise<void> => {
  const { error } = await supabase.rpc('admin_remove_holiday', {
    p_username: username,
    p_password: password,
    p_date: date,
  });
  if (error) throw error;
};

export const adminGetSettings = async (username: string, password: string): Promise<Settings> => {
  const { data, error } = await supabase.rpc('admin_get_settings', {
    p_username: username,
    p_password: password,
  });
  if (error) throw error;
  return data as Settings;
};

export const adminUpdateSettings = async (
  username: string,
  password: string,
  s: Settings,
): Promise<void> => {
  const { error } = await supabase.rpc('admin_update_settings', {
    p_username: username,
    p_password: password,
    p_shop_name: s.shop_name,
    p_shop_phone: s.shop_phone,
    p_address: s.address,
    p_maps_link: s.maps_link,
    p_instagram_url: s.instagram_url,
    p_whatsapp_number: s.whatsapp_number,
    p_work_start: s.work_start,
    p_work_end: s.work_end,
    p_slot_minutes: s.slot_minutes,
    p_lunch_start: s.lunch_start || '',
    p_lunch_end: s.lunch_end || '',
    p_max_daily: s.max_daily_appointments,
  });
  if (error) throw error;
};
