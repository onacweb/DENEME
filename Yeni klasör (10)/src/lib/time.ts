import type { Settings } from './supabase';

export const pad = (n: number) => n.toString().padStart(2, '0');

export const toMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (m: number): string => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

export const generateSlots = (s: Settings): string[] => {
  const start = toMinutes(s.work_start);
  const end = toMinutes(s.work_end);
  const step = s.slot_minutes;
  const lunchStart = s.lunch_start ? toMinutes(s.lunch_start) : null;
  const lunchEnd = s.lunch_end ? toMinutes(s.lunch_end) : null;
  const slots: string[] = [];
  for (let m = start; m < end; m += step) {
    if (lunchStart !== null && lunchEnd !== null && m >= lunchStart && m < lunchEnd) {
      continue;
    }
    slots.push(fromMinutes(m));
  }
  return slots;
};

export const isPastDate = (date: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date + 'T00:00:00');
  return d < today;
};

export const isBeyondMax = (date: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date + 'T00:00:00');
  const max = new Date(today);
  max.setFullYear(max.getFullYear() + 3);
  return d > max;
};

export const isToday = (date: string): boolean => date === todayStr();

export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatDateTR = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const months = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const dayNameTR = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[d.getDay()];
};

export const addDays = (date: Date, n: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

export const dateToStr = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
