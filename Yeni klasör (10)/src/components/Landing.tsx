import { useEffect, useState } from 'react';
import {
  Scissors,
  Calendar,
  Phone,
  MapPin,
  Instagram,
  MessageCircle,
  Menu,
  X,
  Clock,
  Star,
  Sparkles,
  User,
  ChevronRight,
  Shield,
} from 'lucide-react';
import BookingModal from './BookingModal';
import CancelModal from './CancelModal';
import { fetchSettings, type Settings } from '@/lib/supabase';

const HERO_IMG =
  'https://images.pexels.com/photos/26832816/pexels-photo-26832816.jpeg?auto=compress&cs=tinysrgb&w=1600';
const CUT_IMG =
  'https://images.pexels.com/photos/9992819/pexels-photo-9992819.jpeg?auto=compress&cs=tinysrgb&w=800';
const BEARD_IMG =
  'https://images.pexels.com/photos/2521978/pexels-photo-2521978.jpeg?auto=compress&cs=tinysrgb&w=800';
const SHOP_IMG =
  'https://images.pexels.com/photos/13138476/pexels-photo-13138476.jpeg?auto=compress&cs=tinysrgb&w=1200';

const SALON_MAPS_LINK = 'https://www.google.com/maps/place/%C4%B0maj+Erkek+Kuaf%C3%B6r%C3%BC/@40.7670274,29.948331,17z/data=!3m1!4b1!4m6!3m5!1s0x14cb4f8cfe91fd3d:0xf1f7da8e2ae95086!8m2!3d40.7670274!4d29.948331!16s%2Fg%2F11gwmhl937';
const SALON_ADDRESS = 'Yahya Kaptan Mah. Şehit Ergün Köncü Sk. No:10/D, 41050 İzmit / Kocaeli';

const services = [
  { icon: Scissors, title: 'Saç Kesimi', desc: 'Modern ve klasik kesim stilleri' },
  { icon: User, title: 'Sakal Tıraşı', desc: 'Sakal kesimi ve düzenleme' },
  { icon: Sparkles, title: 'Cilt Bakımı', desc: 'Cilt tazeleyici maske ve buhar' },
  { icon: Star, title: 'Saç Şekillendirme', desc: 'Günlük ve özel günler için stil' },
];

type Props = { onAdminClick: () => void };

export default function Landing({ onAdminClick }: Props) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  const waLink = 'https://wa.me/905346437658';

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gold-500/10 bg-neutral-950/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Scissors className="text-gold-400" size={26} />
            <span className="font-serif text-xl font-semibold tracking-wide text-gold-400">
              {'İmaj Erkek Kuaförü'}
            </span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollTo('services')} className="nav-link">
              Hizmetler
            </button>
            <button onClick={() => scrollTo('about')} className="nav-link">
              Hakkımızda
            </button>
            <button onClick={() => scrollTo('contact')} className="nav-link">
              İletişim
            </button>
            <button
              onClick={() => setBookingOpen(true)}
              className="rounded-full bg-gold-500 px-6 py-2 font-semibold text-black transition hover:bg-gold-400"
            >
              Hemen Randevu Al
            </button>
          </nav>
          <button onClick={() => setMenuOpen((v) => !v)} className="text-gold-400 md:hidden">
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <button onClick={() => scrollTo('services')} className="text-left text-neutral-300">
                Hizmetler
              </button>
              <button onClick={() => scrollTo('about')} className="text-left text-neutral-300">
                Hakkımızda
              </button>
              <button onClick={() => scrollTo('contact')} className="text-left text-neutral-300">
                İletişim
              </button>
              <button
                onClick={() => setBookingOpen(true)}
                className="rounded-full bg-gold-500 px-6 py-2 font-semibold text-black"
              >
                Hemen Randevu Al
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Kuaför" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/70 via-neutral-950/60 to-neutral-950" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <p className="mb-4 flex items-center justify-center gap-2 text-sm uppercase tracking-[0.3em] text-gold-400">
            <Sparkles size={16} /> Lüks Erkek Kuaförü
          </p>
          <h1 className="font-serif text-5xl font-bold leading-tight text-white sm:text-7xl">
            {'İmaj Erkek Kuaförü'}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-300">
            Profesyonel ustura, modern stiller ve lüks bir bakım deneyimi. Tarzınızı bizimle yeniden
            tanımlayın.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => setBookingOpen(true)}
              className="group flex items-center gap-2 rounded-full bg-gold-500 px-8 py-4 text-lg font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.35)] transition hover:bg-gold-400"
            >
              <Calendar size={20} /> Hemen Randevu Al
              <ChevronRight size={18} className="transition group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => setCancelOpen(true)}
              className="rounded-full border border-neutral-600 px-7 py-4 font-medium text-neutral-200 transition hover:border-gold-500 hover:text-gold-400"
            >
              Randevu İptali
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-1 text-gold-400">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={16} fill="currentColor" />
            ))}
            <span className="ml-2 text-sm text-neutral-400">Özenli hizmet · Kolay randevu</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-8" aria-label="Randevu bilgileri">
        <div className="grid gap-4 rounded-2xl border border-gold-500/20 bg-neutral-900/70 p-6 md:grid-cols-3">
          <div><p className="text-sm text-gold-400">Randevu Takvimi</p><p className="mt-1 font-semibold">3 yıl ileriye kadar rezervasyon</p></div>
          <div><p className="text-sm text-gold-400">Çalışma Saatleri</p><p className="mt-1 font-semibold">Her gün 09.00 – 19.20</p></div>
          <div><p className="text-sm text-gold-400">Randevu Aralıkları</p><p className="mt-1 font-semibold">20 dakikada bir</p></div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gold-400">Hizmetlerimiz</p>
          <h2 className="mt-3 font-serif text-4xl font-bold text-white">Özel Bakım</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/50 p-7 transition hover:border-gold-500/40 hover:bg-neutral-900"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400 transition group-hover:bg-gold-500 group-hover:text-black">
                <s.icon size={26} />
              </div>
              <h3 className="font-serif text-xl text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-400">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-neutral-800">
            <img src={CUT_IMG} alt="Saç kesimi" className="h-72 w-full object-cover" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-800">
            <img src={BEARD_IMG} alt="Sakal tıraşı" className="h-72 w-full object-cover" />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-neutral-800">
            <img src={SHOP_IMG} alt="Kuaför salonu" className="h-[420px] w-full object-cover" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold-400">Hakkımızda</p>
            <h2 className="mt-3 font-serif text-4xl font-bold text-white">
              İyi Bir Kesim, İyi Bir Deneyim
            </h2>
            <p className="mt-5 text-neutral-300 leading-relaxed">
              {'İmaj Erkek Kuaförü'}, erkek bakımının inceliğini modern bir
              atmosferde sunar. Her detay özenle, her müşteriye özel yaklaşırız. Ustura ve makasın
              buluştuğu yerde, tarzınızı yeniden keşfedin.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { n: '3 Yıl', l: 'Randevu Takvimi' },
                { n: '20 dk', l: 'Randevu Aralığı' },
                { n: 'Online', l: 'Kolay Rezervasyon' },
              ].map((stat) => (
                <div
                  key={stat.l}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-center"
                >
                  <div className="font-serif text-3xl font-bold text-gold-400">{stat.n}</div>
                  <div className="mt-1 text-xs text-neutral-400">{stat.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gold-400">İletişim</p>
          <h2 className="mt-3 font-serif text-4xl font-bold text-white">Bizi Ziyaret Edin</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <a
            href={SALON_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card group"
          >
            <MapPin className="text-gold-400" size={28} />
            <h3 className="mt-4 font-serif text-xl text-white">Adres</h3>
            <p className="mt-1 text-sm text-neutral-400">{SALON_ADDRESS}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm text-gold-400">
              Haritada Aç <ChevronRight size={14} />
            </span>
          </a>
          <a href="tel:+905346437658" className="contact-card group">
            <Phone className="text-gold-400" size={28} />
            <h3 className="mt-4 font-serif text-xl text-white">Telefon</h3>
            <p className="mt-1 text-sm text-neutral-400">{'+90 534 643 76 58'}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm text-gold-400">
              Ara <ChevronRight size={14} />
            </span>
          </a>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="contact-card group">
            <MessageCircle className="text-gold-400" size={28} />
            <h3 className="mt-4 font-serif text-xl text-white">WhatsApp</h3>
            <p className="mt-1 text-sm text-neutral-400">Hızlı iletişim ve sorularınız</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm text-gold-400">
              Yaz <ChevronRight size={14} />
            </span>
          </a>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-400">
          <span className="flex items-center gap-2">
            <Clock size={16} className="text-gold-400" /> {settings?.work_start}–
            {settings?.work_end}
          </span>
          <a
            href={settings?.instagram_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-gold-400"
          >
            <Instagram size={16} className="text-gold-400" /> Instagram
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <Scissors className="text-gold-400" size={22} />
            <span className="font-serif text-lg text-gold-400">
              {'İmaj Erkek Kuaförü'}
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Tüm hakları saklıdır.
          </p>
          <button
            onClick={onAdminClick}
            className="flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-gold-400"
          >
            <Shield size={14} /> Yönetici Girişi
          </button>
        </div>
      </footer>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
      <CancelModal open={cancelOpen} onClose={() => setCancelOpen(false)} />
    </div>
  );
}
