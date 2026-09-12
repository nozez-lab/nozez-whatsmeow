// Nozez Was Here: Chat Logger for nozez-whatsmeow

export function chatLog(data) {
    const time = new Date().toLocaleTimeString("id-ID", { hour12: false });
    const pushName = data.pushname || data.pushName || "User";
    const sender = data.senderJid ? data.senderJid.split("@")[0] : "";
    const isGroupMsg = data.chat ? data.chat.endsWith("@g.us") : false;

    const badge = "\x1b[41m\x1b[37m NOZEZ-WHATSMEOW \x1b[0m";
    const timeStr = `\x1b[90m[${time}]\x1b[0m`;
    const senderStr = `\x1b[36m${pushName}\x1b[0m \x1b[90m(${sender})\x1b[0m`;
    const typeStr = `\x1b[33m[${data.msgType || "Chat"}]\x1b[0m`;
    const bodyStr = data.body || "";

    if (isGroupMsg) {
        const groupStr = `\x1b[35m[Group: ${data.chat.split("@")[0]}]\x1b[0m`;
        console.log(`${badge} ${timeStr} ${groupStr} ${senderStr} ${typeStr}: ${bodyStr}`);
    } else {
        console.log(`${badge} ${timeStr} ${senderStr} ${typeStr}: ${bodyStr}`);
    }
}
