-- =========================================================
--  ADMIN + FOTO  (jalankan SETELAH schema.sql)
--  Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

-- ---------- 1. Daftar admin ----------
create table if not exists public.admins (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists "admin reads own row" on public.admins;
create policy "admin reads own row"
    on public.admins for select
    to authenticated
    using (user_id = auth.uid());

-- Helper: true kalau user yang login terdaftar di tabel admins
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- 2. Perketat policy lama: "authenticated" saja TIDAK cukup ----------
drop policy if exists "admin can read bookings"   on public.bookings;
drop policy if exists "admin can update bookings" on public.bookings;
drop policy if exists "admin manage testimonials" on public.testimonials;

create policy "admin can read bookings"
    on public.bookings for select to authenticated using (public.is_admin());

create policy "admin can update bookings"
    on public.bookings for update to authenticated
    using (public.is_admin()) with check (public.is_admin());

create policy "admin manage testimonials"
    on public.testimonials for all to authenticated
    using (public.is_admin()) with check (public.is_admin());

-- Form booking harus tetap bisa dikirim saat admin sedang login di browser yang sama
drop policy if exists "anon can insert bookings" on public.bookings;
create policy "anon can insert bookings"
    on public.bookings for insert
    to anon, authenticated
    with check (status = 'new');

-- Admin juga perlu melihat testimoni yang belum dipublish
-- (policy "public can read published testimonials" tetap berlaku untuk pengunjung)

-- ---------- 3. Tabel foto website ----------
create table if not exists public.site_images (
    key        text primary key,          -- contoh: hero-1, about-1, portfolio-3
    url        text not null,
    path       text,                      -- lokasi file di bucket (untuk hapus file lama)
    updated_at timestamptz not null default now()
);
alter table public.site_images enable row level security;

drop policy if exists "public read site_images" on public.site_images;
create policy "public read site_images"
    on public.site_images for select to anon, authenticated using (true);

drop policy if exists "admin manage site_images" on public.site_images;
create policy "admin manage site_images"
    on public.site_images for all to authenticated
    using (public.is_admin()) with check (public.is_admin());

-- ---------- 4. Storage bucket untuk foto ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
    set public = true,
        file_size_limit = 5242880,
        allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "public read site-images"  on storage.objects;
drop policy if exists "admin insert site-images" on storage.objects;
drop policy if exists "admin update site-images" on storage.objects;
drop policy if exists "admin delete site-images" on storage.objects;

create policy "public read site-images"
    on storage.objects for select to anon, authenticated
    using (bucket_id = 'site-images');

create policy "admin insert site-images"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'site-images' and public.is_admin());

create policy "admin update site-images"
    on storage.objects for update to authenticated
    using (bucket_id = 'site-images' and public.is_admin());

create policy "admin delete site-images"
    on storage.objects for delete to authenticated
    using (bucket_id = 'site-images' and public.is_admin());

-- =========================================================
--  5. JADIKAN AKUN KAMU ADMIN  (jalankan SETELAH user dibuat
--     di Authentication -> Users -> Add user)
--     Ganti email di bawah, lalu RUN bagian ini saja.
-- =========================================================
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'EMAIL_ADMIN_KAMU@gmail.com'
-- on conflict do nothing;
