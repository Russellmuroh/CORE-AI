import pkg from '@whiskeysockets/baileys';
const { proto, downloadMediaMessage } = pkg;
import config from '../../config.cjs';

// Global toggle for anti-delete
let antiDeleteEnabled = false;
const messageCache = new Map();
// Set to track message IDs that have been processed already
const processedDeletions = new Set();

const AntiDelete = async (m, Matrix) => {
    const text = m.body.trim().split(' ');
    const cmd = text[0]?.toLowerCase();
    const subCmd = text[1]?.toLowerCase();

    // Cache all messages (for content recovery)
    Matrix.ev.on('messages.upsert', async ({ messages }) => {
        if (!antiDeleteEnabled) return;

        for (const msg of messages) {
            if (msg.key.fromMe || !msg.message) continue;

            let content = msg.message.conversation ||
                          msg.message.extendedTextMessage?.text ||
                          '[Media Message]';

            let mediaType = null;
            let buffer = null;
            let mimetype = null;

            if (msg.message.imageMessage) {
                mediaType = 'image';
                mimetype = msg.message.imageMessage.mimetype;
            } else if (msg.message.videoMessage) {
                mediaType = 'video';
                mimetype = msg.message.videoMessage.mimetype;
            } else if (msg.message.audioMessage) {
                mediaType = 'audio';
                mimetype = msg.message.audioMessage.mimetype;
            } else if (msg.message.documentMessage) {
                mediaType = 'document';
                mimetype = msg.message.documentMessage.mimetype;
            } else if (msg.message.stickerMessage) {
                mediaType = 'sticker';
            }

            // If it's a media message, download and store it
            if (mediaType) {
                try {
                    buffer = await downloadMediaMessage(msg, 'buffer');
                    content = { type: mediaType, buffer, mimetype };
                } catch (err) {
                    console.error('Error downloading media:', err);
                }
            }

            messageCache.set(msg.key.id, {
                content,
                sender: msg.key.participant || msg.key.remoteJid,
                timestamp: new Date().getTime(),
                chatJid: msg.key.remoteJid
            });
        }
    });

    // Handle anti-delete commands
    if (cmd === 'antidelete') {
        try {
            if (subCmd === 'on') {
                antiDeleteEnabled = true;
                await m.reply(`✅ *Anti-Delete Activated!*`);
                await m.React('✅');
            } 
            else if (subCmd === 'off') {
                antiDeleteEnabled = false;
                messageCache.clear();
                processedDeletions.clear();
                await m.reply(`❌ *Anti-Delete Deactivated!*`);
                await m.React('✅');
            }
            else {
                await m.reply(`🔹 *Anti-Delete Status:* ${antiDeleteEnabled ? '✅ ON' : '❌ OFF'} 🔹`);
                await m.React('ℹ️');
            }
            return;
        } catch (error) {
            console.error('AntiDelete Command Error:', error);
            await m.React('❌');
        }
    }

    // Handle message deletions globally when enabled
    Matrix.ev.on('messages.update', async (update) => {
        if (!antiDeleteEnabled) return;

        for (const item of update) {
            const { key } = item;
            // Skip if already processed or sent by self
            if (processedDeletions.has(key.id) || key.fromMe) continue;

            const cachedMsg = messageCache.get(key.id);
            if (!cachedMsg) continue;

            try {
                // If it's a media message, send it as media
                if (cachedMsg.content?.type) {
                    const mediaType = cachedMsg.content.type;
                    const mediaBuffer = cachedMsg.content.buffer;
                    const mimetype = cachedMsg.content.mimetype;

                    let messageOptions = {};

                    if (mediaType === 'image') {
                        messageOptions.image = mediaBuffer;
                        messageOptions.caption = `📸 *Deleted Image Recovered.Regards Bera*`;
                    } else if (mediaType === 'video') {
                        messageOptions.video = mediaBuffer;
                        messageOptions.mimetype = mimetype;
                        messageOptions.caption = `🎥 *Deleted Video Recovered.Regards Bera*`;
                    } else if (mediaType === 'audio') {
                        messageOptions.audio = mediaBuffer;
                        messageOptions.mimetype = mimetype || 'audio/mp4';
                        messageOptions.ptt = true;
                    } else if (mediaType === 'document') {
                        messageOptions.document = mediaBuffer;
                        messageOptions.mimetype = mimetype;
                        messageOptions.caption = `📄 *Deleted Document Recovered.Regards Bera*`;
                    } else if (mediaType === 'sticker') {
                        messageOptions.sticker = mediaBuffer;
                    }

                    await Matrix.sendMessage(key.remoteJid, messageOptions);
                } else {
                    await Matrix.sendMessage(key.remoteJid, { 
                        text: `🛑 *Deleted Message:* \n\n${cachedMsg.content}`
                    });
                }
                // Mark as processed and remove from cache
                processedDeletions.add(key.id);
                messageCache.delete(key.id);
            } catch (error) {
                console.error('Error processing deletion:', error);
            }
        }
    });

    // Cache Cleanup: Remove expired messages (5-minute expiration)
    setInterval(() => {
        const now = Date.now();
        messageCache.forEach((msg, key) => {
            if (now - msg.timestamp > 300000) {  // 5-minute expiration time
                messageCache.delete(key);
            }
        });
        // Optionally clear processedDeletions if you want to allow re-processing of very old deletions
        processedDeletions.forEach((id) => {
            // Remove IDs older than 5 minutes if needed
            // In this simple example, we clear the entire set periodically
            processedDeletions.clear();
        });
    }, 60000);
};

export default AntiDelete;
