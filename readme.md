# 🎨 AI Anime Generator

Website modern untuk mengubah gambar menjadi karakter anime wanita dengan AI. Website ini mengekstrak warna dari gambar yang di-upload dan menggunakannya sebagai referensi untuk menghasilkan artwork anime yang stunning.

## ✨ Fitur

- 📤 **Upload Gambar** - Drag & drop atau klik untuk upload
- 🎨 **Ekstraksi Warna Otomatis** - Mengambil 5 warna dominan dari gambar
- 🤖 **AI Generation** - Mengubah gambar menjadi anime style
- 💾 **Download Result** - Simpan hasil dalam format PNG
- 📱 **Responsive Design** - Tampil sempurna di semua device
- ⚡ **Real-time Preview** - Lihat preview sebelum generate

## 🚀 Cara Menggunakan

### 1. Setup File

Clone atau download semua file ke folder project:
```
project-folder/
├── index.html
├── style.css
├── script.js
├── server.js          ← Backend proxy (PENTING!)
├── package.json       ← Dependencies
├── .gitignore
└── README.md
```

### 2. Install Dependencies

Buka terminal di folder project dan jalankan:

```bash
npm install
```

Ini akan install:
- `express` - Web server framework
- `cors` - CORS handling
- `node-fetch` - Fetch API untuk Node.js

### 3. Konfigurasi API Token

**PENTING:** Edit file `server.js` baris 11:

```javascript
const REPLICATE_API_TOKEN = 'r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // ← Paste token Anda
```

Untuk mendapatkan token:
1. Buka [Replicate.com](https://replicate.com)
2. Login/Daftar
3. Pergi ke Settings → [API Tokens](https://replicate.com/account/api-tokens)
4. Copy token Anda

### 4. Jalankan Backend Server

```bash
npm start
```

Anda akan melihat:
```
========================================
🎨 Anime AI Generator Server
========================================
Server running on: http://localhost:3000
API endpoint: http://localhost:3000/api
========================================
```

### 5. Akses Website

Buka browser dan pergi ke:
```
http://localhost:3000
```

**Backend server HARUS tetap berjalan** selama menggunakan website!

## 🔧 Mengapa Perlu Backend Server?

### Masalah CORS
Browser memblokir request langsung ke Replicate API karena **CORS policy**:
```
Access to fetch at 'https://api.replicate.com' has been blocked by CORS policy
```

### Solusi: Backend Proxy
Backend server bertindak sebagai "perantara":
```
Browser → Backend Server (localhost:3000) → Replicate API
         ✅ No CORS issue!
```

### Arsitektur:
```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Browser   │         │   Node.js    │         │  Replicate API  │
│  (Frontend) │ ──────> │   Backend    │ ──────> │   (Animagine)   │
│             │ <────── │   Proxy      │ <────── │                 │
└─────────────┘         └──────────────┘         └─────────────────┘
    Port 3000              Port 3000             https://api.replicate.com
```

### 2. Konfigurasi API

Website ini menggunakan **Replicate API** dengan model **Animagine XL V4** untuk AI generation. Ikuti langkah berikut:

#### A. Dapatkan API Token dari Replicate

1. Buka [Replicate.com](https://replicate.com)
2. Daftar/Login ke akun Anda
3. Pergi ke Settings → API Tokens
4. Copy API token Anda

#### B. Model yang Digunakan

Website ini sudah dikonfigurasi dengan:
- **Model**: Animagine XL V4 (by aisha-ai-official)
- **Version**: `cfd0f86fbcd03df45fca7ce83af9bb9c07850a3317303fe8dcf677038541db8a`
- **Spesialisasi**: High-quality anime character generation
- **Output**: 832x1216 resolution (portrait anime girl)

Model ini sangat cocok untuk:
- ✅ Generate anime girl characters
- ✅ High quality detailed artwork
- ✅ Consistent anime art style
- ✅ Fast generation (~30 seconds)

#### C. Edit script.js

Buka file `script.js` dan edit **HANYA API Token**:

```javascript
const CONFIG = {
    apiEndpoint: 'https://api.replicate.com/v1/predictions',
    apiToken: 'r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxx', // ← Paste API token Anda di sini
    modelVersion: 'cfd0f86fbcd03df45fca7ce83af9bb9c07850a3317303fe8dcf677038541db8a', // ← Sudah dikonfigurasi!
    // ... config lainnya
};
```

**Model version sudah di-set, Anda HANYA perlu mengganti API token!**

### 3. Jalankan Website

#### Opsi 1: Local Server (Recommended)

Menggunakan Python:
```bash
# Python 3
python -m http.server 8000

# Atau Python 2
python -m SimpleHTTPServer 8000
```

Menggunakan Node.js:
```bash
# Install http-server globally
npm install -g http-server

# Jalankan server
http-server -p 8000
```

Kemudian buka browser: `http://localhost:8000`

#### Opsi 2: VS Code Live Server

1. Install extension "Live Server" di VS Code
2. Right-click pada `index.html`
3. Pilih "Open with Live Server"

#### Opsi 3: Double Click (Tidak Recommended)

Double click `index.html` - namun API calls mungkin terblokir oleh CORS policy.

## 📖 Cara Kerja

### 1. Upload & Color Extraction

```javascript
User upload gambar
↓
Canvas API memproses gambar
↓
Ekstraksi 5 warna dominan
↓
Konversi RGB ke HEX
↓
Display color palette
```

### 2. AI Generation Process (via Backend Proxy)

```javascript
User klik "Generate"
↓
Frontend kirim request ke Backend (localhost:3000)
↓
Backend kirim request ke Replicate API
↓
Backend poll status setiap 2 detik
↓
Backend kirim hasil ke Frontend
↓
Tampilkan anime artwork!
```

### 3. Endpoint Backend

**POST /api/generate**
- Input: `{ prompt, negativePrompt }`
- Output: `{ id, status, ... }`
- Membuat prediction baru

**GET /api/prediction/:id**
- Input: Prediction ID
- Output: `{ status, output, ... }`
- Check status prediction

**GET /api/health**
- Health check endpoint
- Output: `{ status: 'ok' }`

### 3. Prompt Engineering

Website secara otomatis membuat prompt yang optimal:

```
masterpiece, best quality, highly detailed,
beautiful anime girl, feminine features,
expressive eyes, detailed face,
inspired by color palette: #FF6B9D, #C371F5, ...
predominant colors: #FF6B9D,
modern anime style, 4k, ultra detailed
```

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Edit server.js - tambahkan API token Anda
# Baris 11: const REPLICATE_API_TOKEN = 'r8_your_token_here';

# 3. Start server
npm start

# 4. Buka browser
# http://localhost:3000
```

That's it! 🎉

## 🎯 Menggunakan API Lain

Jika ingin menggunakan API selain Replicate, edit `server.js`:

### Contoh: Stability AI

```javascript
const STABILITY_API_KEY = 'your_stability_key';
const STABILITY_ENDPOINT = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

app.post('/api/generate', async (req, res) => {
    // Implementasi custom untuk Stability AI
});
```

### Contoh: Custom API

Sesuaikan endpoint dan authentication di `server.js` sesuai dokumentasi API Anda.

## 🛠️ Customization

### Mengubah Warna Theme

Edit file `style.css`:

```css
:root {
    --primary-gradient: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
    --dark-bg: #YOUR_BG_COLOR;
    --card-bg: #YOUR_CARD_COLOR;
}
```

### Mengubah Prompt Template

Edit `ANIME_PROMPT_TEMPLATE` di `script.js`:

```javascript
const ANIME_PROMPT_TEMPLATE = `
    // Tambahkan style preferences Anda di sini
    your custom prompt here,
    inspired by color palette: {colors}
`;
```

### Menambah Jumlah Warna

Edit di function `extractColorsFromImage()`:

```javascript
.slice(0, 5) // ← Ubah angka ini untuk lebih/kurang warna
```

## 🔧 Troubleshooting

### Problem: "CORS policy blocked"
```
Access to fetch at 'https://api.replicate.com' has been blocked by CORS policy
```
**Solusi:** 
1. Pastikan backend server sudah running (`npm start`)
2. Akses via `http://localhost:3000` BUKAN `file://`
3. Jangan panggil Replicate API langsung dari browser

### Problem: "Backend server is not running"
**Solusi:**
```bash
# Pastikan di folder yang benar
cd project-folder

# Install dependencies (jika belum)
npm install

# Jalankan server
npm start
```

### Problem: "API Error: 401 Unauthorized"
**Solusi:** 
1. Token API salah atau expired
2. Edit `server.js` baris 11
3. Paste token yang benar dari Replicate
4. Restart server (Ctrl+C, lalu `npm start`)

### Problem: "API Error: 404 Not Found"
**Solusi:** Model version sudah benar, kemungkinan:
1. Token tidak memiliki akses ke model
2. Quota API habis
3. Check di Replicate dashboard

### Problem: Port 3000 sudah digunakan
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solusi:**
```bash
# Matikan process yang pakai port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Atau ubah port di server.js:
const PORT = 3001; // Ganti ke port lain
```

### Problem: Loading terlalu lama (>2 menit)
**Solusi:** 
1. Check console browser (F12) untuk error
2. Check terminal server untuk error
3. Generation normal: 30-60 detik
4. Jika timeout, coba lagi

### Problem: "npm: command not found"
**Solusi:**
1. Install Node.js dari [nodejs.org](https://nodejs.org)
2. Restart terminal
3. Verify: `node --version` dan `npm --version`

### Problem: Result gambar broken/tidak muncul
**Solusi:**
1. Check console untuk error
2. Output URL dari Replicate kadang temporary
3. Download langsung setelah generate

## 💡 Tips & Best Practices

1. **Backend Server**
   - Server HARUS running untuk generate gambar
   - Jangan close terminal saat menggunakan website
   - Untuk production, deploy ke Heroku/Railway/Vercel

2. **Upload Gambar Berkualitas**
   - Resolusi minimal: 512x512px
   - Format: PNG/JPG/WEBP
   - Ukuran maks: 10MB

3. **Untuk Hasil Terbaik**
   - Gunakan gambar dengan warna jelas dan kontras
   - Hindari gambar terlalu gelap/terang
   - Upload foto wajah untuk hasil karakter lebih baik

4. **Optimasi Biaya API**
   - Replicate charges per generation (~$0.01-0.05)
   - Test dengan 1-2 gambar dulu
   - Monitor usage di [Replicate Dashboard](https://replicate.com/account)

5. **Performance**
   - Generation time: 30-60 detik
   - Jangan refresh page saat loading
   - Gunakan koneksi internet stabil

6. **Development**
   - Gunakan `nodemon` untuk auto-restart: `npm run dev`
   - Check logs di terminal untuk debugging
   - Test API health: `http://localhost:3000/api/health`

## 📝 Demo Mode

Jika API belum dikonfigurasi, website akan berjalan dalam **Demo Mode**:

- Menampilkan gambar dengan filter sederhana
- Tidak ada AI generation sebenarnya
- Berguna untuk testing UI/UX

Untuk disable demo mode, configure API token dengan benar.

## 🎨 Rekomendasi Model Anime

### Untuk Karakter Anime:
- `anything-v4.0` - Versatile, good for general anime
- `waifu-diffusion` - Specialized for anime girls
- `counterfeit-v2.5` - High quality anime style

### Untuk Art Style Tertentu:
- `openjourney-v4` - Artistic anime
- `dreamshaper` - Fantasy anime style
- `rev-animated` - Animation-ready style

## 📄 License

Silakan gunakan dan modifikasi sesuai kebutuhan Anda. Jika menggunakan untuk komersial, pastikan:
- Comply dengan ToS API yang digunakan
- Credit model creators
- Review licensing model AI yang digunakan

## 🤝 Support

Untuk pertanyaan atau issue:
1. Check troubleshooting section
2. Review API documentation
3. Test dengan demo mode terlebih dahulu

## 🔄 Update Log

**Version 1.0**
- Initial release
- Color extraction feature
- Replicate API integration
- Responsive design
- Download functionality

---

**Dibuat dengan ❤️ untuk anime lovers**

Selamat mencoba! 🎉