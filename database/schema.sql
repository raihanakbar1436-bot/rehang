-- =========================================================
--  Schema Supabase untuk website MUA
--  Jalankan di: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

-- ---------- 1. BOOKINGS (dari form kontak) ----------
create table if not exists public.bookings (
    id          uuid primary key default gen_random_uuid(),
    created_at  timestamptz not null default now(),
    name        text not null check (char_length(name) between 2 and 100),
    contact     text not null check (char_length(contact) between 5 and 120),
    service     text not null check (service in (
                    'Wedding Make Up','Engagement Make Up','Prewedding Make Up',
                    'Party & Event Make Up','Graduation Make Up','Custom Makeup')),
    message     text check (message is null or char_length(message) <= 1000),
    status      text not null default 'new' check (status in ('new','contacted','booked','done','cancelled'))
);

create index if not exists bookings_created_at_idx on public.bookings (created_at desc);

alter table public.bookings enable row level security;

-- Pengunjung hanya boleh INSERT, dan status harus 'new'.
-- 'authenticated' ikut diizinkan: kalau admin sedang login di browser yang sama
-- lalu mengetes form, request-nya dianggap authenticated, bukan anon.
drop policy if exists "anon can insert bookings" on public.bookings;
create policy "anon can insert bookings"
    on public.bookings for insert
    to anon, authenticated
    with check (status = 'new');

-- Hanya user login (admin / pemilik MUA) yang boleh baca & ubah.
drop policy if exists "admin can read bookings" on public.bookings;
create policy "admin can read bookings"
    on public.bookings for select
    to authenticated
    using (true);

drop policy if exists "admin can update bookings" on public.bookings;
create policy "admin can update bookings"
    on public.bookings for update
    to authenticated
    using (true) with check (true);

-- ---------- 2. TESTIMONIALS (ditampilkan di website) ----------
create table if not exists public.testimonials (
    id            uuid primary key default gen_random_uuid(),
    created_at    timestamptz not null default now(),
    name          text not null,
    service       text not null,
    message       text not null,
    rating        int  not null default 5 check (rating between 1 and 5),
    avatar_url    text,
    is_published  boolean not null default true
);

alter table public.testimonials enable row level security;

-- Publik hanya boleh MEMBACA yang sudah dipublish.
drop policy if exists "public can read published testimonials" on public.testimonials;
create policy "public can read published testimonials"
    on public.testimonials for select
    to anon, authenticated
    using (is_published = true);

-- Admin boleh kelola penuh.
drop policy if exists "admin manage testimonials" on public.testimonials;
create policy "admin manage testimonials"
    on public.testimonials for all
    to authenticated
    using (true) with check (true);

-- ---------- 3. Data awal testimoni (sama seperti di HTML) ----------
insert into public.testimonials (name, service, message, rating, avatar_url)
select * from (values
    ('Aulia Rahma',     'Wedding Make Up',     'Makeup-nya flawless banget! Aku jadi sangat percaya diri di hari pernikahanku. Terima kasih banyak!', 5,
     'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'),
    ('Salsabila Putri', 'Prewedding Make Up',  'Hasil makeup-nya natural dan tahan lama. Timnya juga ramah dan profesional. Highly recommended!', 5,
     'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop'),
    ('Nodya Fitri',     'Engagement Make Up',  'Sangat puas dengan hasilnya! Detailnya rapi dan sesuai dengan keinginan aku.', 5,
     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop')
) as v(name, service, message, rating, avatar_url)
where not exists (select 1 from public.testimonials);
