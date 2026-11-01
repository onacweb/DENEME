-- Mevcut randevuları silmeden salon bilgilerini günceller.
UPDATE settings SET
 shop_name = 'İmaj Erkek Kuaförü',
 shop_phone = '+90 534 643 76 58',
 whatsapp_number = '905346437658',
 address = 'Yahya Kaptan Mah. Şehit Ergün Köncü Sk. No:10/D, 41050 İzmit / Kocaeli',
 maps_link = 'https://www.google.com/maps/place/%C4%B0maj+Erkek+Kuaf%C3%B6r%C3%BC/@40.7670274,29.948331,17z/data=!3m1!4b1!4m6!3m5!1s0x14cb4f8cfe91fd3d:0xf1f7da8e2ae95086!8m2!3d40.7670274!4d29.948331!16s%2Fg%2F11gwmhl937',
 work_start = '09:00',
 work_end = '19:20',
 slot_minutes = 20,
 max_daily_appointments = 31
WHERE id = 1;
