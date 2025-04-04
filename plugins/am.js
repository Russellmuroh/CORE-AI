import pkg from '@whiskeysockets/baileys';
const { proto, downloadContentFromMessage } = pkg;
import config from '../../config.cjs';

class AntiDeleteSystem {
    constructor() {
        this.enabled = true;
        this.messageCache = new Map();
        this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
        this.cleanupInterval = setInterval(() => this.cleanExpiredMessages(), this.cacheExpiry);
    }

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
            timeZone: 'Africa/Nairobi',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        return new Date(timestamp).toLocaleString('en-KE', options) + ' (EAT)';
    }

    destroy() {
        clearInterval(this.cleanupInterval);
    }
}

const antiDelete = new AntiDeleteSystem();

const AntiDelete = async (m, Matrix) => {
    const botJid = Matrix.user.id; // Get the bot's own WhatsApp ID
    const text = m.body?.trim().split(' ') || [];
    const cmd = text[0]?.toLowerCase();
    const subCmd = text[1]?.toLowerCase();

    if (cmd === 'antidelete') {
        if (m.sender.trim() !== botJid.trim()) {
            await m.reply('🚫 *Only the bot user can enable or disable this feature!*');
            return;
        }

        try {
            if (subCmd === 'on') {
                antiDelete.enabled = true;
                await m.reply(`😈 *CLOUD AI ANTIDELETE ENABLED* 😈\n\n🔹 Protection: *ACTIVE*\n🔹 Deleted messages will be recovered!`);
            } 
            else if (subCmd === 'off') {
                antiDelete.enabled = false;
                antiDelete.messageCache.clear();
                await m.reply(`⚠️ *CLOUD AI ANTIDELETE DISABLED* ⚠️\n\n🔸 Deleted messages will not be recovered.`);
            }
            else {
                await m.reply(`⚙️ *CLOUD AI ANTIDELETE SETTINGS* ⚙️\n\n🔹 *antidelete on* - Enable\n🔸 *antidelete off* - Disable\n\nStatus: ${antiDelete.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}`);
            }
            await m.React('✅');
            return;
        } catch (error) {
            console.error('❌ AntiDelete Command Error:', error);
            await m.React('❌');
        }
    }
};

const handleDelete = async (m, Matrix) => {
    if (!antiDelete.enabled) return;

    const messageData = antiDelete.messageCache.get(m.key.id);
    if (!messageData) return;

    const timeDeleted = antiDelete.formatTime(Date.now());
    const deletedBy = m.sender ? `@${m.sender.split('@')[0]}` : 'Unknown';
    const messageText = messageData.text || 'Media file';

    const recoveryMessage = `😈 *CLOUD AI ANTIDELETE* 😈\n\n🕒 *Time deleted* 🎤: ${timeDeleted}\n🗑️ *Deleted by* 🌷: ${deletedBy}\n\n*Powered by BERA*\n\n📩 *Message:* ${messageText}`;

    await Matrix.sendMessage(m.key.remoteJid, { text: recoveryMessage }, { quoted: m });

    antiDelete.messageCache.delete(m.key.id);
};

export { AntiDelete, handleDelete };
