# Yönetici girişlerinin kurulumu

İki yönetici hesabı için `supabase/migrations/20261031224500_update_admin_logins.sql` dosyasının içeriğini mevcut Supabase projenizin SQL Editor bölümünde **bir kez** çalıştırın. ZIP dosyasını siteye yüklemek tek başına veritabanındaki kullanıcıları değiştirmez.

- Yönetici 1 kullanıcı adı: `Fırat`
- Yönetici 2 kullanıcı adı: `sinankulac41`

Şifreler SQL dosyasında yer alır; site arayüzüne yazılmamıştır. Kurulumdan sonra bu SQL dosyasını herkese açık sunucuya yüklemeyin.

Randevu listesinde ad-soyad, tarih ve saat gösterilir; telefon ve iptal kodu listeden ve CSV dışa aktarımından çıkarılmıştır.
