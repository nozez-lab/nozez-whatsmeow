// Nozez Was Here: Entry point for nozez-whatsmeow

import { NozezWhatsMeowBridge } from "./bridge.js";
import { chatLog } from "./chatlog.js";
import {
    extractNumber,
    isLid,
    isGroup,
    jidNormalizedUser,
    getContentType,
    areJidsSameUser,
    delay,
    downloadContentFromMessage,
    generateWAMessageFromContent,
    generateForwardMessageContent,
    proto
} from "./utils.js";

export function makeWASocket(options = {}) {
    const bridge = new NozezWhatsMeowBridge(options);

    return {
        ev: bridge,
        user: bridge.user || { id: "bot@s.whatsapp.net", name: "Nozez WhatsMeow" },
        ws: { isOpen: true },
        authState: { creds: { registered: true } },
        groupMetadataCache: new Map(),
        signalRepository: {
            lidMapping: {
                mappingCache: new Map(),
                getPNForLID: async () => null
            }
        },
        start: () => bridge.start(),
        stop: () => bridge.stop(),
        end: () => bridge.stop(),
        logout: () => bridge.logout(),
        isAlive: () => bridge.isAlive(),
        query: async () => ({}),
        requestPairingCode: (phone) => bridge.requestPairingCode(phone),
        sendMessage: (jid, content, options) => bridge.sendMessage(jid, content, options),
        downloadMedia: (messageId, outputDir) => bridge.downloadMedia(messageId, outputDir),
        downloadMediaMessage: (msg, type, options) => bridge.downloadMediaMessage(msg, type, options),
        groupMetadata: (jid) => bridge.groupMetadata(jid),
        groupFetchAllParticipating: () => bridge.groupFetchAllParticipating(),
        groupInviteCode: (jid) => bridge.groupInviteCode(jid),
        groupRevokeInvite: (jid) => bridge.groupRevokeInvite(jid),
        groupParticipantsUpdate: (jid, participants, action) => bridge.groupParticipantsUpdate(jid, participants, action),
        groupSettingUpdate: (jid, setting) => bridge.groupSettingUpdate(jid, setting),
        groupUpdateSubject: (jid, subject) => bridge.groupUpdateSubject(jid, subject),
        groupUpdateDescription: (jid, description) => bridge.groupUpdateDescription(jid, description),
        groupLeave: (jid) => bridge.groupLeave(jid),
        groupCreate: (subject, participants) => bridge.groupCreate(subject, participants),
        groupAcceptInvite: (code) => bridge.groupAcceptInvite(code),
        updateBlockStatus: (jid, status) => bridge.updateBlockStatus(jid, status),
        profilePictureUrl: (jid, type) => bridge.profilePictureUrl(jid, type),
        sendPresenceUpdate: (presence, jid) => bridge.sendPresenceUpdate(presence, jid),
        updateProfileStatus: (status) => bridge.updateProfileStatus(status),
        readMessages: (keys) => bridge.readMessages(keys),
        chatModify: (mod, jid) => bridge.chatModify(mod, jid),
        fetchPrivacySettings: () => bridge.fetchPrivacySettings(),
        getBusinessProfile: (jid) => bridge.getBusinessProfile(jid),
    };
}

export default makeWASocket;

export {
    chatLog,
    extractNumber,
    isLid,
    isGroup,
    jidNormalizedUser,
    getContentType,
    areJidsSameUser,
    delay,
    downloadContentFromMessage,
    generateWAMessageFromContent,
    generateForwardMessageContent,
    proto
};
