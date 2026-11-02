# Inventory Management Monorepo

Monorepo berisi dua aplikasi terpisah:

| Folder | Aplikasi | Deskripsi |
| --- | --- | --- |
| `backend/` | Inventory Management API | REST API Express + Prisma + MySQL untuk register/login JWT dan CRUD barang per pengguna |
| `frontend/` | Users Dashboard | React SPA untuk melihat, mencari, memfilter, dan mengurutkan data pengguna contoh |

> frontend berasal dari `jsonplaceholder.typicode.com`, sedangkan backend berjalan
> sendiri sebagai REST API. Keduanya disatukan di repo ini hanya sebagai workspace.

## Prasyarat

- Node.js 22+
- pnpm
- Docker Desktop dengan Docker Compose (untuk database backend)

## Quick Start

Dari root repository:

```bash
pnpm install
```

Siapkan environment backend:

```bash
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
```

Isi `JWT_SECRET` di kedua file dengan nilai acak minimal 32 karakter:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Jalankan MySQL:

```bash
pnpm db:up
```

Terapkan migration ke database development dan test:

```powershell
# PowerShell
pnpm --filter backend db:deploy

$env:DATABASE_URL="mysql://inventory:inventory@127.0.0.1:3307/inventory_test"
pnpm --filter backend db:deploy
Remove-Item Env:DATABASE_URL
```

```bash
# bash / macOS / Linux
pnpm --filter backend db:deploy

DATABASE_URL="mysql://inventory:inventory@127.0.0.1:3307/inventory_test" \
  pnpm --filter backend db:deploy
```

Jalankan backend dan frontend di terminal terpisah:

```bash
pnpm dev:backend
```

```bash
pnpm dev:frontend
```

## URL Lokal

| Layanan | URL |
| --- | --- |
| Backend API | <http://localhost:3000/api/v1> |
| Swagger UI | <http://localhost:3000/api/docs> |
| OpenAPI JSON | <http://localhost:3000/api/docs.json> |
| Frontend | <http://localhost:5173> |

## Perintah Root

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev:backend` | Backend watch mode |
| `pnpm dev:frontend` | Frontend dev server |
| `pnpm build` | Build semua package |
| `pnpm db:up` | Start MySQL dan tunggu sampai healthy |
| `pnpm db:down` | Stop container, data tetap tersimpan |
| `pnpm db:reset` | Hapus container **dan volume/data**, lalu start ulang |
| `pnpm db:logs` | Lihat log MySQL |


## Testing

Backend memakai integration test terhadap MySQL asli:

```bash
pnpm --filter backend test
```

Frontend belum memiliki test otomatis. Pemeriksaan yang tersedia:

```bash
pnpm --filter frontend build
pnpm --filter frontend lint
```

## Struktur Repository

```text
.
├── backend/
│   ├── prisma/              # Schema dan migration
│   ├── src/                 # Controllers, services, routes, docs, lib
│   ├── tests/               # Integration test
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/ui/   # Komponen UI generik
│   │   └── features/users/  # Dashboard pengguna
│   └── README.md
├── docker/mysql/init/       # Init database test
├── compose.yaml             # MySQL 8 untuk development
├── package.json             # Script root workspace
└── pnpm-workspace.yaml
```

## Dokumentasi Lanjutan

- Backend: [`backend/README.md`](backend/README.md) — API, environment, database,
  arsitektur, keamanan JWT, dan concurrency.
- Frontend: [`frontend/README.md`](frontend/README.md) — fitur dashboard, alur
  data, struktur folder, dan keputusan teknis.
- Jawaban pertanyaan pemahaman frontend:
  [`frontend/README.md#menjawab-pertanyaan-pemahaman`](frontend/README.md#menjawab-pertanyaan-pemahaman).
