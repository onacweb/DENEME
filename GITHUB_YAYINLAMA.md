# GitHub Pages yayınlama

1. ZIP'i çıkarın. GitHub `onacweb/DENEME` deposunda eski dosyalarla karıştırmadan yeni proje dosyalarını yükleyin. `.github/workflows/pages.yml` dosyasının da GitHub'a gittiğini kontrol edin (gizli klasör olduğu için kolayca atlanabilir).
2. Depoda **Settings > Pages > Build and deployment > Source** seçeneğini **GitHub Actions** olarak değiştirin.
3. Depoda **Settings > Secrets and variables > Actions > New repository secret** ile `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` adlarında iki secret oluşturun. Değerleri bilgisayarınızdaki projenin `.env` dosyasından alın. `.env` dosyasını GitHub'a yüklemeyin.
4. **Actions** sekmesinde `Kuafor sitesini yayinla` çalışmasının yeşil tamamlanmasını bekleyin. Gerekirse **Run workflow** ile çalıştırın.
5. Özel alan adını kullanıyorsanız **Settings > Pages > Custom domain** alanında ayarlayın. GitHub Actions ile yayınlanan sitelerde alan adı Pages ayarından yönetilir.
6. Site açılmazsa Actions ekranındaki kırmızı hata mesajının ekran görüntüsünü gönderin.

**Not:** Bu işlem yalnızca web sitesini yayınlar. Randevuların farklı cihazlarda ortak kaydedilmesi ve yönetici girişinin çalışması için mevcut Supabase veritabanı, tablolar, yetkiler ve yönetici hesapları ayrıca kurulmuş olmalıdır. Sadece statik GitHub Pages bunları sağlamaz.
