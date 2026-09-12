// Nozez Was Here: Utilities for nozez-whatsmeow

export function extractNumber(jid) {
    if (!jid) return "";
    return jid.replace(/[^0-9]/g, "");
}

export function isLid(jid) {
    return jid ? jid.endsWith("@lid") : false;
}

export function isGroup(jid) {
    return jid ? jid.endsWith("@g.us") : false;
}

export function jidNormalizedUser(jid) {
    if (!jid) return "";
    if (jid.includes("@")) {
        const [user, domain] = jid.split("@");
        return `${user.split(":")[0]}@${domain}`;
    }
    return jid;
}

export function getContentType(content) {
    if (!content) return undefined;
    const keys = Object.keys(content);
    const key = keys.find(k => (k === 'conversation' || k.endsWith('Message')) && k !== 'senderKeyDistributionMessage');
    return key;
}

export function areJidsSameUser(jid1, jid2) {
    return jidNormalizedUser(jid1) === jidNormalizedUser(jid2);
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function downloadContentFromMessage(msg, type) {
    if (msg && msg.file) {
        const fs = await import("fs");
        return fs.createReadStream(msg.file);
    }
    return null;
}

export function generateWAMessageFromContent(jid, message, options = {}) {
    const id = options.messageId || `3EB0${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    return {
        key: {
            remoteJid: jid,
            fromMe: true,
            id: id,
            participant: options.userJid || undefined
        },
        message: message,
        messageTimestamp: timestamp,
        status: "PENDING"
    };
}

export function generateForwardMessageContent(msg, force = false) {
    if (!msg || !msg.message) return null;
    return msg.message;
}

export const proto = {
    WebMessageInfo: {
        encode: () => ({ finish: () => Buffer.from([]) }),
        decode: () => ({})
    }
};
