# Website MUA (rehang)

Static site (Tailwind CDN) + Supabase (database) + Cloudflare Pages (hosting).

```
site/       index.html, sytle.css, hang.js, config.js, _headers
database/   schema.sql
assets/     (kosong, untuk gambar lokal)
```

## 1. Supabase
1. Buka **SQL Editor** -> jalankan isi `database/schema.sql`.
2. **Project Settings -> API** -> salin *Project URL* dan key **anon/public**.
3. Tempel ke `site/config.js`. (Jangan pakai `service_role`.)

Cara kerja keamanan: pengunjung (anon) hanya boleh `INSERT` ke `bookings`
dan `SELECT` testimoni yang `is_published = true`. Booking hanya bisa dibaca
lewat dashboard Supabase / user login.

## 2. Cloudflare Pages
- Framework preset: **None**
- Build command: *(kosong)*
- Build output directory: **`site`**

Setiap push ke GitHub akan otomatis deploy.

## 3. Test
Buka website -> isi form -> cek tabel `bookings` di Supabase (Table Editor).
