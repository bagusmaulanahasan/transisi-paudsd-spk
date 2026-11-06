# Panduan Universal: Test Design (Visual Regression Manual) dengan Headless Chrome

Dokumen ini menjelaskan cara memeriksa hasil desain sebuah halaman **tanpa harus login manual dan tanpa mengisi data satu per satu**. Halaman dimuat di Chrome *headless*, data API dipalsukan (mock), lalu diambil tangkapan layar pada beberapa ukuran layar untuk diperiksa secara visual.

Cocok dipakai untuk semua menu di proyek ini (Kriteria & AHP, Indikator, Kelas & Anak, Penilaian & MOORA, Laporan) maupun proyek lain yang memakai Supabase / REST API.

---

## 1. Apa yang bisa dideteksi dengan cara ini?

| Masalah | Contoh yang tertangkap |
| --- | --- |
| Spasi mepet / tidak ada gap | label berdempetan dengan dropdown, tombol menempel di tepi kartu |
| Layout pecah di ukuran tertentu | header bertumpuk di tablet, tabel terpotong di mobile |
| Hirarki visual lemah | judul dan subjudul berukuran hampir sama, aksi tidak jelas |
| Tabel tidak sesuai aturan | kolom "No." tidak ada, tidak ada scroll horizontal di mobile |
| State kosong/loading tidak diatur | area kosong tanpa pesan, teks "undefined" |
| Form/modal tidak konsisten | padding modal beda dengan modal menu lain, label tidak sejajar |
| Teks terpotong | kolom "Poin (Otomatis)" pecah 2 baris, placeholder terpotong |

> Ini **bukan pengganti** unit test. Ini pemeriksaan visual (mata manusia dibantu screenshot) yang dijalankan sebelum melaporkan pekerjaan selesai.

---

## 2. Prasyarat

1. **Node.js 22+** (butuh `WebSocket` bawaan dan `--experimental` tidak diperlukan).
2. **Google Chrome / Chromium** terpasang.
   - Linux: `which google-chrome chromium` → biasanya `/usr/bin/google-chrome`
   - macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
   - Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`
3. **Dev server aplikasi berjalan** (`npm run dev`) dan halaman bisa diakses di `http://localhost:5173`.
4. Tidak perlu package tambahan — skrip memakai API bawaan Node (`child_process`, `fs`, `fetch`, `WebSocket`).

Cek cepat:

```bash
node -v                 # harus >= 22
which google-chrome     # atau chromium
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
```

---

## 3. Cara kerja singkat

```
Node menjalankan Chrome headless
        │
        ├─ buka tab baru lewat Chrome DevTools Protocol (CDP)
        ├─ (opsional) pasang cookie sesi login Supabase
        ├─ (opsional) palsukan respons REST API  → halaman terisi data contoh
        ├─ buka URL halaman
        ├─ (opsional) suntik CSS hasil build       → mengatasi CSS dev server yang stale
        ├─ (opsional) klik tombol tertentu         → memotret modal
        └─ simpan PNG
```

---

## 4. Langkah cepat (5 langkah)

### Langkah 1 — Simpan skrip

Salin skrip pada [Bagian 8](#8-skrip-lengkap-design-shotmjs) ke file, misalnya:

```
scripts/design-shot.mjs
```

(Skrip ini mandiri, tidak butuh dependensi proyek.)

### Langkah 2 — Sesuaikan data contoh (mock)

Buka bagian `MOCK` di skrip. Isinya pemetaan **potongan URL → data**:

```js
const MOCK = {
  '/rest/v1/kriteria': [ { id: 1, inisial: 'C1', nama: 'Contoh', jenis: 'benefit', urutan: 1 } ],
  '/rest/v1/indikator': [ { id: 1, kriteria_id: 1, pertanyaan: 'Contoh pertanyaan?' } ]
};
```

Untuk menu lain, tambahkan kunci sesuai nama tabel Supabase-nya (lihat [Bagian 6](#6-mock-data-untuk-menu-lain)).

### Langkah 3 — Pastikan nama cookie sesi benar

Cookie sesi Supabase selalu berbentuk:

```
sb-<project-ref>-auth-token
```

`<project-ref>` adalah subdomain dari `PUBLIC_SUPABASE_URL`, contoh:

```
PUBLIC_SUPABASE_URL=https://waizwkjshbdpdwsblypu.supabase.co
                              └──── project-ref ─────┘
→ cookie: sb-waizwkjshbdpdwsblypu-auth-token
```

Nama cookie ini diisi pada variabel `AUTH_COOKIE` (atau biarkan kosong bila halaman tidak butuh login, mis. halaman publik/login).

### Langkah 4 — Jalankan untuk beberapa ukuran layar

Contoh nyata yang dipakai di proyek ini:

```bash
# Desktop
APP_URL=http://localhost:5173/indikator OUT=/tmp/opencode/indikator-desktop.png \
VIEW_W=1440 VIEW_H=1200 AUTH_COOKIE=sb-waizwkjshbdpdwsblypu-auth-token \
node scripts/design-shot.mjs

# Tablet
APP_URL=http://localhost:5173/indikator OUT=/tmp/opencode/indikator-tablet.png \
VIEW_W=768 VIEW_H=1024 AUTH_COOKIE=sb-waizwkjshbdpdwsblypu-auth-token \
node scripts/design-shot.mjs

# Mobile
APP_URL=http://localhost:5173/indikator OUT=/tmp/opencode/indikator-mobile.png \
VIEW_W=390 VIEW_H=844 AUTH_COOKIE=sb-waizwkjshbdpdwsblypu-auth-token \
node scripts/design-shot.mjs

# Modal: klik tombol "Tambah Opsi" dulu, lalu potret
APP_URL=http://localhost:5173/indikator OUT=/tmp/opencode/modal-opsi.png \
VIEW_W=1440 VIEW_H=900 AUTH_COOKIE=sb-waizwkjshbdpdwsblypu-auth-token \
CLICK_TEXT="Tambah Opsi" node scripts/design-shot.mjs
```

### Langkah 5 — Periksa gambar dengan checklist

Buka tiap PNG (atau tampilkan lewat tool `read` bila memakai agen AI) lalu jalankan checklist pada [Bagian 7](#7-checklist-review-visual).

---

## 5. Variabel environment

| Variabel | Default | Fungsi |
| --- | --- | --- |
| `APP_URL` | `http://localhost:5173/` | URL halaman yang dipotret |
| `OUT` | `screenshot.png` | Lokasi file PNG hasil |
| `VIEW_W` / `VIEW_H` | `1440` / `1200` | Ukuran viewport CSS (bukan ukuran file) |
| `CDP_PORT` | `9222` | Port debugging Chrome (ganti bila bentrok) |
| `WAIT_MS` | `4000` | Jeda setelah halaman dibuka sebelum potret |
| `AUTH_COOKIE` | *(kosong)* | Nama cookie sesi Supabase; kosongkan untuk halaman publik |
| `CLICK_TEXT` | *(kosong)* | Klik tombol pertama yang teksnya mengandung string ini (untuk modal/dropdown) |
| `INJECT_CSS` | *(kosong)* | Path file CSS hasil build yang disuntikkan (mengatasi Tailwind stale) |
| `MOCK_FILE` | *(kosong)* | Path file JSON untuk menimpa/menambah data contoh `MOCK` |
| `CHROME_PATH` | otomatis | Path binary Chrome bila tidak terdeteksi |
| `CHROME_PROFILE` | folder temp | Folder profil Chrome sementara |

---

## 6. Mock data untuk menu lain

Kunci `MOCK` dicocokkan dengan `url.includes(kunci)`. Contoh untuk menu lain di proyek ini:

```js
const MOCK = {
  // Profil untuk header (dipakai semua halaman)
  '/rest/v1/profiles': { nama_lengkap: 'Tim Pendidik', email: 'demo@paud.sch.id' },

  // Halaman Kriteria & AHP
  '/rest/v1/kriteria': [
    { id: 1, inisial: 'C1', nama: 'Kematangan Kognitif', jenis: 'benefit', urutan: 1 },
    { id: 2, inisial: 'C2', nama: 'Kesehatan Fisik & Motorik', jenis: 'benefit', urutan: 2 }
  ],
  '/rest/v1/perbandingan_ahp': [
    { id: 1, kriteria_1_id: 1, kriteria_2_id: 2, nilai: 2 }
  ],

  // Halaman Indikator
  '/rest/v1/indikator': [
    { id: 1, kriteria_id: 1, pertanyaan: 'Anak mampu mengenali simbol huruf/angka dasar.' }
  ],
  '/rest/v1/opsi_jawaban': [
    { id: 1, indikator_id: null, opsi: 'Belum Berkembang', keterangan: 'Belum menunjukkan', poin: 1 },
    { id: 2, indikator_id: null, opsi: 'Sesuai Harapan', keterangan: 'Sesuai tahapan', poin: 2 }
  ],

  // Halaman Kelas & Anak
  '/rest/v1/kelas': [ { id: 1, nama: 'Kelas A', tahun_ajaran: '2026/2027' } ],
  '/rest/v1/anak': [ { id: 1, kelas_id: 1, nis: '2026001', nama: 'Aisyah' } ]
};
```

Catatan penting:

- **Array** untuk query daftar (`select()`), **objek tunggal** untuk query `.single()` (contoh: `profiles`, detail kelas).
- Skrip otomatis mengubah array menjadi objek pertama bila request memakai `.single()` (header `Accept: application/vnd.pgrst.object+json`), jadi Anda cukup menulis datanya sebagai array.
- Bila halaman memakai filter (`.eq()`, `.is()`), skrip ini **tidak** menyaring data — mock mengembalikan semua baris. Untuk menguji state kosong, isi `[]`.

---

## 7. Checklist review visual

Jalankan berurutan pada setiap PNG.

### A. Spasi & kepadatan
- [ ] Jarak antar-section konsisten (contoh proyek ini: `space-y-6` / `space-y-8`).
- [ ] Padding kartu seragam (`p-5 md:p-6`), tidak ada teks menempel border.
- [ ] Jarak label ke input ≥ 8px; antar-field ≥ 16px.
- [ ] Tombol tidak berdempetan dengan teks/badge (gap ≥ 8–12px).

### B. Hirarki & konsistensi
- [ ] Judul halaman, judul section, subjudul, label memakai skala yang sama dengan menu lain.
- [ ] Pola header kartu sama dengan menu lain (judul + subjudul kiri, aksi kanan).
- [ ] Tombol primer memakai warna & radius yang sama di semua halaman.
- [ ] Ikon berasal dari satu set (lucide-svelte), tidak ada emoji.

### C. Tabel
- [ ] Kolom **"No."** ada di paling kiri.
- [ ] Header kolom memakai huruf kapital kecil + warna abu yang sama.
- [ ] Di mobile: tabel bisa di-scroll horizontal dan ada petunjuk geser.
- [ ] Angka (poin/bobot) rata tengah atau kanan secara konsisten.

### D. State
- [ ] Loading: ada indikator (spinner + teks).
- [ ] Kosong: ada ikon + penjelasan + ajakan aksi (bukan area kosong).
- [ ] Error/gagal simpan: memakai alert/notifikasi yang jelas.

### E. Form & modal
- [ ] Modal identik dengan modal menu lain (header abu, body, footer tombol).
- [ ] Label + input sejajar, semua input punya `id`/`for` (aksesibilitas).
- [ ] Field yang tidak boleh diubah tampil *disabled* (contoh: poin otomatis).
- [ ] Tombol Simpan punya state loading dan disabled saat proses.

### F. Ukuran layar
- [ ] **390px** (mobile): tidak ada overflow horizontal pada body, tombol mudah dijangkau.
- [ ] **768px** (tablet): header tidak bertumpuk aneh, sidebar/drawer berfungsi.
- [ ] **1440px** (desktop): konten tidak melebar berlebihan, kolom tabel proporsional.

---

## 8. Skrip lengkap: `design-shot.mjs`

```js
// design-shot.mjs — potret halaman web dengan data contoh, tanpa login manual.
// Jalankan: APP_URL=http://localhost:5173/indikator OUT=out.png node design-shot.mjs
// Semua konfigurasi lewat environment variable (lihat tabel di docs/design-test.md).

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ==================== KONFIGURASI ====================
const APP_URL = process.env.APP_URL || 'http://localhost:5173/';
const OUT = process.env.OUT || 'screenshot.png';
const VIEW_W = Number(process.env.VIEW_W || 1440);
const VIEW_H = Number(process.env.VIEW_H || 1200);
const CDP_PORT = Number(process.env.CDP_PORT || 9222);
const WAIT_MS = Number(process.env.WAIT_MS || 4000);
const CLICK_TEXT = process.env.CLICK_TEXT || '';
const INJECT_CSS = process.env.INJECT_CSS || '';
const AUTH_COOKIE = process.env.AUTH_COOKIE || '';
const ORIGIN = new URL(APP_URL).origin;
const PROFILE_DIR = process.env.CHROME_PROFILE || path.join(os.tmpdir(), 'design-shot-profile');

// Data contoh: kunci = potongan URL request, nilai = body JSON balasan.
let MOCK = {
  '/rest/v1/profiles': { nama_lengkap: 'Tim Pendidik', email: 'demo@paud.sch.id' },
  '/rest/v1/kriteria': [
    { id: 1, inisial: 'C1', nama: 'Kematangan Kognitif & Literasi Dasar', jenis: 'benefit', urutan: 1 },
    { id: 2, inisial: 'C2', nama: 'Kesehatan Fisik & Motorik Kasar/Halus', jenis: 'benefit', urutan: 2 }
  ],
  '/rest/v1/indikator': [
    { id: 1, kriteria_id: 1, pertanyaan: 'Anak mampu mengenali dan menyebutkan simbol huruf/angka dasar.' },
    { id: 2, kriteria_id: 1, pertanyaan: 'Anak dapat menceritakan kembali cerita pendek yang baru didengar.' }
  ],
  '/rest/v1/opsi_jawaban': [
    { id: 1, indikator_id: null, opsi: 'Belum Berkembang', keterangan: 'Belum menunjukkan perkembangan', poin: 1 },
    { id: 2, indikator_id: null, opsi: 'Sedang Berkembang', keterangan: 'Mulai menunjukkan dengan bantuan', poin: 2 },
    { id: 3, indikator_id: null, opsi: 'Sesuai Harapan', keterangan: 'Sesuai tahapan usianya', poin: 3 }
  ],
  '/rest/v1/kelas': [
    { id: 1, nama_kelas: 'Kelas A', tahun_ajaran: '2026/2027' },
    { id: 2, nama_kelas: 'Kelas B', tahun_ajaran: '2026/2027' }
  ],
  '/rest/v1/anak': [
    { id: 1, kelas_id: 1, nis: '2026001', nama: 'Aisyah Putri' },
    { id: 2, kelas_id: 1, nis: null, nama: 'Bima Saputra' },
    { id: 3, kelas_id: 2, nis: '2026003', nama: 'Citra Dewi' }
  ]
};

// Timpa atau tambah data contoh dari file JSON bila MOCK_FILE diisi.
if (process.env.MOCK_FILE && fs.existsSync(process.env.MOCK_FILE)) {
  Object.assign(MOCK, JSON.parse(fs.readFileSync(process.env.MOCK_FILE, 'utf8')));
}

// ==================== UTILITAS ====================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mencari binary Chrome yang tersedia di mesin.
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ];
  return candidates.find((p) => fs.existsSync(p)) || 'google-chrome';
}

// Menunggu Chrome siap lalu mengembalikan alamat WebSocket CDP.
async function waitForChrome() {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch {
      // Chrome belum siap, coba lagi.
    }
    await sleep(250);
  }
  throw new Error('Chrome tidak kunjung siap. Cek CHROME_PATH.');
}

// Membuat JWT palsu (tidak diverifikasi tanda tangannya oleh klien Supabase).
function fakeJwt() {
  const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({
    sub: '11111111-1111-1111-1111-111111111111',
    email: 'demo@paud.sch.id',
    role: 'authenticated',
    aud: 'authenticated',
    exp: 4102444800,
    iat: 1700000000
  })}.c2lnbmF0dXJl`;
}

// Membentuk nilai cookie sesi Supabase (format @supabase/ssr: "base64-<base64url JSON>").
function sessionCookieValue() {
  const session = {
    access_token: fakeJwt(),
    token_type: 'bearer',
    expires_in: 3600000,
    expires_at: 4102444800,
    refresh_token: 'fake-refresh-token',
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'demo@paud.sch.id',
      app_metadata: {},
      user_metadata: {},
      created_at: '2024-01-01T00:00:00Z'
    }
  };
  return 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
}

// Membungkus objek menjadi body base64 yang diminta Fetch.fulfillRequest.
const bodyB64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');

// ==================== MULAI CHROME ====================
const chrome = spawn(findChrome(), [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${PROFILE_DIR}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--hide-scrollbars',
  `--window-size=${VIEW_W},${VIEW_H}`,
  'about:blank'
], { stdio: 'ignore' });

const wsUrl = await waitForChrome();
const ws = new WebSocket(wsUrl);
const pending = new Map();
const handlers = [];
let msgId = 0;

// Menerima pesan CDP dan meneruskannya ke promise atau handler yang sesuai.
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method) {
    for (const h of handlers) h(msg);
  }
});

// Mengirim perintah CDP dan menunggu balasannya.
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

await new Promise((r) => ws.addEventListener('open', r, { once: true }));

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

// Memanggil perintah CDP pada tab yang sudah dibuat.
const page = (method, params) => send(method, params, sessionId);

await page('Page.enable');
await page('Runtime.enable');
await page('Network.enable');

// Menyamakan ukuran viewport dengan ukuran layar yang diuji.
await page('Emulation.setDeviceMetricsOverride', {
  width: VIEW_W,
  height: VIEW_H,
  deviceScaleFactor: 1,
  mobile: VIEW_W < 768
});

// Memasang cookie sesi palsu supaya halaman tidak dilempar ke /login.
if (AUTH_COOKIE) {
  await page('Network.setCookie', {
    name: AUTH_COOKIE,
    value: sessionCookieValue(),
    domain: new URL(APP_URL).hostname,
    path: '/',
    httpOnly: false,
    secure: false
  });
}

// Header CORS agar browser menerima respons mock dari origin aplikasi.
const corsHeaders = [
  { name: 'Access-Control-Allow-Origin', value: ORIGIN },
  { name: 'Access-Control-Allow-Headers', value: '*' },
  { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
  { name: 'Content-Type', value: 'application/json' }
];

// Menghentikan request REST dan membalasnya dengan data contoh.
handlers.push(async (msg) => {
  if (msg.method !== 'Fetch.requestPaused') return;
  const { requestId, request } = msg.params;
  try {
    if (request.method === 'OPTIONS') {
      await page('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: corsHeaders });
      return;
    }
    let payload = [];
    for (const [needle, data] of Object.entries(MOCK)) {
      if (request.url.includes(needle)) {
        payload = data;
        break;
      }
    }

    // Query .single() meminta satu objek (Accept: application/vnd.pgrst.object+json),
    // jadi array contoh otomatis diubah menjadi objek pertama.
    const accept = request.headers.accept || request.headers.Accept || '';
    if (accept.includes('vnd.pgrst.object') && Array.isArray(payload)) {
      payload = payload[0] ?? null;
    }

    await page('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: corsHeaders,
      body: bodyB64(payload)
    });
  } catch (e) {
    console.error('Gagal membalas request mock:', e.message);
  }
});

// Mengaktifkan intersepsi hanya untuk endpoint REST Supabase.
await page('Fetch.enable', { patterns: [{ urlPattern: '*/rest/v1/*', requestStage: 'Request' }] });

// Membuka halaman yang akan diuji.
await page('Page.navigate', { url: APP_URL });
await sleep(WAIT_MS);

// Menyuntikkan CSS hasil build bila CSS dev server basi (opsional).
if (INJECT_CSS && fs.existsSync(INJECT_CSS)) {
  const css = fs.readFileSync(INJECT_CSS, 'utf8');
  await page('Runtime.evaluate', {
    expression: `(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(css)}; document.head.appendChild(s); })()`
  });
  await sleep(800);
}

// Mengklik tombol berdasarkan teksnya (untuk memotret modal atau dropdown).
if (CLICK_TEXT) {
  await page('Runtime.evaluate', {
    expression: `(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes(${JSON.stringify(CLICK_TEXT)}));
      if (btn) btn.click();
      return !!btn;
    })()`
  });
  await sleep(800);
}

// Melaporkan lebar dokumen untuk mendeteksi overflow horizontal pada layar kecil.
const metrics = await page('Runtime.evaluate', {
  expression: 'JSON.stringify({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth })',
  returnByValue: true
});
console.log('Lebar halaman:', metrics.result.value);

// Mengambil tangkapan layar seluruh halaman lalu menyimpannya.
const { data } = await page('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
fs.writeFileSync(OUT, Buffer.from(data, 'base64'));
console.log('Tersimpan:', OUT);

try {
  await send('Browser.close');
} catch {
  // Abaikan bila Chrome sudah tertutup.
}
chrome.kill();
process.exit(0);
```

---

## 9. Troubleshooting

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| Halaman terlihat "mepet" / gap hilang padahal kode benar | CSS Tailwind dev server **stale**: kelas baru tidak tergenerate | Restart `npm run dev`. Verifikasi: `curl -s http://localhost:5173/src/app.css \| grep -c "lg\\\\:flex-row"` → harus > 0. Alternatif: `npm run build` lalu pakai `INJECT_CSS`. |
| Selalu diarahkan ke `/login` | Cookie sesi salah nama / tidak terpasang | Cek nama cookie: buka aplikasi, DevTools → Application → Cookies → `sb-<ref>-auth-token`. Isi `AUTH_COOKIE` sama persis. |
| Halaman kosong / "Gagal memuat data" | Mock tidak cocok dengan URL | Cetak `request.url` di handler mock, lalu sesuaikan kunci `MOCK`. |
| `Tersimpan` tetapi tabel kosong | Query memakai `.single()` tapi mock array | Balas objek tunggal (bukan array) untuk endpoint tersebut. |
| CORS error di console | Preflight `OPTIONS` tidak dibalas | Pastikan handler membalas `OPTIONS` dengan 204 + header CORS (sudah ada di skrip). |
| `Chrome tidak kunjung siap` | Binary tidak ditemukan / port dipakai | Set `CHROME_PATH`, atau ganti `CDP_PORT`. |
| Screenshot terpotong di tengah | Animasi/loading belum selesai | Naikkan `WAIT_MS` (mis. `8000`). |
| `npm run preview` 500 `$state is not defined` | Versi `@sveltejs/kit` tidak cocok dengan Svelte 4 | Bukan masalah skrip. Perbaiki dependency (upgrade Svelte 5 atau turunkan Kit) sebelum menguji hasil build. |

---

## 10. Batasan

- Screenshot hanya membuktikan **satu state** (satu data, satu ukuran). Untuk state kosong/error, jalankan ulang dengan `MOCK` berisi `[]` atau matikan mock.
- Intersepsi hanya URL `*/rest/v1/*`. Bila proyek memakai GraphQL/edge function, tambahkan pola `urlPattern` lain.
- Tidak menguji interaksi kompleks (drag, multi-step wizard). Untuk itu, gunakan Playwright/Cypress.
- Cookie sesi palsu **hanya** untuk browser lokal; jangan pernah dipakai di server atau CI yang mengakses data nyata.

---

## 11. Ringkasan alur kerja yang disarankan

1. Implementasi/ubah halaman.
2. `npm run build` (memastikan kompilasi + CSS lengkap).
3. Jalankan `design-shot.mjs` untuk 1440, 768, 390 px.
4. Periksa PNG dengan checklist Bagian 7.
5. Perbaiki temuan → ulangi langkah 3–4 sampai bersih.
6. Baru laporkan selesai / ajukan commit.
