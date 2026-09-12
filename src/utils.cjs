// Nozez Was Here: CJS Utilities for nozez-whatsmeow

function extractNumber(jid) {
    if (!jid) return "";
    return jid.replace(/[^0-9]/g, "");
}

function isLid(jid) {
    return jid ? jid.endsWith("@lid") : false;
}

function isGroup(jid) {
    return jid ? jid.endsWith("@g.us") : false;
}

function jidNormalizedUser(jid) {
    if (!jid) return "";
    if (jid.includes("@")) {
        const [user, domain] = jid.split("@");
        return `${user.split(":")[0]}@${domain}`;
    }
    return jid;
}

function getContentType(content) {
    if (!content) return undefined;
    const keys = Object.keys(content);
    const key = keys.find(k => (k === 'conversation' || k.endsWith('Message')) && k !== 'senderKeyDistributionMessage');
    return key;
}

module.exports = {
    extractNumber,
    isLid,
    isGroup,
    jidNormalizedUser,
    getContentType
};
