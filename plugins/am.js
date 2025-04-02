import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import fs from 'fs';
import config from './config.cjs';

let antiDeleteEnabled = false;
const messageCache = new Map();

const saveConfig = () => {
    fs.writeFileSync('./config.cjs', `export default ${JSON.stringify(config, null, 2)};`);
};

export async function startBot() {
    // Use the existing auth_info directory to maintain session
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // No QR code printing
        version
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
                const chatId = msg.key.remoteJid;
                const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text;

                // Cache all messages (for content recovery)
                messageCache.set(msg.key.id, {
                    content: messageText || '[Media Message]',
                    sender: msg.key.participant || msg.key.remoteJid,
                    timestamp: new Date().toLocaleTimeString(),
                    chatJid: chatId
                });

                if (messageText) {
                    if (messageText.toLowerCase() === 'antidelete on') {
                        antiDeleteEnabled = true;
                        saveConfig();
                        await sock.sendMessage(chatId, { text: '✅ Anti-delete protection is now ACTIVE!' });
                    } else if (messageText.toLowerCase() === 'antidelete off') {
                        antiDeleteEnabled = false;
                        messageCache.clear();
                        saveConfig();
                        await sock.sendMessage(chatId, { text: '❌ Anti-delete protection is now INACTIVE!' });
                    }
                }
            }
        }
    });

    sock.ev.on('messages.update', async (updates) => {
        if (!antiDeleteEnabled) return;

        for (const update of updates) {
            const { key } = update;
            if (key.fromMe) continue;

            const cachedMsg = messageCache.get(key.id);
            if (!cachedMsg) continue;

            const sender = cachedMsg.sender.split('@')[0];
            const chatName = key.remoteJid.endsWith('@g.us')
                ? (await sock.groupMetadata(key.remoteJid).catch(() => ({ subject: 'Group Chat' }))).subject
                : 'Private Chat';

            await sock.sendMessage(key.remoteJid, {
                text: `🔄 RESTORED MESSAGE:\n📌 *Chat:* ${chatName}\n👤 *Sender:* @${sender}\n⏳ *Deleted At:* ${new Date().toLocaleTimeString()}\n💬 *Message:* ${cachedMsg.content}`,
                mentions: [cachedMsg.sender]
            });

            messageCache.delete(key.id);
        }
    });
}

export default startBot;
