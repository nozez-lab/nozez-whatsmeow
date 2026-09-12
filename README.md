# 🐾 nozez-whatsmeow

**nozez-whatsmeow** adalah library WhatsApp API untuk Node.js ber-performa tinggi buatan **Nozez**. Library ini memiliki developer experience (API) yang mirip dengan **Baileys** (`makeWASocket`, `ev.on`, `sendMessage`, dll), tetapi seluruh engine koneksi WhatsApp berjalan di atas **Golang (`whatsmeow`)** via Stdio IPC.

---

## ⚡ Keunggulan nozez-whatsmeow

- **Sintaks Baileys-like**: Menggunakan sintaks yang sangat familiar bagi developer Node.js (`makeWASocket`, `sendMessage`, `ev.on`).
- **Ringan & Hemat Resource**: Penggunaan RAM jauh lebih hemat (~20MB - 50MB) karena WebSocket dikelola langsung oleh engine Go.
- **SQLite Engine**: Sesi WhatsApp disimpan menggunakan SQLite yang aman, tangguh terhadap crash, dan tidak mudah corrupt.
- **Zero Go Dependency**: Sudah bisa langsung dijalankan di environment Node.js (VPS, Terminal, maupun Panel Pterodactyl).

---

## 📦 Instalasi

Jika dijadikan paket lokal atau dipasang dari npm:

```bash
npm install nozez-whatsmeow
```

---

## 🚀 Quick Start (Mulai Cepat)

```javascript
import { makeWASocket, chatLog } from "nozez-whatsmeow";

const conn = makeWASocket({
  sessionName: "nozez-session",
});

// PENTING: Wajib dipanggil untuk menyalakan engine Go!
conn.start();

// Status koneksi
conn.ev.on("connection.update", (data) => {
  if (data.open) {
    console.log("✅ Berhasil terhubung ke WhatsApp!");
  } else if (data.reason === "connection_lost") {
    console.log("⚠️ Koneksi terputus, mencoba menyambung ulang...");
  }
});

// Kode Pairing (jika login nomor HP)
conn.ev.on("pairing_code", (code) => {
  console.log("Kode Pairing Kamu:", code);
});

// Pesan Masuk (Auto Chat Log)
conn.ev.on("messages.upsert", ({ meta, raw }) => {
  chatLog({ ...meta, timestamp: raw.timestamp, isFromMe: raw.isFromMe });
});

// Contoh Minta Kode Pairing
await conn.requestPairingCode("628xxxxxxxxxx");
```

---

## 📤 Mengirim Pesan

```javascript
// Pesan Teks
await conn.sendMessage("628xxx@s.whatsapp.net", {
  text: "Halo dari nozez-whatsmeow! 🚀",
});

// Gambar
await conn.sendMessage("628xxx@s.whatsapp.net", {
  image: "./gambar.jpg",
  caption: "Deskripsi Gambar",
});

// Document / File
await conn.sendMessage("628xxx@s.whatsapp.net", {
  document: "./berkas.pdf",
  fileName: "Dokumen.pdf",
});
```

---

## 📜 Lisensi & Kredit

- Built by **Nozez**
- Underlying engine powered by [whatsmeow (mau.fi)](https://go.mau.fi/whatsmeow) & SQLite
- Released under the MIT License.
