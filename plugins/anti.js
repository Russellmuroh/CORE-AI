import pkg from '@whiskeysockets/baileys'; const { proto } = pkg; import config from '../config.cjs';

// Global toggle for anti-delete let antiDeleteEnabled = false; const messageCache = new Map();

// Cache all messages (for content recovery) const cacheMessages = (Matrix) => { Matrix.ev.on('messages.upsert', ({ messages }) => { if (!antiDeleteEnabled) return;

messages.forEach(msg => {
        if (msg.key.fromMe || !msg.message) return;
        messageCache.set(msg.key.id, {
            content: msg.message.conversation || 
                    msg.message.extendedTextMessage?.text ||
                    (msg.message.imageMessage ? '[Image]' :
                     msg.message.videoMessage ? '[Video]' :
                     msg.message.audioMessage ? '[Audio]' :
                     '[Media Message]'),
            sender: msg.key.participant || msg.key.remoteJid,
            timestamp: new Date().toLocaleTimeString(),
            chatJid: msg.key.remoteJid
        });
    });
});

};

// Handle message deletions globally when enabled const handleDeletedMessages = (Matrix) => { Matrix.ev.on('messages.update', async (update) => { if (!antiDeleteEnabled) return;

try {
        for (const item of update) {
            const { key, update: { message: deletedMessage } } = item;
            if (key.fromMe) continue;
            
            const cachedMsg = messageCache.get(key.id);
            if (!cachedMsg) continue;

            const sender = cachedMsg.sender.split('@')[0];
            const chatName = key.remoteJid.endsWith('@g.us') 
                ? (await Matrix.groupMetadata(key.remoteJid).catch(() => ({ subject: 'Group Chat' }))).subject
                : 'Private Chat';

            await Matrix.sendMessage(key.remoteJid, { 
                text: `╭━━━〔 *CLOUD AI DELETED MESSAGES* 〕━━━┈⊷

┃▸╭─────────── ┃▸┃๏ DELETION ALERT ┃▸└───────────···๏ ╰────────────────┈⊷ ╭━━〔 Context 〕━━┈⊷ ┇๏ Chat: ${chatName} ┇๏ Sender: @${sender} ┇๏ Deleted At: ${new Date().toLocaleTimeString()} ╰━━━━━━━━━━━━──┈⊷ ╭━━〔 Original Message 〕━━┈⊷ ┇๏ ${cachedMsg.content} ╰━━━━━━━━━━━━──┈⊷

> © CLOUD AI`, mentions: [cachedMsg.sender] });



messageCache.delete(key.id);
        }
    } catch (error) {
        console.error('Anti-Delete Handler Error:', error);
    }
});

};

const AntiDelete = async (m, Matrix) => { const text = m.body.trim().toLowerCase();

// Handle anti-delete toggle commands (without prefix)
if (text === 'antidelete on') {
    antiDeleteEnabled = true;
    await m.reply(`╭━━━〔 *CLOUD AI DELETED MESSAGES* 〕━━━┈⊷

┃▸╭─────────── ┃▸┃๏ GLOBAL ACTIVATION ┃▸└───────────···๏ ╰────────────────┈⊷ Anti-delete protection is now ACTIVE in: ✦ All Groups ✦ Private Chats ✦ Every conversation

> © CLOUD AI); await m.React('✅'); } else if (text === 'antidelete off') { antiDeleteEnabled = false; messageCache.clear(); await m.reply(╭━━━〔 CLOUD AI DELETED MESSAGES 〕━━━┈⊷ ┃▸╭─────────── ┃▸┃๏ GLOBAL DEACTIVATION ┃▸└───────────···๏ ╰────────────────┈⊷ Anti-delete protection is now DISABLED everywhere.



> © CLOUD AI`); await m.React('✅'); } };



export default (Matrix) => { cacheMessages(Matrix); handleDeletedMessages(Matrix); return AntiDelete; };

            
