# 🐾 nozez-whatsmeow

[![npm version](https://img.shields.io/badge/version-1.0.0-crimson.svg)](https://github.com/nozez-lab/nozez-whatsmeow)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)
[![Engine: whatsmeow](https://img.shields.io/badge/Engine-whatsmeow%20(Go)-blue.svg)](https://go.mau.fi/whatsmeow)

**nozez-whatsmeow** is a high-performance WhatsApp API library for **Node.js** developed by **Nozez**. It delivers a familiar, Baileys-like developer experience (`makeWASocket`, `ev.on`, `sendMessage`, etc.) while delegating all WebSocket network connections and protocol encryptions to a lightweight **Golang engine (`whatsmeow`)** under the hood.

With **nozez-whatsmeow**, you get the ease of writing code in JavaScript/TypeScript combined with the extreme speed, stability, and memory efficiency of Go.

---

## 🔥 Key Features

- **Baileys-like Developer Experience**: Zero learning curve if you are coming from Baileys (`makeWASocket`, `ev.on("messages.upsert")`, `sendMessage`, etc.).
- **Ultra-Low Memory Footprint**: Uses only **~20MB - 50MB of RAM** (compared to standard Node.js WhatsApp libraries taking 200MB+).
- **SQLite Session Persistence**: Session keys and device credentials are stored in a resilient SQLite database (`whatsmeow.db`), drastically reducing session corruption and unexpected logouts.
- **Zero Go Setup Needed at Runtime**: Pre-compiled binaries (`main_win.exe` for Windows and `main_linux` for Linux) are bundled, enabling plug-and-play usage on Node.js hosting environments like Pterodactyl panels, VPS, or local development.
- **Rich Media & Media Downloader**: Full support for images, videos, audio, voice notes (PTT), documents, stickers, and on-demand media downloads.
- **Pretty Terminal Logger**: Styled terminal logs (`chatLog`) featuring colored badges, timestamps, and sender details out of the box.

---

## 📦 Installation

Install via **NPM**:

```bash
npm install nozez-whatsmeow
```

Or using **Yarn**:

```bash
yarn add nozez-whatsmeow
```

---

## 🚀 Quick Start

Here is a simple example to connect your bot to WhatsApp:

```javascript
import { makeWASocket, chatLog } from "nozez-whatsmeow";

const conn = makeWASocket({
  sessionName: "nozez-session", // Custom session identifier
});

// IMPORTANT: Must be called to launch the underlying Go engine!
conn.start();

// Handle Connection Updates
conn.ev.on("connection.update", (data) => {
  if (data.open) {
    console.log("✅ Successfully connected to WhatsApp!");
  } else if (data.reason === "connection_lost") {
    console.log("⚠️ Connection lost, attempting automatic reconnect...");
  }
});

// Handle Phone Pairing Code (for phone number login)
conn.ev.on("pairing_code", (code) => {
  console.log("🔑 Your WhatsApp Pairing Code:", code);
});

// Incoming Message Listener
conn.ev.on("messages.upsert", ({ meta, raw }) => {
  // Pretty terminal chat logger
  chatLog({ ...meta, timestamp: raw.timestamp, isFromMe: raw.isFromMe });
});

// Request Phone Pairing Code (call after conn.start())
await conn.requestPairingCode("628xxxxxxxxxx");
```

---

## 📤 Sending Messages

Sending messages is unified through `conn.sendMessage(jid, content, options)`:

```javascript
// Send Plain Text Message
await conn.sendMessage("628xxx@s.whatsapp.net", {
  text: "Hello World from nozez-whatsmeow! 🚀",
});

// Send Image with Caption
await conn.sendMessage("628xxx@s.whatsapp.net", {
  image: "./assets/photo.jpg",
  caption: "Check out this image!",
});

// Send Video
await conn.sendMessage("628xxx@s.whatsapp.net", {
  video: "./assets/clip.mp4",
  caption: "Awesome video clip",
});

// Send Audio / Voice Note (PTT)
await conn.sendMessage("628xxx@s.whatsapp.net", {
  ptt: "./assets/voice.ogg",
});

// Send Document File
await conn.sendMessage("628xxx@s.whatsapp.net", {
  document: "./documents/report.pdf",
  fileName: "Monthly_Report.pdf",
});

// Reply to a Message (Quoted Reply)
await conn.sendMessage(
  jid,
  { text: "This is a reply to your message" },
  { quoted: m }
);
```

---

## 📥 Downloading Received Media

You can download media from received messages directly:

```javascript
conn.ev.on("messages.upsert", async ({ meta, raw }) => {
  if (meta.msgType === "Image" || meta.msgType === "Video" || meta.msgType === "Document") {
    try {
      const res = await conn.downloadMedia(raw.id, "./downloads");
      console.log("📁 Media downloaded to:", res.filePath);
    } catch (err) {
      console.error("Failed to download media:", err.message);
    }
  }
});
```

---

## 🛠️ API Reference

### `makeWASocket(options)`
- `options.sessionName` *(string, default: `"nozez"`)*: Session name directory in `./sessions/`.

### Methods
- `conn.start()`: Starts the background Go engine process.
- `conn.stop()`: Gracefully closes the connection and terminates the Go engine process.
- `conn.requestPairingCode(phone)`: Requests an 8-digit pairing code for login.
- `conn.sendMessage(jid, content, options)`: Sends text or media messages.
- `conn.downloadMedia(messageId, outputDir)`: Downloads media attachment to `outputDir`.

---

## 📄 License & Acknowledgements

- **Developer**: Created & Maintained by **[Nozez](https://github.com/nozez-lab)**.
- **Engine**: Powered by **[whatsmeow](https://go.mau.fi/whatsmeow)** Golang library & SQLite.
- Released under the [MIT License](LICENSE).
