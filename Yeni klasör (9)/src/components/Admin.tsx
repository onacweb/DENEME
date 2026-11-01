import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  LogOut,
  Search,
  Download,
  RefreshCw,
  Calendar,
  XCircle,
  UserX,
  CheckCircle2,
  MessageCircle,
  Settings as SettingsIcon,
  CalendarOff,
  Lock,
  Clock,
  Save,
  ChevronLeft,
  ChevronRight,
  Scissors,
  ArrowLeft,
} from 'lucide-react';
import {
  adminAddHoliday,
  adminCancelAppointment,
  adminCloseSlot,
  adminGetAppointments,
  adminGetSettings,
  adminLogin,
  adminOpenSlot,
  adminRemoveHoliday,
  adminSetStatus,
  adminUpdateSettings,
  fetchBookedSlots,
  fetchClosedSlots,
  fetchHolidays,
  fetchSettings,
  supabase,
  type Appointment,
  type Settings,
} from '@/lib/supabase';
import { dateToStr, dayNameTR, formatDateTR, generateSlots, todayStr } from '@/lib/time';

type View = 'list' | 'settings' | 'holidays' | 'slots';

type Creds = { username: string; password: string; display_name: string; role: string };

export default function Admin({ onExit }: { onExit: () => void }) {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [uInput, setUInput] = useState('');
  const [pwInput, setPwInput] = useState('');
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [view, setView] = useState<View>('list');

  const login = async () => {
    setAuthErr(null);
    try {
      const info = await adminLogin(uInput.trim(), pwInput);
      if (!info) {
        setAuthErr('Yanlış kullanıcı adı veya şifre.');
        return;
      }
      setCreds({
        username: info.username,
        password: pwInput,
        display_name: info.display_name,
        role: info.role,
      });
    } catch {
      setAuthErr('Giriş başarısız.');
    }
  };

  if (!creds) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gold-500/30 bg-neutral-900/50 p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15">
              <Lock className="text-gold-400" size={28} />
            </div>
            <h1 className="font-serif text-2xl text-gold-400">Yönetici Girişi</h1>
            <p className="mt-1 text-sm text-neutral-400">Kullanıcı adı ve şifrenizle giriş yapın</p>
          </div>
          <label className="block mb-3">
            <span className="mb-1.5 block text-sm text-neutral-300">Kullanıcı Adı</span>
            <input
              value={uInput}
              onChange={(e) => setUInput(e.target.value)}
              className="input-luxury"
              placeholder="Kullanıcı adınız"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-neutral-300">Şifre</span>
            <input
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              className="input-luxury"
              placeholder="Şifreniz"
              autoComplete="current-password"
            />
          </label>
          {authErr && <p className="mt-3 text-sm text-red-400">{authErr}</p>}
          <button
            onClick={login}
            className="mt-4 w-full rounded-xl bg-gold-500 py-3 font-semibold text-black transition hover:bg-gold-400"
          >
            Giriş Yap
          </button>
          <button
            onClick={onExit}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm text-neutral-400 hover:text-gold-400"
          >
            <ArrowLeft size={14} /> Ana sayfaya dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Scissors className="text-gold-400" size={22} />
            <span className="font-serif text-lg text-gold-400">Yönetici Paneli</span>
            <span className="ml-2 hidden items-center gap-1.5 rounded-full border border-gold-500/30 px-2.5 py-1 text-xs text-gold-300 sm:inline-flex">
              {creds.role === 'founder' ? 'Kurucu' : 'Yönetici'} · {creds.display_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${view === 'list' ? 'bg-gold-500 text-black' : 'text-neutral-300 hover:bg-neutral-800'}`}
            >
              Randevular
            </button>
            <button
              onClick={() => setView('slots')}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${view === 'slots' ? 'bg-gold-500 text-black' : 'text-neutral-300 hover:bg-neutral-800'}`}
            >
              Saatler
            </button>
            <button
              onClick={() => setView('holidays')}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${view === 'holidays' ? 'bg-gold-500 text-black' : 'text-neutral-300 hover:bg-neutral-800'}`}
            >
              Tatiller
            </button>
            <button
              onClick={() => setView('settings')}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${view === 'settings' ? 'bg-gold-500 text-black' : 'text-neutral-300 hover:bg-neutral-800'}`}
            >
              Ayarlar
            </button>
            <button
              onClick={() => {
                setCreds(null);
                setUInput('');
                setPwInput('');
                onExit();
              }}
              className="ml-1 flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
            >
              <LogOut size={15} /> Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {view === 'list' && <AppointmentsView creds={creds} />}
        {view === 'slots' && <SlotsView creds={creds} />}
        {view === 'holidays' && <HolidaysView creds={creds} />}
        {view === 'settings' && <SettingsView creds={creds} />}
      </main>
    </div>
  );
}

/* --------------------------- Appointments list --------------------------- */
function AppointmentsView({ creds }: { creds: Creds }) {
  const [range, setRange] = useState<'day' | 'week' | 'month'>('day');
  const [anchor, setAnchor] = useState<string>(todayStr());
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { from, to, label } = useMemo(() => {
    const d = new Date(anchor + 'T00:00:00');
    let f = d,
      t = d;
    if (range === 'week') {
      const day = d.getDay();
      f = new Date(d);
      f.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      t = new Date(f);
      t.setDate(f.getDate() + 6);
    } else if (range === 'month') {
      f = new Date(d.getFullYear(), d.getMonth(), 1);
      t = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }
    return {
      from: dateToStr(f),
      to: dateToStr(t),
      label: formatDateTR(dateToStr(f)) + ' – ' + formatDateTR(dateToStr(t)),
    };
  }, [anchor, range]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetAppointments(creds.username, creds.password, from, to);
      setAppts([...data].sort((a, b) => `${a.appointment_date} ${a.appointment_time}`.localeCompare(`${b.appointment_date} ${b.appointment_time}`)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [from, to]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return appts;
    return appts.filter(
      (a) =>
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(q),
    );
  }, [appts, search]);

  const stats = useMemo(() => {
    const active = appts.filter((a) => a.status === 'active');
    const cancelled = appts.filter((a) => a.status === 'cancelled');
    const noShow = appts.filter((a) => a.status === 'no_show');
    const settings = appts.length;
    const slotCount = settings > 0 ? Math.max(1, settings) : 1;
    return {
      total: settings,
      active: active.length,
      cancelled: cancelled.length,
      noShow: noShow.length,
    };
  }, [appts]);

  const exportCsv = () => {
    const rows = [
      ['Ad', 'Soyad', 'Randevu Tarihi', 'Saat'],
      ...filtered.map((a) => [a.first_name, a.last_name, a.appointment_date, a.appointment_time]),
    ];
    const csv = '\uFEFF' + rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `imaj-randevular-${from}-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shiftAnchor = (dir: -1 | 1) => {
    const d = new Date(anchor + 'T00:00:00');
    if (range === 'day') d.setDate(d.getDate() + dir);
    else if (range === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(dateToStr(d));
  };

  const cancel = async (id: string) => {
    if (!confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) return;
    try {
      await adminCancelAppointment(creds.username, creds.password, id);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const markNoShow = async (id: string) => {
    try {
      await adminSetStatus(creds.username, creds.password, id, 'no_show');
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const reactivate = async (id: string) => {
    try {
      await adminSetStatus(creds.username, creds.password, id, 'active');
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const waLink = (phone: string, a: Appointment) =>
    `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
      `Merhaba ${a.first_name} ${a.last_name}, ${formatDateTR(a.appointment_date)} ${a.appointment_time} saatlerindeki randevunuzu hatırlatmak için yazdık. İmaj Erkek Kuaförü.`,
    )}`;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Toplam" value={stats.total} icon={<Calendar size={16} />} />
        <StatCard
          label="Aktif"
          value={stats.active}
          icon={<CheckCircle2 size={16} />}
          accent="emerald"
        />
        <StatCard label="İptal" value={stats.cancelled} icon={<XCircle size={16} />} accent="red" />
        <StatCard label="Gelmedi" value={stats.noShow} icon={<UserX size={16} />} accent="amber" />
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white">Müşteri Randevuları</h1>
        <p className="mt-1 text-sm text-neutral-400">Randevu alan kişilerin adını, soyadını, telefonunu, tarihini ve saatini buradan görüntüleyebilirsiniz.</p>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
          {(['day', 'week', 'month'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${range === r ? 'bg-gold-500 text-black' : 'text-neutral-300'}`}
            >
              {r === 'day' ? 'Günlük' : r === 'week' ? 'Haftalık' : 'Aylık'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftAnchor(-1)}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-gold-400"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-neutral-300 min-w-[120px] text-center">{label}</span>
          <button
            onClick={() => shiftAnchor(1)}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-gold-400"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setAnchor(todayStr())}
            className="ml-1 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:text-gold-400"
          >
            Bugün
          </button>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:border-gold-500 disabled:opacity-50" title="Randevuları yenile">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yenile
        </button>
        <button onClick={exportCsv} disabled={loading || filtered.length === 0} className="flex items-center gap-2 rounded-lg border border-gold-500/50 px-3 py-2 text-sm text-gold-400 hover:bg-gold-500/10 disabled:opacity-50" title="Listelenen randevuları Excel uyumlu dosya olarak indir">
          <Download size={16} /> Excel'e Aktar
        </button>
        <div className="relative ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, soyad veya telefon ara..."
            className="w-64 rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 focus:border-gold-500/50 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gold-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-16 text-center text-neutral-500">
          Bu dönemde randevu bulunamadı.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900 text-xs uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Saat</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-neutral-900/60">
                  <td className="px-4 py-3 font-medium text-neutral-100">
                    {a.first_name} {a.last_name}
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    {formatDateTR(a.appointment_date)}
                    <div className="text-xs text-neutral-500">{dayNameTR(a.appointment_date)}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{a.appointment_time}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={waLink(a.phone, a)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp hatırlatma"
                        className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-500/15"
                      >
                        <MessageCircle size={16} />
                      </a>
                      {a.status === 'active' && (
                        <>
                          <button
                            onClick={() => cancel(a.id)}
                            title="İptal et"
                            className="rounded-lg p-2 text-red-400 hover:bg-red-500/15"
                          >
                            <XCircle size={16} />
                          </button>
                          <button
                            onClick={() => markNoShow(a.id)}
                            title="Gelmedi olarak işaretle"
                            className="rounded-lg p-2 text-amber-400 hover:bg-amber-500/15"
                          >
                            <UserX size={16} />
                          </button>
                        </>
                      )}
                      {a.status !== 'active' && (
                        <button
                          onClick={() => reactivate(a.id)}
                          title="Tekrar aktif et"
                          className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-500/15"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Aktif', cls: 'bg-emerald-500/15 text-emerald-300' },
    cancelled: { label: 'İptal', cls: 'bg-red-500/15 text-red-300' },
    no_show: { label: 'Gelmedi', cls: 'bg-amber-500/15 text-amber-300' },
  };
  const m = map[status] || { label: status, cls: 'bg-neutral-700 text-neutral-200' };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: 'emerald' | 'red' | 'amber';
}) {
  const color =
    accent === 'emerald'
      ? 'text-emerald-400'
      : accent === 'red'
        ? 'text-red-400'
        : accent === 'amber'
          ? 'text-amber-400'
          : 'text-gold-400';
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${color}`}>
        {icon} {label}
      </div>
      <div className="mt-1.5 font-serif text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

/* ------------------------------- Slot manage ------------------------------- */
function SlotsView({ creds }: { creds: Creds }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [booked, setBooked] = useState<string[]>([]);
  const [closed, setClosed] = useState<string[]>([]);
  const [date, setDate] = useState<string>(todayStr());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, b, c] = await Promise.all([
        fetchSettings(),
        fetchBookedSlots(date),
        fetchClosedSlots(date),
      ]);
      setSettings(s);
      setBooked(b);
      setClosed(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [date]);

  const slots = settings ? generateSlots(settings) : [];

  const toggle = async (time: string) => {
    setActionLoading(time);
    try {
      if (closed.includes(time)) {
        await adminOpenSlot(creds.username, creds.password, date, time);
      } else if (!booked.includes(time)) {
        await adminCloseSlot(
          creds.username,
          creds.password,
          date,
          time,
          'Yönetici tarafından kapatıldı',
        );
      }
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <h2 className="font-serif text-xl text-gold-400">Saat Yönetimi</h2>
        <input
          type="date"
          value={date}
          min={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 focus:border-gold-500/50 focus:outline-none"
        />
        <span className="text-sm text-neutral-400">
          {dayNameTR(date)} · {formatDateTR(date)}
        </span>
      </div>
      <p className="mb-4 text-sm text-neutral-500">
        Dolu saatlar (randevulu) kırmızı, kapalı saatler (yönetici kapatmış) turuncu, müsait saatler
        yeşil. Boş saatlere tıklayarak kapatabilir, kapalı saatleri açabilirsiniz.
      </p>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gold-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {slots.map((t) => {
            const isBooked = booked.includes(t);
            const isClosed = closed.includes(t);
            return (
              <button
                key={t}
                disabled={isBooked || actionLoading === t}
                onClick={() => toggle(t)}
                className={[
                  'flex items-center justify-center gap-1.5 rounded-lg px-3 py-3 text-sm font-semibold transition',
                  isBooked
                    ? 'cursor-not-allowed bg-red-500/15 text-red-400/70'
                    : isClosed
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-black',
                ].join(' ')}
              >
                {actionLoading === t ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Clock size={14} />
                )}
                {t}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Holidays ------------------------------- */
function HolidaysView({ creds }: { creds: Creds }) {
  const [holidays, setHolidays] = useState<{ date: string; reason: string }[]>([]);
  const [newDate, setNewDate] = useState<string>('');
  const [newReason, setNewReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('holiday_date, reason')
        .order('holiday_date');
      if (error) throw error;
      setHolidays((data || []).map((r) => ({ date: r.holiday_date, reason: r.reason || '' })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!newDate) return;
    setSaving(true);
    try {
      await adminAddHoliday(creds.username, creds.password, newDate, newReason);
      setNewDate('');
      setNewReason('');
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d: string) => {
    try {
      await adminRemoveHoliday(creds.username, creds.password, d);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="mb-4 font-serif text-xl text-gold-400 flex items-center gap-2">
        <CalendarOff size={20} /> Tatil Günleri
      </h2>
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-400">Tarih</span>
          <input
            type="date"
            value={newDate}
            min={todayStr()}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 focus:border-gold-500/50 focus:outline-none"
          />
        </label>
        <label className="block flex-1 min-w-[160px]">
          <span className="mb-1 block text-xs text-neutral-400">Açıklama (opsiyonel)</span>
          <input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Bayram, özel gün..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 focus:border-gold-500/50 focus:outline-none"
          />
        </label>
        <button
          onClick={add}
          disabled={saving}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black hover:bg-gold-400 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Ekle'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gold-400" />
        </div>
      ) : holidays.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz tatil günü eklenmedi.</p>
      ) : (
        <div className="space-y-2">
          {holidays.map((h) => (
            <div
              key={h.date}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
            >
              <div>
                <div className="font-medium text-neutral-100">{formatDateTR(h.date)}</div>
                <div className="text-xs text-neutral-500">
                  {dayNameTR(h.date)}
                  {h.reason ? ` · ${h.reason}` : ''}
                </div>
              </div>
              <button
                onClick={() => remove(h.date)}
                className="rounded-lg p-2 text-red-400 hover:bg-red-500/15"
              >
                <XCircle size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Settings ------------------------------- */
function SettingsView({ creds }: { creds: Creds }) {
  const isFounder = creds.role === 'founder';
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminGetSettings(creds.username, creds.password)
      .then((d) => setS(d))
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    setSaved(false);
    try {
      await adminUpdateSettings(creds.username, creds.password, s);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !s)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-gold-400" />
      </div>
    );

  const upd = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS({ ...s, [k]: v });

  return (
    <div className="max-w-2xl">
      <h2 className="mb-5 font-serif text-xl text-gold-400 flex items-center gap-2">
        <SettingsIcon size={20} /> Salon Ayarları
      </h2>

      <div className="space-y-6">
        {isFounder ? (
          <>
            <Section title="Salon Bilgileri">
              <Input label="Salon Adı" value={s.shop_name} onChange={(v) => upd('shop_name', v)} />
              <Input label="Telefon" value={s.shop_phone} onChange={(v) => upd('shop_phone', v)} />
              <Input label="Adres" value={s.address} onChange={(v) => upd('address', v)} full />
              <Input
                label="Harita Bağlantısı"
                value={s.maps_link}
                onChange={(v) => upd('maps_link', v)}
                full
              />
              <Input
                label="Instagram"
                value={s.instagram_url}
                onChange={(v) => upd('instagram_url', v)}
              />
              <Input
                label="WhatsApp Numarası (uluslararası, örn. 90555...)"
                value={s.whatsapp_number}
                onChange={(v) => upd('whatsapp_number', v)}
              />
            </Section>

            <Section title="Çalışma Saatleri">
              <Input
                label="Başlangıç"
                value={s.work_start}
                onChange={(v) => upd('work_start', v)}
              />
              <Input label="Bitiş" value={s.work_end} onChange={(v) => upd('work_end', v)} />
              <Input
                label="Randevu Süresi (dk)"
                value={String(s.slot_minutes)}
                onChange={(v) => upd('slot_minutes', Number(v) || 0)}
              />
              <Input
                label="Günlük Maks. Randevu"
                value={String(s.max_daily_appointments)}
                onChange={(v) => upd('max_daily_appointments', Number(v) || 0)}
              />
              <Input
                label="Öğle Molası Başlangıç (boş = kapalı)"
                value={s.lunch_start || ''}
                onChange={(v) => upd('lunch_start', v || null)}
              />
              <Input
                label="Öğle Molası Bitiş"
                value={s.lunch_end || ''}
                onChange={(v) => upd('lunch_end', v || null)}
              />
            </Section>

            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 font-semibold text-black hover:bg-gold-400 disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{' '}
                Kaydet
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle2 size={16} /> Kaydedildi
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-center">
            <p className="text-sm text-neutral-400">
              Salon ayarlarını yalnızca <strong className="text-gold-400">Kurucu</strong>{' '}
              düzenleyebilir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
      <h3 className="mb-4 font-serif text-lg text-gold-400">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  full,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
  type?: string;
}) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-sm text-neutral-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-luxury"
      />
    </label>
  );
}
