# İmaj Erkek Kuaförü – Kurulum ve Güncelleme

1. Bu klasörü Visual Studio Code ile açın.
2. Bilgisayarda Node.js yüklü olmalı. `BASLAT.bat` dosyasını çalıştırın veya terminalde `npm install` ve `npm run dev` komutlarını kullanın.
3. Tarayıcıda terminalin verdiği localhost adresini açın. `index.html` dosyasını doğrudan açmayın.
4. Randevu kayıtları ve yönetici işlemleri için mevcut Supabase bağlantısı gereklidir. `.env` içindeki bağlantı bilgilerini paylaşmayın.
5. Mevcut veritabanınızda salon adını, numarayı ve çalışma saatlerini kalıcı olarak güncellemek için `supabase/migrations/20261031190000_update_salon_profile.sql` dosyasındaki SQL'i kendi Supabase SQL Editor ekranında **bir kez** çalıştırın. Bu işlem mevcut randevuları silmez.
6. Takvim bugünden başlayarak üç yıl ileriye kadar seçim sağlar. Saat aralıkları 20 dakikadır; bitiş saati 19:20'dir (son uygun başlangıç 19:00).
7. Yönetici panelindeki saat, tatil ve mola ayarları takvimdeki uygunluğu değiştirebilir.

**Not:** Site içindeki iletişim ve konum bilgileri sabitlenmiştir; mevcut Supabase ayarları farklıysa SQL güncellemesini uygulayın. Gerçek müşteriler arasında randevu çakışmalarını engellemek için sunucu tarafındaki mevcut kontrol korunmuştur.
