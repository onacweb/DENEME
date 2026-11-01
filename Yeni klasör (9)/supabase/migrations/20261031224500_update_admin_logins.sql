-- Bu dosyayı mevcut Supabase projenizde SQL Editor üzerinden bir kez çalıştırın.
-- Şifreler web sitesinin kaynak koduna eklenmez.
INSERT INTO public.admins (username, password, display_name, role) VALUES
  ('Fırat', 'verom4112341', 'Fırat', 'founder'),
  ('sinankulac41', 'sinankulac1966', 'Sinan Kulaç', 'admin')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

-- Eski Fırat hesabını devre dışı bırakın.
DELETE FROM public.admins WHERE username = 'fıratonac';
