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
