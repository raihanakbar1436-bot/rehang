# Website MUA (rehang)

Static site (Tailwind CDN) + Supabase (database) + Cloudflare Pages (hosting).

```
site/       index.html, sytle.css, hang.js, config.js, _headers
database/   schema.sql, admin.sql
assets/     (kosong, untuk gambar lokal)
```

## 1. Supabase
1. Buka **SQL Editor** -> jalankan isi `database/schema.sql`.
2. **Project Settings -> API** -> salin *Project URL* dan key **anon/public**.
3. Tempel ke `site/config.js`. (Jangan pakai `service_role`.)

Cara kerja keamanan: pengunjung (anon) hanya boleh `INSERT` ke `bookings`
dan `SELECT` testimoni yang `is_published = true`. Booking hanya bisa dibaca
lewat dashboard Supabase / user login.

## 2. Cloudflare (Workers Builds / Pages)
Repo ini punya `wrangler.jsonc` yang mengarah ke folder `site`. Build command dikosongkan, deploy command: `npx wrangler deploy`.

Jika memakai Cloudflare Pages biasa:
- Framework preset: **None**
- Build command: *(kosong)*
- Build output directory: **`site`**

Setiap push ke GitHub akan otomatis deploy.

## 3. Test
Buka website -> isi form -> cek tabel `bookings` di Supabase (Table Editor).

## 4. Admin & ganti foto
1. Jalankan `database/admin.sql` di SQL Editor.
2. **Authentication -> Users -> Add user** -> isi email + password -> centang *Auto Confirm User*.
3. **Authentication -> Sign In / Providers -> Email** -> matikan **Allow new users to sign up**
   (supaya orang lain tidak bisa daftar sendiri).
4. Jadikan akun itu admin: buka bagian #5 di bawah file `admin.sql`, hapus tanda `--`,
   ganti email, lalu RUN.
5. Buka `https://domain-kamu/admin.html` -> login -> klik **Ganti Foto** pada foto yang mau diubah.

Foto disimpan di Supabase Storage (bucket `site-images`). Tombol **Kembalikan ke Default**
mengembalikan foto ke versi awal di `index.html`.
