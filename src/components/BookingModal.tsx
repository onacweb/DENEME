import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  User,
  Phone,
} from 'lucide-react';
import Modal from './ui/Modal';
import {
  bookAppointment,
  fetchBookedSlots,
  fetchClosedSlots,
  fetchHolidays,
  fetchSettings,
  type Settings,
} from '@/lib/supabase';
import {
  addDays,
  dateToStr,
  dayNameTR,
  formatDateTR,
  generateSlots,
  isBeyondMax,
  isPastDate,
  pad,
  todayStr,
} from '@/lib/time';

type Props = { open: boolean; onClose: () => void };

type Stage = 'calendar' | 'slots' | 'form' | 'confirm';

export default function BookingModal({ open, onClose }: Props) {
  const [stage, setStage] = useState<Stage>('calendar');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [closedSlots, setClosedSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelCode, setCancelCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [s, h] = await Promise.all([fetchSettings(), fetchHolidays()]);
        setSettings(s);
        setHolidays(h);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStage('calendar');
      setSelectedDate(null);
      setSelectedTime(null);
      setError(null);
      setCancelCode(null);
      setFirstName('');
      setLastName('');
      setPhone('');
    }
  }, [open]);

  const monthLabel = useMemo(() => {
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
    return `${months[viewMonth]} ${viewYear}`;
  }, [viewMonth, viewYear]);

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: ({ date: string; day: number } | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
      cells.push({ date, day: d });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const slots = useMemo(() => (settings ? generateSlots(settings) : []), [settings]);

  useEffect(() => {
    if (!selectedDate) return;
    (async () => {
      try {
        const [b, c] = await Promise.all([
          fetchBookedSlots(selectedDate),
          fetchClosedSlots(selectedDate),
        ]);
        setBookedSlots(b);
        setClosedSlots(c);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [selectedDate]);

  const canMonthNav = (dir: -1 | 1) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(viewYear, viewMonth + dir, 1);
    const max = new Date(today);
    max.setFullYear(max.getFullYear() + 3);
    return target >= new Date(today.getFullYear(), today.getMonth(), 1) && target <= max;
  };

  const goPrevMonth = () => {
    if (!canMonthNav(-1)) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (!canMonthNav(1)) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const isDateDisabled = (date: string) =>
    isPastDate(date) || isBeyondMax(date) || holidays.includes(date);

  const onPickDate = (date: string) => {
    if (isDateDisabled(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
    setError(null);
    setStage('slots');
  };

  const onPickTime = (time: string) => {
    setSelectedTime(time);
    setError(null);
    setStage('form');
  };

  const onConfirm = async () => {
    if (!selectedDate || !selectedTime || !settings) return;
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const code = await bookAppointment(
        firstName.trim(),
        lastName.trim(),
        phone.trim(),
        selectedDate,
        selectedTime,
      );
      setCancelCode(code);
      setStage('confirm');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Randevu Al"
      subtitle="3 yıllık takvimden uygun bir gün ve saat seçin"
      maxWidth="max-w-2xl"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {stage === 'calendar' && settings && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={goPrevMonth}
              disabled={!canMonthNav(-1)}
              className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-gold-400 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 font-serif text-lg text-gold-400">
              <CalendarDays size={18} />
              {monthLabel}
            </div>
            <button
              onClick={goNextMonth}
              disabled={!canMonthNav(1)}
              className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-gold-400 disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500 mb-2">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const past = isPastDate(cell.date);
              const holiday = holidays.includes(cell.date);
              const disabled = past || isBeyondMax(cell.date) || holiday;
              const selected = selectedDate === cell.date;
              return (
                <button
                  key={cell.date}
                  disabled={disabled}
                  onClick={() => onPickDate(cell.date)}
                  className={[
                    'aspect-square rounded-lg text-sm font-medium transition',
                    selected
                      ? 'bg-gold-500 text-black'
                      : disabled
                        ? 'cursor-not-allowed text-neutral-700 line-through'
                        : 'bg-neutral-900 text-neutral-200 hover:border-gold-500/50 hover:text-gold-400 border border-transparent',
                  ].join(' ')}
                  title={holiday ? 'Tatil' : disabled ? 'Geçmiş tarih' : dayNameTR(cell.date)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-center gap-6 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Müsait
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Dolu / Kapalı
            </span>
          </div>
        </div>
      )}

      {stage === 'slots' && settings && selectedDate && (
        <div>
          <button
            onClick={() => setStage('calendar')}
            className="mb-4 flex items-center gap-1 text-sm text-neutral-400 hover:text-gold-400 transition"
          >
            <ChevronLeft size={16} /> Takvime dön
          </button>
          <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3">
            <div className="font-serif text-lg text-gold-400">{formatDateTR(selectedDate)}</div>
            <div className="text-sm text-neutral-400">
              {dayNameTR(selectedDate)} · {settings.work_start}–{settings.work_end}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {slots.map((time) => {
              const booked = bookedSlots.includes(time);
              const closed = closedSlots.includes(time);
              const taken = booked || closed;
              const sel = selectedTime === time;
              return (
                <button
                  key={time}
                  disabled={taken}
                  onClick={() => onPickTime(time)}
                  className={[
                    'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                    sel
                      ? 'bg-gold-500 text-black'
                      : taken
                        ? 'cursor-not-allowed bg-red-500/15 text-red-400/70'
                        : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-black',
                  ].join(' ')}
                >
                  <Clock size={14} />
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {stage === 'form' && (
        <div>
          <button
            onClick={() => setStage('slots')}
            className="mb-4 flex items-center gap-1 text-sm text-neutral-400 hover:text-gold-400 transition"
          >
            <ChevronLeft size={16} /> Saatlere dön
          </button>
          <div className="mb-5 rounded-xl border border-gold-500/30 bg-gold-500/5 px-4 py-3 text-sm text-gold-200">
            Seçilen randevu: <strong>{formatDateTR(selectedDate!)}</strong> ·{' '}
            <strong>{selectedTime}</strong>
          </div>
          <div className="space-y-4">
            <Field icon={<User size={18} />} label="Ad">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-luxury"
                placeholder="Adınız"
                maxLength={40}
              />
            </Field>
            <Field icon={<User size={18} />} label="Soyad">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-luxury"
                placeholder="Soyadınız"
                maxLength={40}
              />
            </Field>
            <Field icon={<Phone size={18} />} label="Telefon">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-luxury"
                placeholder="05XX XXX XX XX"
                maxLength={20}
              />
            </Field>
          </div>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 py-3 font-semibold text-black transition hover:bg-gold-400 disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Randevuyu Onayla
          </button>
        </div>
      )}

      {stage === 'confirm' && cancelCode && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 size={36} className="text-emerald-400" />
          </div>
          <h3 className="font-serif text-2xl text-gold-400">Randevunuz Oluşturuldu!</h3>
          <p className="mt-2 text-sm text-neutral-400">
            {firstName} {lastName} · {formatDateTR(selectedDate!)} · {selectedTime}
          </p>
          <div className="my-6 rounded-xl border border-gold-500/30 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-widest text-neutral-500">İptal Kodunuz</p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-[0.4em] text-gold-400">
              {cancelCode}
            </p>
            <p className="mt-3 text-xs text-neutral-400">
              Bu kodu güvenli bir yerde saklayın. Randevunuzu iptal etmek için telefon numaranızla
              birlikte bu kod gereklidir.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-neutral-700 py-3 text-neutral-300 transition hover:bg-neutral-800"
          >
            Tamam
          </button>
        </div>
      )}
    </Modal>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-300">
        <span className="text-gold-400">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
