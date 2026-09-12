// Nozez Was Here: CJS Nozez Whatsmeow Bridge

const { spawn } = require("child_process");
const readline = require("readline");
const { EventEmitter } = require("events");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { parseToBaileys } = require("./parser.cjs");

class NozezWhatsMeowBridge extends EventEmitter {
    constructor(options = {}) {
        super();
        this.sessionName = options.sessionName || "nozez";
        this.goProcess = null;
        this.pendingRequests = new Map();
        this.reqIdCounter = 1;

        const cleanExit = async () => {
            await this.stop();
            process.exit(0);
        };

        process.once("SIGINT", cleanExit);
        process.once("SIGTERM", cleanExit);
    }

    start() {
        if (this.goProcess && !this.goProcess.killed) {
            return;
        }

        const goPath = path.resolve(__dirname, "../go-engine");
        const platform = os.platform();
        const binaryName = platform === "win32" ? "main_win.exe" : "main_linux";
        const binaryPath = path.join(goPath, binaryName);

        if (platform !== "win32" && fs.existsSync(binaryPath)) {
            try {
                fs.chmodSync(binaryPath, "755");
            } catch (e) {}
        }

        if (fs.existsSync(binaryPath)) {
            this.goProcess = spawn(binaryPath, [this.sessionName], { cwd: goPath });
        } else {
            console.log("[NOZEZ-WHATSMEOW] Binary tidak ditemukan, menggunakan fallback 'go run main.go'...");
            this.goProcess = spawn("go", ["run", "main.go", this.sessionName], { cwd: goPath });
        }

        const rl = readline.createInterface({
            input: this.goProcess.stdout,
            terminal: false,
        });

        rl.on("line", (line) => {
            try {
                const parsed = JSON.parse(line);
                this._handleIPCEvent(parsed);
            } catch (e) {}
        });

        this.goProcess.stderr.on("data", (data) => {
            console.error("[NOZEZ-GO STDERR]", data.toString());
        });

        this.goProcess.on("error", (error) => {
            console.error("[NOZEZ-GO PROCESS ERROR]", error);
            for (const { reject } of this.pendingRequests.values()) {
                reject(error);
            }
            this.pendingRequests.clear();
        });

        this.goProcess.on("exit", (code, signal) => {
            console.log(`[NOZEZ-GO EXIT] code=${code} signal=${signal || "none"}`);
            const error = new Error(`Go process berhenti (code=${code}, signal=${signal || "none"})`);
            for (const { reject } of this.pendingRequests.values()) {
                reject(error);
            }
            this.pendingRequests.clear();
            this.emit("connection.update", { open: false, reason: "process_exit" });
        });
    }

    async stop() {
        if (this.goProcess && !this.goProcess.killed) {
            this.goProcess.kill("SIGTERM");
            this.goProcess = null;
        }
    }

    _handleIPCEvent(evt) {
        const { event, data } = evt;
        if (event === "response" && data && data.id) {
            const req = this.pendingRequests.get(data.id);
            if (req) {
                if (data.error) {
                    req.reject(new Error(data.error));
                } else {
                    req.resolve(data);
                }
                this.pendingRequests.delete(data.id);
            }
            return;
        }

        if (event === "connection.update") {
            const status = data?.status;
            if (status === "open") {
                this.emit("connection.update", { open: true, ...data });
            } else if (status === "close" || status === "connecting") {
                this.emit("connection.update", { open: false, reason: data?.reason, ...data });
            } else {
                this.emit("connection.update", data);
            }
        } else if (event === "qr") {
            this.emit("qr", data.codes ? data.codes[0] : "");
        } else if (event === "pairing_code") {
            this.emit("pairing_code", data.code);
            for (const [id, req] of this.pendingRequests.entries()) {
                req.resolve({ status: "ok", code: data.code });
                this.pendingRequests.delete(id);
            }
        } else if (event === "error") {
            this.emit("error", data);
            for (const [id, req] of this.pendingRequests.entries()) {
                req.reject(new Error(data.message || data.error || "IPC Error"));
                this.pendingRequests.delete(id);
            }
        } else if (event === "messages.upsert") {
            const baileysFormat = parseToBaileys(data.raw || data);
            this.emit("messages.upsert", baileysFormat);
            this.emit("message", baileysFormat);
            this.emit("raw_message", data);
        }
    }

    _sendCmd(action, payload = {}) {
        return new Promise((resolve, reject) => {
            if (!this.goProcess || this.goProcess.killed) {
                return reject(new Error("Engine Go nozez-whatsmeow belum berjalan. Panggil conn.start() terlebih dahulu."));
            }
            const id = `req_${this.reqIdCounter++}`;
            this.pendingRequests.set(id, { resolve, reject });

            const cmd = JSON.stringify({ action, id, payload });
            this.goProcess.stdin.write(cmd + "\n");
        });
    }

    requestPairingCode(phone) {
        return this._sendCmd("requestPairingCode", { phone });
    }

    sendMessage(jid, content = {}, options = {}) {
        if (!jid) return Promise.reject(new Error("JID tidak boleh kosong"));

        // 1. Reaction Message
        if (content.react) {
            return this._sendCmd("reactMessage", {
                jid,
                key: {
                    id: content.react.key?.id || options.quoted?.key?.id || "",
                    participant: content.react.key?.participant || options.quoted?.key?.participant || ""
                },
                text: content.react.text || ""
            });
        }

        // 2. Text Message
        if (content.text) {
            return this._sendCmd("sendMessage", {
                jid,
                text: content.text,
                quotedId: options.quoted?.key?.id || "",
                quotedSender: options.quoted?.key?.participant || ""
            });
        }

        // 3. Media Messages (image, video, audio, ptt, document, sticker)
        let mediaType = "";
        let mediaData = content.image || content.video || content.audio || content.ptt || content.document || content.sticker;
        let caption = content.caption || "";
        let fileName = content.fileName || "";

        if (content.image) mediaType = "image";
        else if (content.video) mediaType = "video";
        else if (content.audio) mediaType = "audio";
        else if (content.ptt) mediaType = "ptt";
        else if (content.document) mediaType = "document";
        else if (content.sticker) mediaType = "sticker";

        if (mediaType && mediaData) {
            let filePath = "";
            if (typeof mediaData === "string") {
                filePath = mediaData;
            } else if (Buffer.isBuffer(mediaData)) {
                const tmpExt = mediaType === "image" ? ".jpg" : mediaType === "video" ? ".mp4" : mediaType === "audio" || mediaType === "ptt" ? ".mp3" : ".bin";
                const tmpFile = path.join(os.tmpdir(), `media_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${tmpExt}`);
                fs.writeFileSync(tmpFile, mediaData);
                filePath = tmpFile;
            } else if (typeof mediaData === "object" && mediaData.url) {
                filePath = mediaData.url;
            }

            if (filePath) {
                return this._sendCmd("sendMedia", {
                    jid,
                    mediaType,
                    filePath,
                    caption,
                    fileName,
                    quotedId: options.quoted?.key?.id || "",
                    quotedSender: options.quoted?.key?.participant || ""
                });
            }
        }

        return Promise.reject(new Error("Format pesan tidak didukung oleh nozez-whatsmeow"));
    }

    downloadMedia(messageId, outputDir = "./downloads") {
        return this._sendCmd("download_media", { messageId, outputDir });
    }

    async groupMetadata(jid) {
        const res = await this._sendCmd("getGroupMetadata", { jid });
        if (res && res.resp) {
            return res.resp;
        }
        if (res && res.error) {
            throw new Error(res.error);
        }
        return res;
    }

    async groupFetchAllParticipating() {
        return {};
    }

    async groupInviteCode(jid) {
        const res = await this._sendCmd("getGroupInviteLink", { jid });
        if (res && res.resp) {
            return res.resp;
        }
        if (res && res.error) {
            throw new Error(res.error);
        }
        return res;
    }

    async groupParticipantsUpdate(jid, participants, action) {
        const res = await this._sendCmd("updateGroupParticipants", { jid, participants, action });
        if (res && res.resp) {
            return res.resp;
        }
        if (res && res.error) {
            throw new Error(res.error);
        }
        return res;
    }
}

module.exports = { NozezWhatsMeowBridge };
