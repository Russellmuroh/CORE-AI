import pkg from '@whiskeysockets/baileys';
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, jidDecode } = pkg;
import config from '../../config.cjs';

const AntiDelete = async (Matrix) => {
  // Detect deleted messages
  Matrix.ev.on('messages.update', async (updates) => {
    for (let update of updates) {
      if (update.key && update.key.fromMe) return; // Ignore bot's own messages
      if (update.update == 'delete') {
        const jid = update.key.remoteJid;
        const msgId = update.key.id;

        try {
          // Retrieve the deleted message
          const msg = await Matrix.loadMessage(jid, msgId);

          if (msg) {
            // Send back the deleted message to the chat
            await Matrix.sendMessage(jid, {
              text: `🚨 *Anti-Delete Triggered* 🚨\nThe following message was deleted:\n\n*${msg.text || "Media Content"}*`,
            });

            if (msg.message) {
              // If there was media, resend the media as well
              if (msg.message.imageMessage) {
                await Matrix.sendMessage(jid, {
                  image: { url: msg.message.imageMessage.url },
                  caption: 'This image was deleted.',
                });
              } else if (msg.message.videoMessage) {
                await Matrix.sendMessage(jid, {
                  video: { url: msg.message.videoMessage.url },
                  caption: 'This video was deleted.',
                });
              } else if (msg.message.documentMessage) {
                await Matrix.sendMessage(jid, {
                  document: { url: msg.message.documentMessage.url },
                  caption: 'This document was deleted.',
                });
              }
            }
          }
        } catch (e) {
          console.error(`Failed to retrieve deleted message:`, e);
        }
      }
    }
  });

  // Listen for the toggle command (antidelete on/off)
  Matrix.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg || !msg.key || msg.key.fromMe) return; // Ignore if message is from the bot

    // Make sure it's a command like "antidelete on" or "antidelete off"
    const text = msg.message.conversation || '';
    if (text.toLowerCase() === 'antidelete on') {
      // Enable Anti-Delete
      config.AUTO_ANTI_DELETE = true;
      await Matrix.sendMessage(msg.key.remoteJid, { text: 'Anti-Delete is now *enabled*.' });
    } else if (text.toLowerCase() === 'antidelete off') {
      // Disable Anti-Delete
      config.AUTO_ANTI_DELETE = false;
      await Matrix.sendMessage(msg.key.remoteJid, { text: 'Anti-Delete is now *disabled*.' });
    }
  });
};

export default AntiDelete;
