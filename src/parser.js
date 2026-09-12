// Nozez Was Here: Message Parser for nozez-whatsmeow

export function parseToBaileys(raw) {
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
