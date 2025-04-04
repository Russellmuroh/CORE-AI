import pkg from '@whiskeysockets/baileys'; const { proto, downloadContentFromMessage } = pkg; import config from '../../config.cjs';

class AntiDeleteSystem { constructor() { this.enabled = false; this.messageCache = new Map(); this.cacheExpiry = 5 * 60 * 1000; // 5 minutes this.cleanupInterval = setInterval(() => this.cleanExpiredMessages(), this.cacheExpiry); }

cleanExpiredMessages() {
    const now = Date.now();
    for (const [key, msg] of this.messageCache.entries()) {
        if (now - msg.timestamp > this.cacheExpiry) {
            this.messageCache.delete(key);
        }
    }
}

formatTime(timestamp) {
    const options = {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    return new Date(timestamp).toLocaleString('en-PK', options) + ' (PKT)';
}

destroy() {
    clearInterval(this.cleanupInterval);
}

}

const antiDelete = new AntiDeleteSystem();

const AntiDelete = async (m, Matrix) => { const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net'; const text = m.body?.trim().split(' ') || []; const cmd = text[0]?.toLowerCase(); const subCmd = text[1]?.toLowerCase();

const formatJid = (jid) => jid ? jid.replace(/@s\.whatsapp\.net|@g\.us/g, '') : 'Unknown';

const getChatInfo = async (jid) => {
    if (!jid) return { name: 'Unknown Chat', isGroup: false };
    
    if (jid.includes('@g.us')) {
        try {
            const groupMetadata = await Matrix.groupMetadata(jid);
            return {
                name: groupMetadata?.subject || 'Unknown Group',
                isGroup: true
            };
        } catch {
            return { name: 'Unknown Group', isGroup: true };
        }
    }
    return { name: 'Private Chat', isGroup: false };
};

if (cmd === 'antidelete') {
    if (m.sender !== ownerJid) {
        await m.reply('🚫 *You are not authorized to use this command!*');
        return;
    }
    
    try {
        const mode = config.DELETE_PATH === "same" ? "Same Chat" : "Owner PM";
        const responses = {
            on: `🛡️ *ANTI-DELETE ENABLED* 🛡️\n\n🔹 Protection: *ACTIVE*\n🔹 Scope: *All Chats*\n🔹 Cache: *5 minutes*\n🔹 Mode: *${mode}*\n\n✅ Deleted messages will be recovered!`,
            off: `⚠️ *ANTI-DELETE DISABLED* ⚠️\n\n🔸 Protection: *OFF*\n🔸 Cache cleared\n🔸 Deleted messages will not be recovered.`,
            help: `⚙️ *ANTI-DELETE SETTINGS* ⚙️\n\n🔹 *antidelete on* - Enable\n🔸 *antidelete off* - Disable\n\nCurrent Status: ${antiDelete.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}\nCurrent Mode: ${mode}`
        };

        if (subCmd === 'on') {
            antiDelete.enabled = true;
            await m.reply(responses.on);
        } 
        else if (subCmd === 'off') {
            antiDelete.enabled = false;
            antiDelete.messageCache.clear();
            await m.reply(responses.off);
        }
        else {
            await m.reply(responses.help);
        }
        await m.React('✅');
        return;
    } catch (error) {
        console.error('AntiDelete Command Error:', error);
        await m.React('❌');
    }
}

};

export default AntiDelete;

