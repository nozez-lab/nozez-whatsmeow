// Nozez Was Here: CJS Parser for nozez-whatsmeow

function parseToBaileys(raw) {
    const isGroup = raw.chat ? raw.chat.endsWith("@g.us") : false;

    return {
        messages: [
            {
                key: {
                    remoteJid: raw.chat,
                    fromMe: raw.isFromMe,
                    id: raw.id,
                    participant: isGroup ? raw.senderJid : undefined,
                },
                messageTimestamp: raw.timestamp,
                pushName: raw.pushName,
            }
        ]
    };
}

module.exports = { parseToBaileys };
