/* =========================================================
   admin.js - panel admin MUA
   Login (Supabase Auth) + ganti foto website & avatar testimoni
   ========================================================= */
const CFG = window.APP_CONFIG || {};
const BUCKET = "site-images";
const MAX_EDGE = 1600;     // sisi terpanjang setelah dikompres (px)
const MAX_INPUT = 15 * 1024 * 1024; // file asli maks 15 MB

const SLOTS = [
    {
        "key": "hero-1",
        "label": "Hero Slider 1",
        "group": "Beranda",
        "default": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1000&auto=format&fit=crop"
    },
    {
        "key": "hero-2",
        "label": "Hero Slider 2",
        "group": "Beranda",
        "default": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1000&auto=format&fit=crop"
    },
    {
        "key": "hero-3",
        "label": "Hero Slider 3",
        "group": "Beranda",
        "default": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop"
    },
    {
        "key": "about-1",
        "label": "Foto Tentang Saya",
        "group": "Tentang Saya",
        "default": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop"
    },
    {
        "key": "portfolio-1",
        "label": "Portfolio - Wedding",
        "group": "Portfolio",
        "default": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop"
    },
    {
        "key": "portfolio-2",
        "label": "Portfolio - Prewedding",
        "group": "Portfolio",
        "default": "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop"
    },
    {
        "key": "portfolio-3",
        "label": "Portfolio - Engagement",
        "group": "Portfolio",
        "default": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop"
    },
    {
        "key": "portfolio-4",
        "label": "Portfolio - Party",
        "group": "Portfolio",
        "default": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=600&auto=format&fit=crop"
    },
    {
        "key": "portfolio-5",
        "label": "Portfolio - Graduation",
        "group": "Portfolio",
        "default": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop"
    },
    {
        "key": "portfolio-6",
        "label": "Portfolio - Custom",
        "group": "Portfolio",
        "default": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop"
    }
];

const ready = window.supabase && CFG.SUPABASE_URL && !CFG.SUPABASE_URL.includes("YOUR-PROJECT-REF");
const $ = id => document.getElementById(id);

if (!ready) {
    $("login-view").classList.add("hidden");
    $("config-error").classList.remove("hidden");
    throw new Error("Supabase belum dikonfigurasi di config.js");
}
const db = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

/* ---------- util ---------- */
function toast(msg, ok = true) {
    const t = $("toast");
    t.textContent = msg;
    t.className = "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-sm shadow-lg text-white " +
        (ok ? "bg-nude-800" : "bg-red-700");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add("hidden"), 3500);
}
function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}

/* Resize + kompres di browser -> webp, supaya hemat storage & loading cepat */
async function compressImage(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Format harus JPG, PNG, atau WebP.");
    if (file.size > MAX_INPUT) throw new Error("Ukuran file maksimal 15 MB.");
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise(res => canvas.toBlob(res, "image/webp", 0.85));
    if (!blob) throw new Error("Gagal memproses gambar.");
    return blob;
}

async function uploadToBucket(folder, blob) {
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const { error } = await db.storage.from(BUCKET).upload(path, blob, {
        contentType: "image/webp", cacheControl: "31536000", upsert: false
    });
    if (error) throw error;
    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    return { path, url: data.publicUrl };
}
async function removeFromBucket(path) {
    if (!path) return;
    const { error } = await db.storage.from(BUCKET).remove([path]);
    if (error) console.warn("Gagal hapus file lama:", error.message);
}

/* ---------- auth ---------- */
let currentUserId = null;

function showLoginError(msg) {
    $("login-error").textContent = msg;
    $("login-error").classList.remove("hidden");
}

async function showForSession(session) {
    if (!session) {
        currentUserId = null;
        $("login-view").classList.remove("hidden");
        $("admin-view").classList.add("hidden");
        return;
    }
    if (currentUserId === session.user.id) return; // sudah tampil, jangan muat ulang

    // pastikan user ini benar-benar admin
    const { data: isAdmin, error } = await db.rpc("is_admin");
    if (error) {
        console.error("[admin] rpc is_admin gagal:", error);
        showLoginError("Gagal cek status admin: " + error.message +
            " (kemungkinan database/admin.sql belum dijalankan)");
        await db.auth.signOut();
        return;
    }
    if (!isAdmin) {
        showLoginError("Login berhasil, tapi akun ini belum terdaftar sebagai admin. Jalankan query INSERT ke tabel admins.");
        await db.auth.signOut();
        return;
    }
    currentUserId = session.user.id;
    $("login-error").classList.add("hidden");
    $("login-view").classList.add("hidden");
    $("admin-view").classList.remove("hidden");
    $("admin-email").textContent = session.user.email;
    loadBookings();
    loadSiteImages();
    loadTestimonials();
}

$("login-form").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = $("login-btn");
    $("login-error").classList.add("hidden");
    btn.disabled = true; btn.textContent = "Masuk...";
    try {
        const timeout = new Promise((_, rej) =>
            setTimeout(() => rej(new Error("TIMEOUT")), 15000));
        const { error } = await Promise.race([
            db.auth.signInWithPassword({
                email: $("email").value.trim(),
                password: $("password").value
            }),
            timeout
        ]);
        if (error) {
            console.error("[admin] login gagal:", error);
            const m = error.message || "";
            if (/invalid login credentials/i.test(m)) showLoginError("Email atau password salah.");
            else if (/not confirmed/i.test(m)) showLoginError("Email belum dikonfirmasi. Di Supabase: Authentication -> Users -> klik user -> Confirm user.");
            else showLoginError("Login gagal: " + m);
        }
    } catch (err) {
        console.error(err);
        if (err.message === "TIMEOUT") {
            showLoginError("Supabase tidak merespons (15 detik). Kemungkinan: project Supabase sedang di-pause, tab admin lain masih terbuka, atau URL di config.js salah. Cek F12 -> Network.");
        } else {
            showLoginError("Tidak bisa terhubung ke Supabase. Cek SUPABASE_URL di config.js dan koneksi internet.");
        }
    } finally {
        btn.disabled = false; btn.textContent = "Masuk";
    }
});
$("logout-btn").addEventListener("click", () => db.auth.signOut());

// PENTING: jangan panggil fungsi Supabase langsung di dalam callback ini
// (bisa deadlock di supabase-js v2) -> dibungkus setTimeout.
db.auth.onAuthStateChange((evt, session) => {
    if (evt === "SIGNED_IN" || evt === "SIGNED_OUT") {
        setTimeout(() => showForSession(session), 0);
    }
});
db.auth.getSession().then(({ data }) => showForSession(data.session));

/* ---------- tabs ---------- */
document.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(b => {
        const on = b === btn;
        b.className = "px-5 py-2 rounded-full text-sm font-medium transition-all " +
            (on ? "bg-nude-700 text-white" : "bg-nude-200 text-nude-800 hover:bg-nude-300");
    });
    ["bookings", "images", "testi"].forEach(t =>
        $("tab-" + t).classList.toggle("hidden", btn.dataset.tab !== t));
    if (btn.dataset.tab === "bookings") loadBookings();
}));

/* ---------- Foto website ---------- */
let imageRows = {};   // key -> {url, path}

async function loadSiteImages() {
    const { data, error } = await db.from("site_images").select("key, url, path");
    if (error) return toast("Gagal memuat foto: " + error.message, false);
    imageRows = Object.fromEntries((data || []).map(r => [r.key, r]));
    renderSlots();
}

function renderSlots() {
    const wrap = $("slots");
    wrap.replaceChildren();
    let lastGroup = null;
    SLOTS.forEach(slot => {
        if (slot.group !== lastGroup) {
            lastGroup = slot.group;
            wrap.appendChild(el("h3", "col-span-full font-serif font-bold text-lg text-nude-900 mt-4", slot.group));
        }
        const row = imageRows[slot.key];
        const card = el("div", "bg-white rounded-2xl border border-nude-200 overflow-hidden shadow-sm flex flex-col");

        const imgBox = el("div", "aspect-[4/5] bg-nude-200 relative");
        const img = el("img", "w-full h-full object-cover");
        img.src = row ? row.url : slot.default;
        img.alt = slot.label;
        img.loading = "lazy";
        imgBox.appendChild(img);
        if (row) imgBox.appendChild(el("span", "absolute top-2 left-2 text-[10px] bg-nude-800 text-white px-2 py-0.5 rounded-full", "Custom"));
        card.appendChild(imgBox);

        const body = el("div", "p-4 space-y-3");
        body.appendChild(el("p", "text-sm font-semibold text-nude-900", slot.label));

        const input = el("input", "hidden");
        input.type = "file"; input.accept = "image/jpeg,image/png,image/webp";
        const pick = el("button", "w-full py-2 rounded-full bg-nude-700 hover:bg-nude-800 text-white text-xs font-medium", "Ganti Foto");
        pick.type = "button";
        pick.onclick = () => input.click();
        input.onchange = async () => {
            if (!input.files[0]) return;
            pick.disabled = true; pick.textContent = "Mengunggah...";
            try {
                await replaceSlotImage(slot, input.files[0]);
                toast(slot.label + " diperbarui");
                await loadSiteImages();
            } catch (err) {
                toast(err.message || "Gagal mengunggah", false);
                pick.disabled = false; pick.textContent = "Ganti Foto";
            }
        };
        body.append(input, pick);

        if (row) {
            const reset = el("button", "w-full py-2 rounded-full border border-nude-400 text-nude-800 text-xs hover:bg-nude-100", "Kembalikan ke Default");
            reset.type = "button";
            reset.onclick = async () => {
                if (!confirm("Kembalikan foto ini ke versi awal?")) return;
                reset.disabled = true;
                const { error } = await db.from("site_images").delete().eq("key", slot.key);
                if (error) { toast(error.message, false); reset.disabled = false; return; }
                await removeFromBucket(row.path);
                toast("Dikembalikan ke default");
                loadSiteImages();
            };
            body.appendChild(reset);
        }
        card.appendChild(body);
        wrap.appendChild(card);
    });
}

async function replaceSlotImage(slot, file) {
    const blob = await compressImage(file);
    const old = imageRows[slot.key];
    const { path, url } = await uploadToBucket("site/" + slot.key, blob);
    const { error } = await db.from("site_images").upsert(
        { key: slot.key, url, path, updated_at: new Date().toISOString() },
        { onConflict: "key" }
    );
    if (error) { await removeFromBucket(path); throw error; }
    if (old) await removeFromBucket(old.path); // bersihkan file lama
}

/* ---------- Foto testimoni ---------- */
async function loadTestimonials() {
    const { data, error } = await db.from("testimonials")
        .select("id, name, service, avatar_url, is_published")
        .order("created_at", { ascending: false });
    if (error) return toast("Gagal memuat testimoni: " + error.message, false);

    const wrap = $("testi-list");
    wrap.replaceChildren();
    if (!data.length) {
        wrap.appendChild(el("p", "text-sm text-nude-600", "Belum ada testimoni. Jalankan schema.sql untuk mengisi data awal."));
        return;
    }
    data.forEach(t => {
        const card = el("div", "bg-white rounded-2xl border border-nude-200 p-4 flex items-center gap-4");
        let avatar;
        if (t.avatar_url) {
            avatar = el("img", "w-16 h-16 rounded-full object-cover flex-shrink-0");
            avatar.src = t.avatar_url; avatar.alt = t.name;
        } else {
            avatar = el("div", "w-16 h-16 rounded-full bg-nude-300 text-nude-800 flex items-center justify-center font-bold text-xl flex-shrink-0", t.name.charAt(0).toUpperCase());
        }
        const info = el("div", "flex-1 min-w-0");
        info.appendChild(el("p", "font-semibold text-sm text-nude-900 truncate", t.name));
        info.appendChild(el("p", "text-xs text-nude-600 truncate", t.service + (t.is_published ? "" : " - (disembunyikan)")));

        const input = el("input", "hidden");
        input.type = "file"; input.accept = "image/jpeg,image/png,image/webp";
        const btn = el("button", "px-4 py-2 rounded-full bg-nude-700 hover:bg-nude-800 text-white text-xs font-medium flex-shrink-0", "Ganti");
        btn.type = "button";
        btn.onclick = () => input.click();
        input.onchange = async () => {
            if (!input.files[0]) return;
            btn.disabled = true; btn.textContent = "...";
            try {
                const blob = await compressImage(input.files[0]);
                const { path, url } = await uploadToBucket("avatars/" + t.id, blob);
                const { error } = await db.from("testimonials").update({ avatar_url: url }).eq("id", t.id);
                if (error) { await removeFromBucket(path); throw error; }
                toast("Foto " + t.name + " diperbarui");
                loadTestimonials();
            } catch (err) {
                toast(err.message || "Gagal mengunggah", false);
                btn.disabled = false; btn.textContent = "Ganti";
            }
        };
        card.append(avatar, info, input, btn);
        wrap.appendChild(card);
    });
}


/* ---------- Booking ---------- */
const STATUS = {
    new:       { label: "Baru",            cls: "bg-red-100 text-red-800" },
    contacted: { label: "Sudah dihubungi", cls: "bg-amber-100 text-amber-800" },
    booked:    { label: "Booked",          cls: "bg-blue-100 text-blue-800" },
    done:      { label: "Selesai",         cls: "bg-green-100 text-green-800" },
    cancelled: { label: "Dibatalkan",      cls: "bg-nude-200 text-nude-700" }
};
let bookings = [];

function waNumber(contact) {
    // ambil nomor kalau kontak bukan email. 08xx -> 628xx
    if (contact.includes("@")) return null;
    let d = contact.replace(/[^0-9]/g, "");
    if (d.length < 8) return null;
    if (d.startsWith("0")) d = "62" + d.slice(1);
    return d;
}
function fmtDate(iso) {
    return new Date(iso).toLocaleString("id-ID", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
}

async function loadBookings() {
    const { data, error } = await db.from("bookings")
        .select("id, created_at, name, contact, service, message, status")
        .order("created_at", { ascending: false })
        .limit(500);
    if (error) {
        $("bk-list").replaceChildren(el("p", "text-sm text-red-700", "Gagal memuat booking: " + error.message));
        return;
    }
    bookings = data || [];
    renderBookings();
}

function renderBookings() {
    const filter = $("bk-filter").value;
    const q = $("bk-search").value.trim().toLowerCase();
    const list = bookings.filter(b =>
        (filter === "all" || b.status === filter) &&
        (!q || b.name.toLowerCase().includes(q) || b.contact.toLowerCase().includes(q))
    );

    const newCount = bookings.filter(b => b.status === "new").length;
    const badge = $("new-badge");
    badge.textContent = newCount;
    badge.classList.toggle("hidden", newCount === 0);
    $("bk-count").textContent = list.length + " dari " + bookings.length + " pesanan";

    const wrap = $("bk-list");
    wrap.replaceChildren();
    if (!list.length) {
        wrap.appendChild(el("p", "text-sm text-nude-600 bg-white border border-nude-200 rounded-2xl p-6 text-center",
            bookings.length ? "Tidak ada pesanan yang cocok." : "Belum ada pesanan masuk."));
        return;
    }

    list.forEach(b => {
        const card = el("div", "bg-white rounded-2xl border border-nude-200 p-5 shadow-sm");

        const top = el("div", "flex flex-wrap items-start justify-between gap-3");
        const who = el("div", "min-w-0");
        who.appendChild(el("p", "font-semibold text-nude-900", b.name));
        who.appendChild(el("p", "text-xs text-nude-600 mt-0.5", b.service + "  -  " + fmtDate(b.created_at)));
        top.appendChild(who);

        const st = STATUS[b.status] || STATUS.new;
        top.appendChild(el("span", "text-[11px] font-semibold px-3 py-1 rounded-full " + st.cls, st.label));
        card.appendChild(top);

        const contactRow = el("p", "text-sm text-nude-800 mt-3");
        contactRow.append(el("span", "text-nude-500 text-xs uppercase tracking-wider mr-2", "Kontak"), document.createTextNode(b.contact));
        card.appendChild(contactRow);

        if (b.message) {
            const msg = el("p", "text-sm text-nude-700 font-light mt-3 bg-nude-50 border border-nude-200 rounded-xl p-3 whitespace-pre-wrap break-words", b.message);
            card.appendChild(msg);
        }

        const actions = el("div", "flex flex-wrap items-center gap-2 mt-4");

        const wa = waNumber(b.contact);
        if (wa) {
            const text = `Halo ${b.name}, terima kasih sudah menghubungi kami untuk ${b.service}. `;
            const a = el("a", "px-4 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium", "Chat WhatsApp");
            a.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(text);
            a.target = "_blank"; a.rel = "noopener";
            actions.appendChild(a);
        } else if (b.contact.includes("@")) {
            const a = el("a", "px-4 py-2 rounded-full bg-nude-700 hover:bg-nude-800 text-white text-xs font-medium", "Kirim Email");
            a.href = "mailto:" + encodeURIComponent(b.contact).replace(/%40/g, "@") +
                "?subject=" + encodeURIComponent("Booking " + b.service);
            actions.appendChild(a);
        }

        const sel = el("select", "px-3 py-2 rounded-full bg-white border border-nude-300 text-xs focus:outline-none focus:border-nude-700");
        Object.entries(STATUS).forEach(([val, s]) => {
            const o = el("option", null, s.label);
            o.value = val;
            if (val === b.status) o.selected = true;
            sel.appendChild(o);
        });
        sel.onchange = async () => {
            sel.disabled = true;
            const { error } = await db.from("bookings").update({ status: sel.value }).eq("id", b.id);
            if (error) {
                toast("Gagal ubah status: " + error.message, false);
                sel.value = b.status;
                sel.disabled = false;
                return;
            }
            b.status = sel.value;
            toast("Status diperbarui");
            renderBookings();
        };
        actions.appendChild(sel);

        card.appendChild(actions);
        wrap.appendChild(card);
    });
}

$("bk-filter").addEventListener("change", renderBookings);
$("bk-search").addEventListener("input", renderBookings);
$("bk-refresh").addEventListener("click", loadBookings);
