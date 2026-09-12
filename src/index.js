// Nozez Was Here: Entry point for nozez-whatsmeow

import { NozezWhatsMeowBridge } from "./bridge.js";
import { chatLog } from "./chatlog.js";
import { extractNumber, isLid, isGroup, jidNormalizedUser, getContentType } from "./utils.js";

export function makeWASocket(options = {}) {
    const bridge = new NozezWhatsMeowBridge(options);

    return {
        ev: bridge,
        start: () => bridge.start(),
        stop: () => bridge.stop(),
        end: () => bridge.stop(),
        requestPairingCode: (phone) => bridge.requestPairingCode(phone),
        sendMessage: (jid, content, options) => bridge.sendMessage(jid, content, options),
        downloadMedia: (messageId, outputDir) => bridge.downloadMedia(messageId, outputDir),
        groupMetadata: (jid) => bridge.groupMetadata(jid),
        groupFetchAllParticipating: () => bridge.groupFetchAllParticipating(),
        groupInviteCode: (jid) => bridge.groupInviteCode(jid),
        groupParticipantsUpdate: (jid, participants, action) => bridge.groupParticipantsUpdate(jid, participants, action),
    };
}

export { chatLog, extractNumber, isLid, isGroup, jidNormalizedUser, getContentType };
