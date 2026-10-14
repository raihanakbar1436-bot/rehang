// ==========================================================
//  Config Supabase
//  Isi dengan data dari: Supabase Dashboard -> Project Settings -> API
//  - SUPABASE_URL      : "Project URL"
//  - SUPABASE_ANON_KEY : key "anon" / "public"  (AMAN ditaruh di frontend
//                        karena akses dibatasi Row Level Security).
//  JANGAN PERNAH taruh "service_role" key di file ini.
// ==========================================================
window.APP_CONFIG = {
    SUPABASE_URL: "https://xmwkscbzkmihbgtwgsgb.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtd2tzY2J6a21paGJndHdnc2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTQ5NjIsImV4cCI6MjEwNzI5MDk2Mn0.uI2KEY6O1n9z82CerfAgM1i640NWuSq9Pu-ns6__MB0",
    WHATSAPP_NUMBER: "6285393687814" // dipakai untuk tombol fallback jika Supabase gagal
};
