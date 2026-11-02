# Inventory Management API

## Persentase Penggunaan AI Pada Project Ini

| Aktivitas | Porsi AI | Porsi Manusia |
| --- | ---: | ---: |
| Menulis kode | 60% | 40% |
| Desain sistem & arsitektur | 25% | 75% |
| Testing & debugging | 20% | 80% |
| Refactor & review kode | 15% | 85% |
| Dokumentasi | 30% | 70% |

> Persentase menunjukkan porsi AI dan manusia pada masing-masing aktivitas.

REST API inventory per user: register/login JWT, CRUD barang, pencarian,
pagination, dan pengurangan stok atomic. Setiap endpoint barang hanya bisa
diakses oleh pemiliknya.

## Stack

| Bagian | Teknologi |
| --- | --- |
| Runtime | Node.js 22, ESM |
| HTTP | Express 5 |
| Bahasa | TypeScript 5.9 (strict) |
| Database | MySQL 8 (InnoDB) |
| ORM & migration | Prisma 6 |
| Auth | JWT + bcrypt |
| Validasi | Zod |
| Dokumentasi | OpenAPI 3 + Swagger UI |
| Testing | Vitest + Supertest (MySQL asli) |
| Dokumentasi API CLI tools | SonicPoint |

## Prasyarat

- Node.js 22+
- pnpm
- Docker Desktop (termasuk Docker Compose)

## Quick Start

Dari root repository:

```bash
pnpm install

cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
```

Isi `JWT_SECRET` di kedua file dengan nilai random minimal 32 karakter:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Jalankan database:

```bash
pnpm db:up
```

Apply migration:

```bash
pnpm --filter backend db:deploy
```

Untuk database test:

```powershell
# PowerShell
$env:DATABASE_URL="mysql://inventory:inventory@127.0.0.1:3307/inventory_test"
pnpm --filter backend db:deploy
Remove-Item Env:DATABASE_URL
```

```bash
# bash / macOS / Linux
DATABASE_URL="mysql://inventory:inventory@127.0.0.1:3307/inventory_test" \
  pnpm --filter backend db:deploy
```

Jalankan test lalu aplikasi:

```bash
pnpm --filter backend test
pnpm dev:backend
```

Frontend, jika dibutuhkan:

```bash
pnpm dev:frontend
```


## Perintah Database

| Perintah | Fungsi |
| --- | --- |
| `pnpm db:up` | Start MySQL dan tunggu sampai healthy |
| `pnpm db:down` | Stop container, data tetap tersimpan |
| `pnpm db:reset` | Hapus container **dan volume/data**, lalu start ulang |
| `pnpm db:logs` | Lihat log MySQL |

Data disimpan di volume Docker `inventory-mysql-data`. Database `inventory`
dan `inventory_test` dibuat otomatis saat volume pertama kali diinisialisasi.


## Menjalankan Project

```bash
# Backend, watch mode
pnpm dev:backend

# Frontend
pnpm dev:frontend
```

Build dan jalankan versi produksi:

```bash
pnpm --filter backend build
pnpm --filter backend start
```

## Testing

```bash
pnpm --filter backend test
```

Test berjalan terhadap MySQL asli, bukan mock. File test dijalankan berurutan
karena memakai satu database test. Total saat ini: **52 test** pada 4 file:

- `auth.test.ts` — register, login, validasi, JWT.
- `items.test.ts` — CRUD, ownership, search, pagination, stok.
- `concurrency.test.ts` — race condition pengurangan stok.
- `docs.test.ts` — Swagger UI dan OpenAPI.

## API

Base URL: `http://localhost:3000/api/v1`

| Method | Path | Auth | Fungsi |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | tidak | Daftar akun |
| `POST` | `/auth/login` | tidak | Login, dapat `{ token, user }` |
| `POST` | `/items` | ya | Tambah barang |
| `GET` | `/items` | ya | List barang milik user |
| `GET` | `/items/:id` | ya | Detail barang |
| `PUT` | `/items/:id` | ya | Update sebagian field |
| `DELETE` | `/items/:id` | ya | Hapus barang |
| `POST` | `/items/:id/reduce-stock` | ya | Kurangi stok secara atomic |

Query `GET /items`:

- `search` — pencarian nama, maksimal 150 karakter.
- `page` — default `1`.
- `limit` — default `10`, maksimal `100`.


## Menjawab Pertanyaan Pemahaman

## Arsitektur

```text
Route → Middleware → Controller → Service → Prisma → MySQL
```

- Route hanya mendaftarkan path dan validasi.
- Middleware menangani auth, validasi Zod, dan error.
- Controller menerjemahkan HTTP ke pemanggilan service.
- Service berisi aturan bisnis dan query Prisma.
- Tidak ada repository layer, DI container, atau factory tambahan.

## Keamanan Token, JWT: LocalStorage vs HttpOnly

API ini mengembalikan access token JWT di response body nya dan tidak memakai cookie.

- **LocalStorage** mudah dipakai SPA, tapi sebenarnya token bisa dicuri jika ada XSS.
  Token juga tidak dikirim otomatis, jadinya CSRF bukan risiko utama.
- **HttpOnly cookie** tidak bisa dibaca JavaScript dan lebih aman terhadap
  pencurian token via XSS, tapi butuh proteksi CSRF dan konfigurasi
  `Secure`/`SameSite`.

Kalau untuk produksi, gunakan akses token berumur pendek, refresh token berotasi, dan
TLS. Implementasi saat ini belum memiliki refresh, logout, atau revocation.

## Concurrency

Pengurangan stok tidak memakai pola baca-lalu-tulis. tapi Service menjalankan satu
conditional update, sepert ini:

```ts
await prisma.item.updateMany({
  where: { id: itemId, userId, stock: { gte: quantity } },
  data: { stock: { decrement: quantity } },
});
```

MySQL mengunci baris saat update. Jika stok tidak cukup, update mengenai 0 baris
dan API akan ngereturn `409 INSUFFICIENT_STOCK`. Stok tidak pernah negatif, dan
database juga memiliki `CHECK (stock >= 0)` sebagai pengaman terakhir.

Test concurrency menjalankan 10 request paralel dan memastikan jumlah yang
berhasil sesuai stok yang tersedia.

## Swagger

Setelah backend berjalan:

- Swagger UI: <http://localhost:3000/api/docs>
- OpenAPI JSON: <http://localhost:3000/api/docs.json>

Klik **Authorize**, lalu tempel token dari `/auth/login` tanpa prefix `Bearer `.


## Struktur Project

```text
.
├── compose.yaml                 # MySQL 8 untuk development
├── docker/mysql/init/           # Init database test
├── backend/
│   ├── prisma/                  # Schema + migration
│   ├── src/
│   │   ├── controllers/
│   │   ├── docs/                # OpenAPI + Swagger router
│   │   ├── lib/                 # Prisma, JWT, error, response, Zod
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── types/
│   └── tests/                   # Integration test MySQL
└── frontend/
```

## Limitasi

- Belum ada refresh token, logout, atau revocation JWT.
- Belum ada rate limiting login.
- Belum ada konfigurasi CORS untuk SPA beda origin.
- `PUT` menerima partial update, bukan replace penuh.
- Akses barang milik user lain mengembalikan `404`, bukan `403`, untuk
  menghindari kebocoran keberadaan ID.
