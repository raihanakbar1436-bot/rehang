/* =========================================================
   hang.js  -  logika website MUA
   Bagian: menu mobile, hero slider, filter portfolio,
           testimoni (Supabase + fallback statis), form booking
   ========================================================= */

/* ---------- Supabase client ---------- */
const CFG = window.APP_CONFIG || {};
const supabaseReady =
    window.supabase &&
    CFG.SUPABASE_URL && !CFG.SUPABASE_URL.includes("YOUR-PROJECT-REF") &&
    CFG.SUPABASE_ANON_KEY && !CFG.SUPABASE_ANON_KEY.includes("YOUR-ANON");

const db = supabaseReady
    ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY)
    : null;

if (!db) console.warn("[MUA] Supabase belum dikonfigurasi di config.js - form & testimoni dinamis nonaktif.");

<<<<<<< HEAD
/* ---------- Foto dinamis dari Supabase (diatur lewat admin.html) ---------- */
async function loadSiteImages() {
    if (!db) return; // tetap pakai foto bawaan di HTML
    try {
        const { data, error } = await db.from("site_images").select("key, url");
        if (error) throw error;
        (data || []).forEach(({ key, url }) => {
            const img = document.querySelector(`img[data-img-key="${CSS.escape(key)}"]`);
            if (img && url) img.src = url;
        });
    } catch (err) {
        console.warn("[MUA] Gagal memuat foto dinamis, pakai foto bawaan.", err.message || err);
    }
}
loadSiteImages();

=======
>>>>>>> 0648a9231b93078899ff3eb80ab0d25f9da84b37
/* ---------- Mobile menu ---------- */
const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");

mobileMenuButton.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
mobileMenu.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => mobileMenu.classList.add("hidden"))
);

/* ---------- Hero slider ---------- */
let slideIndex = 0;
const slides = document.querySelectorAll(".hero-slide");
const indicators = document.querySelectorAll("#slide-indicators span");
let slideTimer = null;

function showSlide(n) {
    slides.forEach((slide, i) => {
        slide.style.opacity = i === n ? "1" : "0";
        if (indicators[i]) indicators[i].style.opacity = i === n ? "1" : "0.6";
    });
}
function nextSlide() { slideIndex = (slideIndex + 1) % slides.length; showSlide(slideIndex); resetSlideTimer(); }
function prevSlide() { slideIndex = (slideIndex - 1 + slides.length) % slides.length; showSlide(slideIndex); resetSlideTimer(); }
function currentSlide(n) { slideIndex = n; showSlide(slideIndex); resetSlideTimer(); }
function resetSlideTimer() {
    clearInterval(slideTimer);
    slideTimer = setInterval(() => {
        slideIndex = (slideIndex + 1) % slides.length;
        showSlide(slideIndex);
    }, 5000);
}
resetSlideTimer();

/* ---------- Portfolio filter ---------- */
function filterPortfolio(category) {
    const items = document.querySelectorAll(".portfolio-item");
    const buttons = document.querySelectorAll(".portfolio-filter");
    const active = event && event.currentTarget;

    buttons.forEach(btn => {
        btn.classList.remove("bg-nude-700", "text-white");
        btn.classList.add("bg-nude-200", "text-nude-800");
    });
    if (active) {
        active.classList.remove("bg-nude-200", "text-nude-800");
        active.classList.add("bg-nude-700", "text-white");
    }
    items.forEach(item => {
        const show = category === "all" || item.getAttribute("data-category") === category;
        item.style.display = show ? "block" : "none";
    });
}

/* ---------- Testimoni carousel ---------- */
let testimonialIndex = 0;
const testimonialTrack = document.getElementById("testimonial-track");

function testimonialMetrics() {
    const cards = testimonialTrack.children;
    if (!cards.length) return { step: 0, max: 0 };
    const gap = 24; // space-x-6
    const step = cards[0].offsetWidth + gap;
    const visible = Math.max(1, Math.round(testimonialTrack.parentElement.offsetWidth / step));
    return { step, max: Math.max(0, cards.length - visible) };
}
function moveTestimonial() {
    const { step } = testimonialMetrics();
    testimonialTrack.style.transform = `translateX(-${testimonialIndex * step}px)`;
}
function nextTestimonial() {
    const { max } = testimonialMetrics();
    testimonialIndex = testimonialIndex >= max ? 0 : testimonialIndex + 1;
    moveTestimonial();
}
function prevTestimonial() {
    const { max } = testimonialMetrics();
    testimonialIndex = testimonialIndex <= 0 ? max : testimonialIndex - 1;
    moveTestimonial();
}
window.addEventListener("resize", () => {
    const { max } = testimonialMetrics();
    testimonialIndex = Math.min(testimonialIndex, max);
    moveTestimonial();
});

/* Escape teks dari database sebelum masuk innerHTML (cegah XSS) */
function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
}

function testimonialCard(t) {
    const rating = Math.min(5, Math.max(1, Number(t.rating) || 5));
    const stars = '<i class="fa-solid fa-star"></i>'.repeat(rating);
    const avatar = t.avatar_url
        ? `<img src="${esc(t.avatar_url)}" alt="${esc(t.name)}" loading="lazy" class="w-12 h-12 rounded-full object-cover">`
        : `<div class="w-12 h-12 rounded-full bg-nude-300 text-nude-800 flex items-center justify-center font-bold">${esc(t.name.charAt(0).toUpperCase())}</div>`;

    return `
    <div class="min-w-full md:min-w-[calc(50%-12px)] bg-nude-100/60 p-8 rounded-3xl border border-nude-200 flex flex-col justify-between">
        <div>
            <div class="flex items-center space-x-4 mb-4">
                ${avatar}
                <div>
                    <h4 class="font-bold text-nude-900 text-sm">${esc(t.name)}</h4>
                    <span class="text-xs text-nude-600 font-light">${esc(t.service)}</span>
                </div>
            </div>
            <p class="text-nude-700 text-sm font-light italic leading-relaxed">"${esc(t.message)}"</p>
        </div>
        <div class="flex text-amber-500 text-xs mt-6 space-x-1">${stars}</div>
    </div>`;
}

async function loadTestimonials() {
    if (!db) return; // tetap pakai kartu statis di HTML
    try {
        const { data, error } = await db
            .from("testimonials")
            .select("name, service, message, rating, avatar_url")
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(12);

        if (error) throw error;
        if (!data || data.length === 0) return; // kosong -> pakai fallback statis

        testimonialTrack.innerHTML = data.map(testimonialCard).join("");
        testimonialTrack.removeAttribute("data-static");
        testimonialIndex = 0;
        moveTestimonial();
    } catch (err) {
        console.warn("[MUA] Gagal memuat testimoni, pakai data statis.", err.message || err);
    }
}
loadTestimonials();

/* ---------- Modal notifikasi ---------- */
const modal = document.getElementById("notification-modal");

function showModal({ title, message, ok = true }) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-message").textContent = message;
    const icon = document.getElementById("modal-icon");
    icon.className = ok ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation";
    modal.classList.remove("hidden");
}
function closeModal() { modal.classList.add("hidden"); }
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

/* ---------- Form booking -> Supabase ---------- */
const form = document.getElementById("booking-form");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-label");
const formError = document.getElementById("form-error");

const COOLDOWN_MS = 30_000; // batasi kirim ulang dari browser yang sama
let lastSubmit = 0;

function setError(msg) {
    if (!msg) { formError.classList.add("hidden"); formError.textContent = ""; return; }
    formError.textContent = msg;
    formError.classList.remove("hidden");
}
function setLoading(loading) {
    submitBtn.disabled = loading;
    submitLabel.textContent = loading ? "Mengirim..." : "Kirim Pesan";
}
function whatsappLink(payload) {
    const text = `Halo, saya ${payload.name}. Saya ingin booking ${payload.service}.\n${payload.message || ""}\nKontak: ${payload.contact}`;
    return `https://wa.me/${CFG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    setError("");

    // honeypot: bot mengisi, manusia tidak. Pura-pura sukses.
<<<<<<< HEAD
    if (document.getElementById("f-hp").value) {
        console.warn("[MUA] Honeypot terisi - pesan tidak dikirim.");
=======
    if (document.getElementById("f-website").value) {
>>>>>>> 0648a9231b93078899ff3eb80ab0d25f9da84b37
        form.reset();
        showModal({ title: "Pesan Terkirim!", message: "Terima kasih telah menghubungi kami." });
        return;
    }

    const payload = {
        name: document.getElementById("f-name").value.trim(),
        contact: document.getElementById("f-contact").value.trim(),
        service: document.getElementById("f-service").value,
        message: document.getElementById("f-message").value.trim() || null
    };

    if (payload.name.length < 2) return setError("Nama minimal 2 karakter.");
    if (payload.contact.length < 5) return setError("Isi email atau nomor WhatsApp yang valid.");

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contact);
    const isPhone = /^\+?[0-9\s\-]{8,16}$/.test(payload.contact);
    if (!isEmail && !isPhone) return setError("Format kontak tidak valid. Gunakan email atau nomor telepon.");

    if (Date.now() - lastSubmit < COOLDOWN_MS) {
        return setError("Mohon tunggu beberapa detik sebelum mengirim lagi.");
    }

    if (!db) {
        // Supabase belum diisi -> arahkan ke WhatsApp supaya booking tidak hilang
        showModal({
            title: "Lanjut via WhatsApp",
            message: "Form belum terhubung ke database. Kamu akan diarahkan ke WhatsApp.",
            ok: false
        });
        window.open(whatsappLink(payload), "_blank", "noopener");
        return;
    }

    setLoading(true);
    try {
        const { error } = await db.from("bookings").insert(payload); // tanpa .select(): anon tidak boleh SELECT
        if (error) throw error;

        lastSubmit = Date.now();
        form.reset();
        showModal({
            title: "Pesan Terkirim!",
            message: "Terima kasih telah menghubungi kami. Kami akan segera merespons pesanmu."
        });
    } catch (err) {
        console.error("[MUA] Gagal kirim booking:", err);
        showModal({
            title: "Gagal Mengirim",
            message: "Terjadi kendala saat mengirim. Silakan coba lagi, atau hubungi kami langsung via WhatsApp.",
            ok: false
        });
        setError("Pesan belum terkirim. Coba lagi atau klik tombol WhatsApp di samping.");
    } finally {
        setLoading(false);
    }
}
