# Users Dashboard (Frontend)

## Persentase Penggunaan AI

| Aktivitas | Porsi AI | Porsi Manusia |
| --- | ---: | ---: |
| Menulis kode | 45% | 55% |
| Desain UI & komponen | 20% | 80% |
| Integrasi data & state management | 15% | 85% |
| Testing & debugging | 10% | 90% |
| Dokumentasi | 20% | 80% |

> Persentase menunjukkan porsi AI dan manusia pada masing-masing aktivitas.

Dashboard pengguna berbasis React: menampilkan, mencari, memfilter, mengurutkan,
dan melihat detail pengguna. Data diambil dari
`https://jsonplaceholder.typicode.com/users` (10 pengguna contoh), bukan dari API
inventory di folder `backend/`.

## Stack

| Bagian | Teknologi |
| --- | --- |
| UI | React 19 |
| Bahasa | TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| HTTP client | Ky 2 |
| Server state | SWR 2 |
| Linter | oxlint |

Tanpa UI library dan tanpa komponen pihak ketiga. Ikon, modal, menu, skeleton,
dan state tampilan dibuat sendiri di `src/components/ui/`.

## Prasyarat

- Node.js 22+
- pnpm

Tidak perlu Docker atau backend untuk menjalankan frontend.

## Menjalankan

Dari root monorepo:

```bash
pnpm install
pnpm dev:frontend
```

Atau dari folder `frontend/`:

```bash
pnpm install
pnpm dev
```

Dev server default: <http://localhost:5173>

## Scripts

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | Jalankan Vite dev server |
| `pnpm build` | Type-check (`tsc -b`) lalu build produksi |
| `pnpm lint` | Jalankan oxlint |
| `pnpm preview` | Preview hasil build |

## Fitur

- **Pencarian** nama atau email, langsung di sisi client tanpa request tambahan.
- **Filter kota** multi-select; daftar kota diambil dari data yang dimuat.
- **Sorting** nama dan perusahaan, naik atau turun.
- **Pilih kolom** yang ditampilkan: telepon, perusahaan, website, kota.
- **Dua mode tampilan**: tabel dan kartu.
- **Pagination** 5 atau 10 baris per halaman, dengan ringkasan rentang data.
- **Pilih baris** dan pilih semua baris di halaman aktif.
- **Modal detail** berisi email, telepon, website, alamat lengkap, link Google
  Maps, dan informasi perusahaan.
- **Loading skeleton** yang menyesuaikan mode tampilan.
- **Error state** dengan tombol coba lagi, serta **empty state** saat pencarian
  tidak menemukan hasil.
- **Responsive**: tabel tampil di layar `md` ke atas, kartu tampil di layar kecil.
- **Status sinkronisasi** (`Menyinkronkan…`) saat SWR melakukan revalidasi.

## Alur Data

```text
UserDashboard
  → useUserTable (state tabel)
    → useUsers (SWR, key "users")
      → getUsers (service)
        → api (Ky instance)
          → jsonplaceholder.typicode.com/users
```

- **Ky** hanya sebagai transport: `baseUrl`, timeout 10 detik, header `Accept`.
- **SWR** mengelola cache, deduplikasi request (`60s`), retry otomatis (`2x`), dan
  revalidasi. `revalidateOnFocus` dimatikan agar tidak refetch saat tab kembali
  aktif.
- **Error dinormalisasi** di `userService.ts`: error HTTP menjadi
  `Gagal memuat pengguna (<status>)`, error jaringan menjadi pesan koneksi.
- **Filter, sorting, dan pagination seluruhnya client-side** karena dataset hanya
  10 baris. Tidak ada request per ketikan.

## Struktur Folder

```text
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   └── ui/                  # Icon, Menu, Modal, Skeleton, States, Toggle, theme
│   ├── features/
│   │   └── users/
│   │       ├── UserDashboard.tsx
│   │       ├── user-display.ts  # getCity, getCompany, initials, avatarColor
│   │       ├── _components/
│   │       │   ├── Pagination.tsx
│   │       │   ├── parts.tsx
│   │       │   ├── UserCardGrid.tsx
│   │       │   ├── UserDataTable.tsx
│   │       │   ├── UserDetailModal.tsx
│   │       │   └── UserToolbar.tsx
│   │       └── _logic/
│   │           ├── columns.ts   # daftar kolom, opsi sorting, tipe view
│   │           ├── table.ts     # filter, sort, pagination, helper
│   │           ├── types.ts     # UserRow + state awal tabel
│   │           └── useUserTable.ts
│   ├── hooks/
│   │   └── useUsers.ts          # SWR + retry
│   ├── lib/
│   │   ├── api-client.ts        # instance Ky
│   │   └── cx.ts                # penggabung className
│   ├── services/
│   │   └── userService.ts       # getUsers + normalisasi error
│   └── types/
│       └── user.ts              # tipe User, Address, Geo, Company
├── index.html
├── vite.config.ts
└── package.json
```

## Keputusan Teknis

- **Tanpa UI library** agar styling dan aksesibilitas sepenuhnya terkontrol.
- **Tailwind CSS 4** memakai konfigurasi CSS-first, tanpa `tailwind.config`.
- **Modal buatan sendiri** dengan `role="dialog"`, `aria-modal`, tombol Escape,
  klik backdrop, scroll lock, focus trap, dan pengembalian fokus.
- **SWR** dipilih karena kebutuhannya satu endpoint read-only; TanStack Query
  akan berlebihan untuk kasus ini.
- **Ky** dipilih karena tipis, typed (`.json<User[]>()`), dan sudah menangani
  timeout serta `HTTPError`.

## Menjawab Pertanyaan Pemahaman

### 1. State Management & Lifecycle

Fetching di project ini tidak memakai `useEffect`, tetapi SWR. Semua request lewat
hook `useUsers`:

```ts
useSWR("users", getUsers, {
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
  errorRetryCount: 2,
});
```

Key-nya string tetap `"users"` dan `getUsers` diimpor dari service, bukan fungsi
baru yang dibuat tiap render. Karena key dan fetcher stabil, SWR tidak menganggap
ada sumber data baru dan tidak melakukan request berulang.

Soal memory leak: komponen tidak menyimpan hasil fetch ke state lokal. Cache dan
langganan dipegang SWR. Saat komponen unmount, langganan berhenti, dan response
yang terlambat datang tidak dipakai untuk meng-update komponen yang sudah hilang.
Tidak ada `setState` setelah unmount.

Pencarian juga tidak menyentuh API. Query disimpan di `useState`, ditunda dengan
`useDeferredValue`, lalu dipakai untuk filter di `useMemo`. Mengetik tidak memicu
request, jadi tidak ada loop dari pencarian.

Di project ini tidak perlu `useEffect` karena SWR sudah mengurus lifecycle.

### 2. Struktur Folder

Folder disusun per fitur, bukan per jenis file. Semua kode dashboard pengguna ada
di `src/features/users/`, jadi saat mau mengubah fitur ini tidak perlu mencari ke
banyak folder global.

- `_components/`: komponen khusus user, seperti tabel, kartu, toolbar, modal
  detail, dan pagination.
- `_logic/`: state dan fungsi tanpa UI, yaitu `useUserTable`, filter/sort/pagination
  di `table.ts`, daftar kolom, dan tipe.
- `components/ui/`: komponen umum yang tidak tahu domain user, seperti `Modal`,
  `Menu`, `Icon`, `Skeleton`, dan `States`.
- `hooks/`: server state. Sekarang isinya `useUsers`.
- `services/`: request dan normalisasi error. Komponen tidak memanggil Ky langsung.
- `lib/`: infrastruktur kecil seperti instance Ky dan helper `cx`.
- `types/`: tipe data yang dipakai bersama.

Arah dependensinya dibuat satu arah sepert ini komponen memakai logic, logic memakai service,
service memakai Ky. Tidak ada komponen yang loncat langsung ke HTTP client lnsung. Karena
project masih punya satu fitur, saya tidak menambah lapisan yang belum tentu perlu.

### 3. Optimasi Kinerja untuk 10.000 User

Yang sudah ada sekarang: `useDeferredValue` untuk menunda query, `useMemo` untuk
filter dan sorting, dan pagination 5/10 baris. Jadi baris yang dirender tetap
sedikit.

Kalau data naik jadi 10.000, beban utamanya ada di filter dan sorting yang
dijalankan setiap query berubah, bukan di jumlah baris yang tampil. Urutan
penanganannya:

1. Pertahankan `useDeferredValue` dan `useMemo` supaya mengetik tetap responsif.
2. Tambah debounce 200-300 ms kalau filter masih terasa berat.
3. Pindahkan filter dan sorting ke Web Worker kalau prosesnya sudah memblokir
   main thread.
4. Pakai virtualisasi seperti `@tanstack/react-virtual` kalau pagination diganti
   infinite scroll atau semua baris ditampilkan sekaligus. Dengan pagination
   sekarang, ini belum perlu.
5. Pindahkan search, sort, dan pagination ke server kalau API mendukung. Ini
   paling efektif karena browser tidak perlu memproses 10.000 data.

Saya tidak langsung menambah `React.memo` atau `useCallback` di semua komponen.
Optimasi dilakukan setelah tahu bagian mana sih yg bener bener lambat.

