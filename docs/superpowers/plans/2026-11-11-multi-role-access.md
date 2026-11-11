# Multi-Role Access Control (kepsek & tim_pendidik) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement access control with roles `kepsek` and `tim_pendidik`, role-based menu filtering & route protection, plus a User Management menu (`/pengguna`) for `kepsek` to create educator accounts and reset passwords without logging out.

**Architecture:** Add a `role` column to the `profiles` table in Supabase (`kepsek` | `tim_pendidik`). Create a SvelteKit API endpoint (`/api/pengguna`) using Supabase Service Role Key to manage Auth users. Update root layout (`+layout.svelte`) for profile caching, menu filtering, and client-side route guards.

**Tech Stack:** SvelteKit 2, Svelte 4, Supabase JS Client, Supabase Auth Administration (Service Role Key), Tailwind CSS, Lucide Svelte.

**Spec:** Direct user requirements provided in chat conversation on 2026-11-11.

## Global Constraints

- Role values must strictly be `'kepsek'` or `'tim_pendidik'`.
- Default role for new users is `'tim_pendidik'`.
- `kepsek` access: Dashboard (no "Mulai Penilaian" CTA), Kriteria & AHP (`/kriteria`), Kelas & Anak (`/kelas`), Indikator Pertanyaan (`/indikator`), Laporan Perhitungan (`/laporan`), Kelola Pengguna (`/pengguna`).
- `tim_pendidik` access: Dashboard (with "Mulai Penilaian" CTA), Kelas & Anak (`/kelas`), Penilaian (`/penilaian`), Laporan Perhitungan (`/laporan`).
- Reset password default: `123123`.
- Educator registration must happen without logging out the active `kepsek` session.

## Review Focus

1. **Unauthorized Route Access:** A user with role `tim_pendidik` manually typing `/kriteria`, `/indikator`, or `/pengguna` in browser address bar must be redirected to `/`.
2. **Unauthorized Action Access:** A user with role `kepsek` manually typing `/penilaian` in address bar must be redirected to `/`.
3. **Session Preservation:** Creating a new account via `/pengguna` must not destroy or overwrite `kepsek`'s active Auth session tokens.
4. **Offline Profile Role Sync:** Cached profiles must store `role` field correctly so navigation works seamlessly when offline.
5. **Missing Role Fallback:** If `profiles.role` is null/undefined for existing accounts, default gracefully to `'tim_pendidik'`.

---

### Task 1: Database Migration for User Profiles Role & Supabase Admin Client

**Files:**
- Create: `supabase/migrations/20261111000000_add_role_to_profiles.sql`
- Create: `src/lib/server/supabaseAdmin.js`

**Interfaces:**
- Consumes: Environment variable `SUPABASE_SERVICE_ROLE_KEY` and `PUBLIC_SUPABASE_URL`
- Produces: `supabaseAdmin` client in `src/lib/server/supabaseAdmin.js` for server-side user management operations.

- [ ] **Step 1: Create SQL Migration for `role` Column in `profiles`**

Write SQL migration script to add `role` column with default `'tim_pendidik'` to `profiles` table:

```sql
-- Migration: Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'tim_pendidik' CHECK (role IN ('kepsek', 'tim_pendidik'));

-- Update existing profiles without role
UPDATE public.profiles SET role = 'tim_pendidik' WHERE role IS NULL;
```

- [ ] **Step 2: Create Server-side Supabase Admin Client**

Create `src/lib/server/supabaseAdmin.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

- [ ] **Step 3: Commit Changes**

```bash
git add supabase/migrations/ src/lib/server/supabaseAdmin.js
git commit -m "feat(auth): add role column to profiles and setup supabaseAdmin client"
```

---

### Task 2: Server API Endpoints for User Management (`/api/pengguna`)

**Files:**
- Create: `src/routes/api/pengguna/+server.js`
- Create: `src/routes/api/pengguna/reset-password/+server.js`

**Interfaces:**
- Consumes: `supabaseAdmin` from `$lib/server/supabaseAdmin.js`
- Produces: `POST /api/pengguna` (Create User), `GET /api/pengguna` (List Users), `POST /api/pengguna/reset-password` (Reset Password)

- [ ] **Step 1: Write API Endpoint for Creating and Listing Users (`src/routes/api/pengguna/+server.js`)**

```javascript
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export async function GET({ request }) {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, nama_lengkap, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ users: profiles });
}

export async function POST({ request }) {
  const { nama_lengkap, email, password } = await request.json();

  if (!nama_lengkap || !email || !password) {
    return json({ error: 'Nama lengkap, email, dan password wajib diisi.' }, { status: 400 });
  }

  const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama_lengkap }
  });

  if (createError) return json({ error: createError.message }, { status: 400 });

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: authUser.user.id,
    nama_lengkap,
    email,
    role: 'tim_pendidik'
  });

  if (profileError) return json({ error: profileError.message }, { status: 400 });

  return json({ success: true, user: authUser.user });
}
```

- [ ] **Step 2: Write API Endpoint for Resetting Password (`src/routes/api/pengguna/reset-password/+server.js`)**

```javascript
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export async function POST({ request }) {
  const { userId, newPassword = '123123' } = await request.json();

  if (!userId) {
    return json({ error: 'User ID wajib disertakan.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (error) return json({ error: error.message }, { status: 400 });

  return json({ success: true, message: `Password berhasil di-reset ke ${newPassword}` });
}
```

- [ ] **Step 3: Commit Changes**

```bash
git add src/routes/api/pengguna/
git commit -m "feat(api): create user management endpoints for kepsek"
```

---

### Task 3: Profile Role Integration & Client-Side Route Guards in Layout

**Files:**
- Modify: `src/routes/+layout.svelte`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `profile.role` from cached `profiles` fetch
- Produces: Reactive `role` state, filtered sidebar navigation items, route guard redirect function.

- [ ] **Step 1: Update Profile Fetching in `+layout.svelte` to include `role`**

Update `muatProfil` in `src/routes/+layout.svelte` to select `role` and invoke `checkRouteAccess(data.role)`.

- [ ] **Step 2: Add Route Protection & Role-based Navigation logic in `+layout.svelte`**

Define `menuItems` conditional on `profile?.role === 'kepsek'` and add `checkRouteAccess()`.

- [ ] **Step 3: Update Dashboard CTA Visibility in `src/routes/+page.svelte`**

Hide "Mulai Penilaian" button on Dashboard when `profile?.role === 'kepsek'`.

- [ ] **Step 4: Commit Changes**

```bash
git add src/routes/+layout.svelte src/routes/+page.svelte
git commit -m "feat(ui): add role-based menu filtering and route guards"
```

---

### Task 4: User Management Page (`/pengguna`) for Kepsek

**Files:**
- Create: `src/routes/pengguna/+page.svelte`

**Interfaces:**
- Consumes: `/api/pengguna` GET and POST endpoints, `/api/pengguna/reset-password` POST endpoint
- Produces: Complete User Management UI for `kepsek`.

- [ ] **Step 1: Create `/pengguna/+page.svelte` with Table and Add/Reset Modals**

- [ ] **Step 2: Verify Build**

Run `npm run build` to confirm compilation success.

- [ ] **Step 3: Commit Changes**

```bash
git add src/routes/pengguna/
git commit -m "feat(pengguna): add user management page with reset password and creation modal"
```
