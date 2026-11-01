# Users Dashboard (frontend)

React + TypeScript + Vite SPA. Data: `GET https://jsonplaceholder.typicode.com/users`.
Stack: Tailwind v4, Ky (HTTP), SWR (server state). Tanpa UI library, tanpa backend.

## Scripts

```bash
pnpm dev      # dev server
pnpm build    # tsc -b && vite build
pnpm preview
```

## 1. State Management & Lifecycle

**Ky + SWR split peran:** Ky hanya transport (typed `Promise<User[]>`).
SWR pemilik server state: cache, dedup, revalidasi, retry.

```
useUsers (SWR key "users") → userService.getUsers() → ky baseUrl jsonplaceholder
```

- **Fetching:** satu request saat mount. Key stabil `"users"`, `dedupingInterval: 60s` cegah request ganda.
- **Caching/revalidasi:** `revalidateOnFocus: false` matikan refetch ganggu. `isLoading` untuk initial, `isValidating` untuk background sync (badge "Syncing…").
- **Error/retry:** `userService` normalisasi `HTTPError`/network jadi `Error` ramah. `ErrorState` panggil `mutate()` (retry SWR, bukan fetch manual). `errorRetryCount: 2` untuk retry otomatis.
- **Tanpa useEffect untuk fetch:** SWR subscribe key → fetch → cache secara deklaratif. `useEffect` hanya untuk efek samping non-data (scroll lock + focus di Modal).

**Search murni client-side:** `query` state lokal → `trim().toLowerCase()` → filter `name`/`email` via `useMemo`. Tidak ada request per keystroke.

## 2. Folder Structure

```
src/
  types/user.ts            # User, Address, Geo, Company — satu sumber tipe
  lib/api-client.ts        # satu instance ky (baseUrl, timeout 10s, Accept json)
  services/userService.ts  # getUsers() + normalisasi error. Tanpa logic UI.
  hooks/useUsers.ts        # SWR: key, retry, revalidate. Return {users, error, isLoading, isValidating, retry}
  components/ui/           # presentasional generik: Icon, Modal, SearchInput, Skeleton, States
  features/users/          # domain users:
    UserDashboard.tsx      # orkestrasi: search state, filter, kondisional render
    UserTable.tsx          # desktop table
    UserCards.tsx          # mobile cards
    UserDetailModal.tsx    # detail + address/company
    user-helpers.tsx       # Avatar, WebsiteLink, avatarColor, initials
  App.tsx / main.tsx       # komposisi
```

Services/hooks tidak render UI. Komponen tidak panggil ky langsung.

## 3. Performance

Dataset kini 10 users — filter O(n) trivial.

- **Implemented:** `useMemo` untuk filter (hindari recompute tiap render),
  `useDeferredValue(query)` agar input tetap responsif saat filter jalan.
  Tanpa `React.memo`/`useCallback` — tidak ada prop drilling mahal, profiler tidak justified.
- **Scaling ke 10.000 users:** tambah `@tanstack/virtual` untuk windowing
  (render ~30 rows visible, bukan 10k DOM nodes). Kombinasi: deferred query +
  memoized filter + virtual list. Opsional: debounce search 150ms, pagination server-side
  jika API mendukung.
  ```ts
  // ponytail: virtualisasi saat rows > 1000. Upgrade path: @tanstack/virtual.
  ```

## 4. Technical Decisions

- **Ky:** wrapper fetch tipis, typed `.json<T>()`, timeout/error class bawaan.
  Trade-off: bukan axios — tanpa interceptor ecosystem, tapi cukup untuk satu endpoint.
  Satu instance terpusat; `baseUrl` baru di ky v2 (bukan `prefixUrl`).
- **SWR:** stale-while-revalidate cocok untuk read dashboard. Alternatif TanStack Query
  lebih powerful (mutation cache, devtools) tapi overkill untuk satu GET.
- **Tailwind v4:** CSS-first via `@tailwindcss/vite`, tanpa config file.
- **Ikon inline SVG** gaya reui/lucide di `Icon.tsx` — tanpa `lucide-react` sesuai aturan no-UI-lib.
- **Modal self-made:** `role="dialog"` + `aria-modal`, Escape, backdrop click,
  scroll lock, focus trap + restore. Tanpa dep `focus-trap` untuk satu dialog.
