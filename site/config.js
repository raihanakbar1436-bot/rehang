// ==========================================================
//  Config Supabase
//  Isi dengan data dari: Supabase Dashboard -> Project Settings -> API
//  - SUPABASE_URL      : "Project URL"
//  - SUPABASE_ANON_KEY : key "anon" / "public"  (AMAN ditaruh di frontend
//                        karena akses dibatasi Row Level Security).
//  JANGAN PERNAH taruh "service_role" key di file ini.
// ==========================================================
window.APP_CONFIG = {
    SUPABASE_URL: "https://YOUR-PROJECT-REF.supabase.co",
    SUPABASE_ANON_KEY: "YOUR-ANON-PUBLIC-KEY",
    WHATSAPP_NUMBER: "6283125830768" // dipakai untuk tombol fallback jika Supabase gagal
};
