# Sistem POS - Point of Sale Application

Aplikasi Point of Sale (POS) yang dibangun dengan React, Tailwind CSS, dan localStorage untuk database lokal.

## Fitur

### 1. Autentikasi & Manajemen User
- Login dengan role-based access control
- 4 level user: Super Admin, Admin, Manager, dan Kasir
- Manajemen user dengan CRUD operations

### 2. Dashboard
- Statistik penjualan hari ini
- Grafik penjualan 7 hari terakhir
- Produk terlaris
- Alert stok rendah
- Transaksi terbaru

### 3. Manajemen Inventory
- CRUD produk dengan kategori
- Track stok dan alert stok rendah
- Harga beli dan harga jual
- Barcode/SKU management

### 4. Modul Kasir (Advanced)
- Pencarian produk (nama, SKU, barcode)
- Shopping cart dengan adjust quantity
- Multiple payment methods (Tunai, Debit, Kredit, QRIS, Transfer)
- Diskon percentage/nominal
- Kode promo
- Kalkulasi PPN
- Struk pembayaran
- Kembalian calculator

### 5. Laporan Keuangan (Comprehensive)
- Ringkasan penjualan harian/bulanan/tahunan
- Laba rugi
- Nilai inventory
- Produk terlaris (top 10)
- Performa kasir
- Export to CSV

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Jalankan aplikasi:
```bash
npm run dev
```

3. Buka browser di `http://localhost:3000`

## Login Default

Jika Anda mengalami masalah login "Username atau password salah", silakan **clear localStorage** browser Anda:

1. Buka Developer Tools (F12)
2. Buka tab "Application" atau "Storage"
3. Klik "Local Storage" → `http://localhost:3000`
4. Klik kanan → "Clear" atau tekan tombol "Clear All"
5. Refresh halaman

Kemudian gunakan credentials berikut:

- **Username**: admin
- **Password**: admin123
- **Role**: Super Admin (full access)

### User Lainnya (otomatis dibuat)
- **Admin**: admin2 / admin123
- **Manager**: manager / manager123
- **Kasir**: kasir / kasir123

## Teknologi

- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Recharts (charts)
- Lucide React (icons)
- date-fns (date utilities)
- react-to-print (receipt printing)

## Struktur Folder

```
src/
├── components/     # Komponen UI reusable
│   ├── ui/        # Komponen dasar (Button, Input, Modal, dll)
│   └── layout/    # Layout komponen (Sidebar, Header)
├── context/       # Context API (AuthContext)
├── pages/         # Halaman aplikasi
├── utils/          # Utility functions
│   ├── localStorage.js
│   ├── formatCurrency.js
│   ├── generateId.js
│   ├── dateHelpers.js
│   └── ...
└── App.jsx         # Root component
```

## Fitur Tambahan

- Responsive design untuk mobile dan desktop
- UI modern dengan Tailwind CSS
- Dark mode support (coming soon)
- Export data ke CSV
- Print receipt
- Search dan filter data

## Storage

Data disimpan di localStorage browser dengan keys:
- `pos_users`: Data user
- `pos_products`: Data produk
- `pos_transactions`: Data transaksi
- `pos_customers`: Data pelanggan
- `pos_promo_codes`: Kode promo
- `pos_settings`: Pengaturan aplikasi

## Build untuk Production

```bash
npm run build
```

## Lisensi

MIT License

