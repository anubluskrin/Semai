# Pelacak Kebiasaan — Hyprland Edition

Habit tracker bertema Arch Linux / Hyprland: waybar, window ala Hyprland,
command palette (rofi/wofi-style), notifikasi ala dunst/mako, panel
statistik ala fastfetch, dan pengaturan yang disusun kayak dotfiles asli
(`colors.conf`, `hyprland.conf`, `hyprpaper.conf`, `rice.json`).

Semua data (kebiasaan, tema, tampilan, latar belakang) disimpan di
`localStorage` browser — tidak ada backend, tidak ada database.

## Struktur proyek

```
.
├── index.html              # markup + daftar <link>/<script> (satu-satunya file HTML)
├── css/
│   ├── base.css             # theme tokens (:root), reset, layer latar belakang, waybar
│   ├── window.css           # window kaca utama, titlebar, link "kembali" pengaturan
│   ├── tracker.css          # header, form tambah habit, tabel kalender, chart
│   ├── settings.css         # panel pengaturan ala dotfiles, theme grid, color wheel, rice
│   └── overlays.css         # command palette, toast notifikasi, panel fastfetch
└── js/
    ├── core.js               # Storage, util tanggal, state aplikasi, model data Habits
    ├── render.js              # render header/baris kalender, status waybar
    ├── chart.js                # chart performa harian (SVG manual + animasi tween)
    ├── navigation.js            # form tambah habit, navigasi bulan, switch panel
    ├── winfx.js                  # opacity & blur window
    ├── themes.js                  # 4 tema preset + ThemeManager + color wheel kustom
    ├── background.js               # wallpaper (gambar/video/URL) + dim
    ├── notify.js                    # toast ala dunst/mako
    ├── fastfetch.js                  # panel statistik ala fastfetch/neofetch
    ├── rice.js                        # preset satu-klik + ekspor/impor rice.json
    ├── commandPalette.js               # launcher Ctrl+K ala rofi/wofi
    └── main.js                          # entry point — import semua modul & inisialisasi
```

Setiap file JS adalah **ES module** (`import`/`export`) — tidak ada
variabel global yang bocor ke `window`, dan dependensi antar modul
eksplisit lewat `import` di baris paling atas tiap file. `main.js` adalah
satu-satunya file yang dimuat langsung dari `index.html`
(`<script type="module" src="js/main.js">`); semua modul lain dimuat
transitif lewat rantai `import`.

Peta dependensi singkatnya:

```
core.js  (tidak bergantung ke modul lain)
  ├─ chart.js
  ├─ winfx.js
  ├─ render.js        (butuh chart.js, notify.js)
  ├─ notify.js
  ├─ themes.js         (butuh winfx.js, chart.js)
  ├─ background.js
  ├─ fastfetch.js        (butuh themes.js)
  ├─ navigation.js         (butuh render.js)
  ├─ rice.js                (butuh themes.js, winfx.js, background.js, render.js)
  └─ commandPalette.js       (butuh navigation.js, themes.js, fastfetch.js, render.js, notify.js)
main.js  → import semuanya, panggil .load() tiap modul, lalu renderAll()
```

## Menjalankan

Modul ES (`import`/`export`) tidak bisa dimuat lewat `file://` di
kebanyakan browser (diblokir CORS). Jalankan lewat static server lokal,
misalnya salah satu dari:

```bash
# Python (biasanya sudah terpasang)
python3 -m http.server 8000

# Node (kalau punya npx)
npx serve .

# VS Code
# klik kanan index.html → "Open with Live Server"
```

lalu buka `http://localhost:8000` (sesuaikan port).

## Catatan

- Tidak ada build step, bundler, atau `npm install` — murni HTML/CSS/JS,
  bisa langsung diedit dan di-refresh.
- Format data yang disimpan di `localStorage` (kunci-kunci di
  `Storage.keys`, lihat `core.js`) sama persis dengan versi single-file
  sebelumnya, jadi data lama tetap kebaca kalau kamu ganti dari versi itu
  ke versi ini di browser yang sama.
- Tombol "ekspor rice.json" di pengaturan membungkus seluruh state
  (kebiasaan + tema + tampilan window + latar belakang) jadi satu file —
  sekaligus berfungsi sebagai backup manual, karena `localStorage` bisa
  hilang kapan saja (mis. clear cache browser).
