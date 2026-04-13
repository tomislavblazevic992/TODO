# TaskFlow 🗂️

Tim task management app s drag & drop, ulogama, dozvolama i PWA podrškom.

**Stack:** Next.js 14 · Supabase · Tailwind CSS · @dnd-kit · Vercel

---

## ✨ Značajke

- 🔐 **Login / Register** — Supabase Auth
- 👥 **Admin sistem** — Admin dodjeljuje dozvole svakom korisniku
- 🚫 **Novi korisnici blokirani** — dok admin ne odobri, ne mogu ništa raditi
- 🗃️ **Kanban board** — Todo / U tijeku / Završeno
- 🖱️ **Drag & Drop** — pomicaj kartice između kolona i unutar kolone
- 🔒 **Privatni zadaci** — admin može dodijeliti zadatak samo jednom članu
- 👤 **Ime kreatora + timestamp** — na svakoj kartici
- 📱 **PWA** — instaliraj kao aplikaciju na mobitelu
- 🔴 **Real-time** — zadaci se osvježavaju u stvarnom vremenu

---

## 🚀 Postavljanje

### 1. Kloniraj i instaliraj

```bash
git clone https://github.com/tvoj-username/todo-app.git
cd todo-app
npm install
```

### 2. Supabase

1. Kreiraj projekt na [supabase.com](https://supabase.com)
2. Idi na **SQL Editor** i pokreni cijeli sadržaj `supabase/schema.sql`
3. Kopiraj iz **Project Settings → API**:
   - `Project URL`
   - `anon public` key

### 3. Environment varijable

```bash
cp .env.local.example .env.local
```

Popuni `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj-anon-key
```

### 4. Postavi prvog admina

Nakon što se registriraš, u Supabase SQL Editor pokreni:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'tvoj@email.com';
```

### 5. Lokalni razvoj

```bash
npm run dev
# → http://localhost:3000
```

---

## 📦 Deploy na Vercel

```bash
# Push na GitHub
git add .
git commit -m "Initial commit"
git push origin main
```

Zatim:
1. [vercel.com](https://vercel.com) → **New Project** → Import GitHub repo
2. **Environment Variables** → dodaj `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy 🚀

---

## 📱 PWA instalacija

### Android (Chrome)
1. Otvori app u Chrome
2. Tap na ⋮ meni → **"Dodaj na početni ekran"**

### iOS (Safari)
1. Otvori app u Safari
2. Tap na **Share** gumb → **"Dodaj na početni ekran"**

### Desktop (Chrome/Edge)
- Klikni na ikonu instalacije u address bar

---

## 🗄️ Struktura baze

| Tablica | Opis |
|---------|------|
| `profiles` | Korisnici, uloge (`admin`/`member`), dozvole |
| `tasks` | Zadaci s kreatorom, dodijeljenim korisnikom, statusom, prioritetom |

### Dozvole (`permissions` JSONB)
```json
{
  "canCreate": false,    // kreiranje novih zadataka
  "canComplete": false,  // promjena statusa (drag & drop)
  "canDelete": false     // brisanje vlastitih zadataka
}
```

### Row Level Security
- Admin vidi SVE zadatke
- Član vidi javne zadatke + zadatke dodjeljene njemu
- Privatni zadatak = `assigned_to IS NOT NULL`

---

## 📁 Struktura projekta

```
src/
├── app/
│   ├── layout.tsx          # Root layout (fonts, PWA meta, Toaster)
│   ├── page.tsx            # Redirect → /dashboard ili /login
│   ├── login/page.tsx      # Login forma
│   ├── register/page.tsx   # Register forma
│   ├── dashboard/page.tsx  # Kanban board
│   └── admin/page.tsx      # Admin panel (upravljanje korisnicima)
├── components/
│   ├── Navbar.tsx          # Top navigacija
│   ├── TaskBoard.tsx       # DnD kontekst + kolone
│   ├── TaskCard.tsx        # Pojedina kartica (sortable)
│   └── CreateTaskModal.tsx # Modal za novi zadatak
├── hooks/
│   └── useAuth.ts          # Auth state hook
├── lib/
│   └── supabase.ts         # Supabase browser client
├── middleware.ts            # Route protection
└── types/index.ts          # TypeScript tipovi
```

---

## 🎨 PWA ikone

Generiraj ikone na [realfavicongenerator.net](https://realfavicongenerator.net) i stavi u `public/icons/`:
- icon-72x72.png, icon-96x96.png, icon-128x128.png
- icon-144x144.png, icon-152x152.png
- icon-192x192.png, icon-384x384.png, icon-512x512.png
