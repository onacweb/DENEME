# Kuaför sitesi — Visual Studio Code düzenleme rehberi

## Açma
1. ZIP dosyasını bir klasöre çıkarın.
2. Bilgisayarınızda Node.js LTS yüklü olsun: https://nodejs.org/
3. **BASLAT.bat** dosyasına çift tıklayın. İlk açılışta gerekli paketler indirilir.
4. Tarayıcıda **http://localhost:5173** açılır. Komut penceresini kapatmayın.
5. Düzenlemek için VS Code > Dosya > Klasör Aç > çıkardığınız klasörü seçin.

Alternatif: VS Code terminalinde `npm install`, ardından `npm run dev` çalıştırın.

## Hangi dosyada ne var?
- `src/components/Landing.tsx`: Ana sayfa ve kullanıcıya görünen alanlar.
- `src/components/Admin.tsx`: Yönetici paneli.
- `src/components/BookingModal.tsx`: Randevu alma ekranı.
- `src/components/CancelModal.tsx`: Randevu iptal ekranı.
- `src/index.css`: Genel stil.
- `src/lib/time.ts`: Tarih ve saat yardımcıları.
- `src/lib/supabase.ts`: Veritabanı bağlantısı ve işlemleri.
- `src/App.tsx`: Ana sayfa / admin görünümü geçişi.
- `.env`: Mevcut Supabase bağlantı ayarları; gizli anahtar eklemeyin, bu dosyayı herkese açık paylaşmayın.

## Önemli
- Orijinal React/TypeScript kodu ve mevcut Supabase entegrasyonu korunmuştur.
- Randevuların farklı cihazlarda eşzamanlı çalışması için mevcut veritabanı bağlantısının aktif olması gerekir.
- Kaynak kodu düzenlemek için `npm run dev`; yayın sürümü oluşturmak için `npm run build` kullanın.
- Kaynak kodundaki admin yetkilerini yalnızca arayüzde gizlemek, güvenli erişim kontrolü sağlamaz.
