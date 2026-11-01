import { useEffect, useState } from 'react';
import { Loader2, Phone, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import Modal from './ui/Modal';
import { cancelOwnAppointment } from '@/lib/supabase';

type Props = { open: boolean; onClose: () => void };

type Stage = 'form' | 'success' | 'notfound';

export default function CancelModal({ open, onClose }: Props) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhone('');
      setCode('');
      setStage('form');
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    if (!phone.trim() || !code.trim()) {
      setError('Telefon ve iptal kodu gerekli.');
      return;
    }
    if (code.length !== 4) {
      setError('İptal kodu 4 haneli olmalı.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ok = await cancelOwnAppointment(phone.trim(), code.trim());
      setStage(ok ? 'success' : 'notfound');
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
      title="Randevu İptali"
      subtitle="Telefon ve 4 haneli iptal kodu ile"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {stage === 'form' && (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-300">
              <Phone size={16} className="text-gold-400" /> Telefon Numarası
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-luxury"
              placeholder="Randevu verirken kullandığınız numara"
              maxLength={20}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-300">
              <KeyRound size={16} className="text-gold-400" /> İptal Kodu (4 hane)
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="input-luxury font-mono tracking-[0.4em]"
              placeholder="••••"
              inputMode="numeric"
              maxLength={4}
            />
          </label>
          <button
            onClick={submit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/90 py-3 font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
            Randevuyu İptal Et
          </button>
        </div>
      )}

      {stage === 'success' && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 size={36} className="text-emerald-400" />
          </div>
          <h3 className="font-serif text-2xl text-gold-400">Randevu İptal Edildi</h3>
          <p className="mt-2 text-sm text-neutral-400">Randevu saati tekrar müsait hale geldi.</p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl border border-neutral-700 py-3 text-neutral-300 hover:bg-neutral-800"
          >
            Kapat
          </button>
        </div>
      )}

      {stage === 'notfound' && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
            <XCircle size={36} className="text-red-400" />
          </div>
          <h3 className="font-serif text-2xl text-red-400">İptal Başarısız</h3>
          <p className="mt-2 text-sm text-neutral-400">
            Telefon veya iptal kodu hatalı, ya da randevu zaten iptal edilmiş.
          </p>
          <button
            onClick={() => setStage('form')}
            className="mt-6 w-full rounded-xl bg-gold-500 py-3 font-semibold text-black hover:bg-gold-400"
          >
            Tekrar Dene
          </button>
        </div>
      )}
    </Modal>
  );
}
