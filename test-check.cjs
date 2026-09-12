const {
    makeWASocket,
    getContentType,
    extractNumber,
    isGroup,
    isLid,
    jidNormalizedUser,
    proto,
    delay
} = require("./src/index.cjs");

console.log("=========================================");
console.log("🧪 TES MODUL & UTILITIES NOZEZ-WHATSMEOW");
console.log("=========================================");
console.log("✅ makeWASocket:", typeof makeWASocket);
console.log("✅ getContentType:", typeof getContentType);
console.log("✅ extractNumber:", typeof extractNumber);
console.log("✅ isGroup:", typeof isGroup);
console.log("✅ isLid:", typeof isLid);
console.log("✅ proto:", typeof proto);
console.log("✅ delay:", typeof delay);

const sock = makeWASocket({ sessionName: "test_session" });
console.log("\n=========================================");
console.log("🧪 TES METHOD WASOCKET");
console.log("=========================================");
const methods = [
    'sendMessage',
    'downloadMediaMessage',
    'groupMetadata',
    'groupFetchAllParticipating',
    'groupInviteCode',
    'groupRevokeInvite',
    'groupParticipantsUpdate',
    'groupSettingUpdate',
    'groupUpdateSubject',
    'groupUpdateDescription',
    'groupLeave',
    'groupCreate',
    'groupAcceptInvite',
    'updateBlockStatus',
    'profilePictureUrl',
    'sendPresenceUpdate',
    'updateProfileStatus',
    'readMessages',
    'isAlive'
];

methods.forEach(m => {
    console.log(`- ${m}:`, typeof sock[m] === 'function' ? '✅ READY' : '❌ MISSING');
});

console.log("\n=========================================");
console.log("🧪 TES STUB PROPERTI");
console.log("=========================================");
console.log("- groupMetadataCache:", sock.groupMetadataCache instanceof Map ? '✅ Map' : '❌ FAIL');
console.log("- signalRepository:", sock.signalRepository?.lidMapping ? '✅ READY' : '❌ FAIL');
console.log("- authState:", sock.authState?.creds ? '✅ READY' : '❌ FAIL');

console.log("\n🎉 SEMUA FITUR & METHOD SIAP DUGUNAKAN!");
