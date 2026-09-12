// Nozez Was Here: CJS Entry point for nozez-whatsmeow

const { NozezWhatsMeowBridge } = require("./bridge.cjs");
const { chatLog } = require("./chatlog.cjs");
const { extractNumber, isLid, isGroup, jidNormalizedUser } = require("./utils.cjs");

function makeWASocket(options = {}) {
    const bridge = new NozezWhatsMeowBridge(options);

    return {
        ev: bridge,
        start: () => bridge.start(),
        stop: () => bridge.stop(),
        end: () => bridge.stop(),
        requestPairingCode: (phone) => bridge.requestPairingCode(phone),
        sendMessage: (jid, content, options) => bridge.sendMessage(jid, content, options),
        downloadMedia: (messageId, outputDir) => bridge.downloadMedia(messageId, outputDir)
    };
}

module.exports = {
    makeWASocket,
    chatLog,
    extractNumber,
    isLid,
    isGroup,
    jidNormalizedUser
};
