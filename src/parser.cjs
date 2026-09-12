// Nozez Was Here: CJS Parser for nozez-whatsmeow

function parseToBaileys(raw) {
    if (!raw) return { type: 'notify', messages: [] };

    const item = raw.raw || raw;
    const isGroup = item.chat ? item.chat.endsWith("@g.us") : false;
    const bodyText = item.body || item.text || '';
    const msgType = item.type || 'Chat';

    let messageObj = {};
    if (msgType === 'Image' || msgType === 'image') {
        messageObj = {
            imageMessage: {
                caption: bodyText,
                url: item.mediaUrl || '',
            }
        };
    } else if (msgType === 'Video' || msgType === 'video') {
        messageObj = {
            videoMessage: {
                caption: bodyText,
                url: item.mediaUrl || '',
            }
        };
    } else if (msgType === 'Audio' || msgType === 'audio' || msgType === 'sound' || msgType === 'ptt') {
        messageObj = {
            audioMessage: {
                url: item.mediaUrl || '',
                ptt: msgType === 'ptt'
            }
        };
    } else if (msgType === 'Sticker' || msgType === 'sticker') {
        messageObj = {
            stickerMessage: {
                url: item.mediaUrl || '',
            }
        };
    } else if (msgType === 'Document' || msgType === 'document') {
        messageObj = {
            documentMessage: {
                caption: bodyText,
                url: item.mediaUrl || '',
            }
        };
    } else {
        if (item.quotedId) {
            messageObj = {
                extendedTextMessage: {
                    text: bodyText,
                    contextInfo: {
                        stanzaId: item.quotedId,
                        participant: item.quotedSender
                    }
                }
            };
        } else {
            messageObj = {
                conversation: bodyText,
                extendedTextMessage: {
                    text: bodyText
                }
            };
        }
    }

    return {
        type: 'notify',
        messages: [
            {
                key: {
                    remoteJid: item.chat,
                    fromMe: !!item.isFromMe,
                    id: item.id,
                    participant: isGroup ? (item.senderJid || item.sender) : undefined,
                },
                messageTimestamp: item.timestamp || Math.floor(Date.now() / 1000),
                pushName: item.pushName || '',
                message: messageObj
            }
        ]
    };
}

module.exports = { parseToBaileys };
