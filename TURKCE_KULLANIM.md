# Türkçe Kullanım Rehberi

Bu projedeki müşteri ekranları, randevu alma, iptal etme ve yönetici paneli Türkçedir. Tarayıcı sekmesinin başlığı ve sayfa dili de Türkçe olarak ayarlanmıştır.

## Metinleri değiştirmek

Visual Studio Code ile klasörü açın. Ctrl+Shift+H ile bütün proje içinde metin arayıp topluca değiştirin.

- `src/components/Landing.tsx`: Ana sayfa ve hizmetler
- `src/components/BookingModal.tsx`: Randevu formu
- `src/components/CancelModal.tsx`: İptal ekranı
- `src/components/Admin.tsx`: Yönetici paneli
- `index.html`: Tarayıcı başlığı

**Önemli:** `src/lib` ve `supabase` içindeki İngilizce değişken, tablo ve fonksiyon isimleri yazılımın çalışması için gereklidir; bunları Türkçeye çevirmeyin.

Siteyi açmak için `BASLAT.bat` dosyasını kullanın; `index.html` dosyasına çift tıklamayın. Node.js kurulu olmalıdır.
