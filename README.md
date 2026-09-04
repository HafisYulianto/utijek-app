# 🛵 UTIJEK - Progressive Web App (PWA) Ride-Hailing Platform

Aplikasi ride-hailing modern berbasis **PWA (Progressive Web App)** yang dirancang untuk kebutuhan mobilitas kampus dan umum. Dilengkapi dengan 3 role terintegrasi: **Customer**, **Driver**, dan **Admin**, didukung oleh peta interaktif real-time, kalkulasi tarif dinamis, sistem chat live, dan dashboard analitik.

---

## 🚀 Tech Stack

- **Framework:** Next.js (App Router, Turbopack, PWA config via `next-pwa`)
- **Backend & Auth:** Supabase (PostgreSQL, Supabase Auth, SSR, Realtime Subscriptions)
- **Styling:** Tailwind CSS (Modern Glassmorphism & Micro-animations)
- **Maps & Geolocation:** Mapbox GL & React Map GL
- **Icons & UI:** Heroicons, React Hot Toast, Recharts
- **State Management:** Zustand

---

## 🌟 Fitur Utama Berdasarkan Role

### 1. 🛡️ Admin (Superuser)
- **Dashboard Analitik:** Visualisasi statistik pesanan harian, mingguan, bulanan, dan total omset serta pendapatan platform.
- **Manajemen Harga Dinamis:** Pengaturan tarif dasar, tarif per km, dan tarif per meter yang langsung disinkronkan ke kalkulasi Customer.
- **Manajemen Akun Driver (CRUD Eksklusif):** Registrasi akun driver tertutup, aktivasi/suspend, dan penghapusan driver.
- **Audit Transaksi:** Riwayat seluruh pesanan yang dapat difilter berdasarkan spesifik driver dan tanggal.

### 2. 🛵 Driver Portal
- **Dashboard Driver:** Ringkasan pendapatan harian, pesanan selesai, dan status online/offline.
- **Toggle Online/Offline:** Kontrol ketersediaan driver yang otomatis memperbarui koordinat GPS secara berkala ke database.
- **Order Popup Modal:** Notifikasi real-time ketika ada pesanan baru dengan hitung mundur dan rute pickup.
- **Navigasi Interaktif & Trip Tracker:** Peta panduan belokan demi belokan (turn-by-turn), tombol *Tiba di Lokasi*, *Mulai Perjalanan*, dan *Selesaikan Pesanan*.

### 3. 📱 Customer Experience (PWA)
- **Home & Layanan Lengkap:** UTI-Ride (Motor), UTI-Car (Mobil), UTI-Food (Makanan), UTI-Send (Kurir Barang).
- **Interactive Booking:** Penentuan titik jemput & antar dengan autocomplete atau pin pada peta Mapbox, kalkulasi jarak akurat, estimasi harga dinamis, serta pilihan metode pembayaran (Tunai, QRIS, Transfer).
- **Live Chat Drawer:** Komunikasi langsung antara Customer dan Driver secara real-time via Supabase Realtime channel.
- **PWA Ready:** Dapat diinstal di Android & iOS langsung dari browser dengan caching offline dan mobile-first UI.

---

## 🛠️ Panduan Instalasi & Menjalankan

### 1. Clone Repository
```bash
git clone https://github.com/HafisYulianto/utijek-app.git
cd utijek-app
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.local.example` menjadi `.env.local`:
```bash
cp .env.local.example .env.local
```

Isi variabel berikut dengan kredensial proyek Supabase & Mapbox Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Database Supabase
Jalankan skrip migrasi SQL di Supabase SQL Editor:
- Lokasi file: `supabase/migrations/001_initial.sql`

Skrip ini akan membuat tabel:
- `profiles` (User role: customer, driver, admin)
- `driver_profiles` (Status online, kendaraan, lokasi realtime)
- `pricing_config` (Tarif dinamis per meter & km)
- `orders` (Siklus hidup pesanan)
- `order_tracking` (Riwayat GPS tracking)
- `chat_messages` (Chat realtime antara driver & customer)
- `transactions` (Pencatatan pembayaran)
- Serta fungsi PostgreSQL & triggers untuk update timestamp dan kalkulasi otomatis.

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 📂 Struktur Proyek

```
utijek-app/
├── public/
│   └── manifest.json           # PWA Web App Manifest
├── src/
│   ├── app/
│   │   ├── (auth)/login/       # Login & Autentikasi
│   │   ├── (customer)/         # Halaman Customer (Home, Booking)
│   │   ├── admin/              # Portal Admin (Analytics, Drivers, Pricing, Transaksi)
│   │   ├── api/admin/          # Secure Server API (Create/Delete Driver via Service Role)
│   │   ├── driver/             # Dashboard Driver & Navigasi Turn-by-Turn
│   │   ├── globals.css         # Styling global & utility classes
│   │   ├── layout.tsx          # Root layout & providers
│   │   └── proxy.ts            # Next.js 16 Edge Proxy & Role Guards
│   ├── components/
│   │   ├── admin/              # Admin Sidebar & Analytics Charts
│   │   ├── customer/           # BottomNav, ServiceCard, LiveChatDrawer
│   │   ├── driver/             # DriverBottomNav, OnlineToggle, OrderPopup
│   │   ├── map/                # Mapbox Live Tracking & Markers
│   │   └── ui/                 # Reusable UI (Button, Card, Badge, Modal, Spinner)
│   ├── hooks/                  # Custom hooks (Geolocation, Realtime Orders, Driver Location)
│   ├── lib/
│   │   ├── supabase/           # Client, Server, SSR Middleware, Types
│   │   └── utils/              # Pricing calculation & Formatters
│   └── types/                  # Database TypeScript schemas
├── supabase/
│   └── migrations/             # Migration SQL tables, RLS & triggers
└── next.config.js              # PWA and Remote Patterns configuration
```

---

## 📄 Lisensi
Hak Cipta © 2026 UTIJEK Team. Dibuat untuk perkuliahan dan pengembangan teknologi mobilitas.
