import fs from 'fs';
import pkg from '@whiskeysockets/baileys';
const { proto, downloadContentFromMessage } = pkg;
import config from '../../config.cjs';

class AntiDeleteSystem {
  constructor() {
    this.enabled = false;
    this.messageCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
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
const statusPath = './antidelete_status.json';

let statusData = {};
if (fs.existsSync(statusPath)) {
  statusData = JSON.parse(fs.readFileSync(statusPath));
}
if (!statusData.chats) statusData.chats = {};

const AntiDelete = async (m, Matrix) => {
  const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
  const botJid = Matrix.user.id;
  const chatId = m.from;

  const isBotUser = m.sender?.replace(/[^0-9]/g, '') === botJid?.replace(/[^0-9]/g, '');
  const isOwner = m.sender?.replace(/[^0-9]/g, '') === ownerJid?.replace(/[^0-9]/g, '');

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

  // Toggle AntiDelete on/off
  if (m.body.toLowerCase() === 'antidelete on' || m.body.toLowerCase() === 'antidelete off') {
    if (!isBotUser && !isOwner) {
      await m.reply('🚫 *You are not authorized to use this command!*');
      return;
    }

    const mode = config.DELETE_PATH === "same" ? "Same Chat" : "Owner PM";
    const responses = {
      on: `🛡️ *ANTI-DELETE ENABLED* 🛡️\n\n🔹 Protection: *ACTIVE*\n🔹 Scope: *All Chats*\n🔹 Cache: *5 minutes*\n🔹 Mode: *${mode}*\n\n✅ Deleted messages will be recovered!`,
      off: `⚠️ *ANTI-DELETE DISABLED* ⚠️\n\n🔸 Protection: *OFF*\n🔸 Cache cleared\n🔸 Deleted messages will not be recovered.`
    };

    if (m.body.toLowerCase() === 'antidelete on') {
      statusData.chats[chatId] = true;
      fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));
      antiDelete.enabled = true;
      await m.reply(responses.on);
    } else {
      statusData.chats[chatId] = false;
      fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));
      antiDelete.enabled = false;
      antiDelete.messageCache.clear();
      await m.reply(responses.off);
    }

    await m.React('✅');
    return;
  }

  // Cache messages
  Matrix.ev.on('messages.upsert', async ({ messages }) => {
    if (!antiDelete.enabled || !messages?.length) return;

    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message || msg.key.remoteJid === 'status@broadcast') continue;

      try {
        const content = msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          msg.message.documentMessage?.caption;

        let media, type, mimetype;

        const mediaTypes = ['image', 'video', 'audio', 'sticker', 'document'];
        for (const mediaType of mediaTypes) {
          if (msg.message[`${mediaType}Message`]) {
            const mediaMsg = msg.message[`${mediaType}Message`];
            try {
              const stream = await downloadContentFromMessage(mediaMsg, mediaType);
              let buffer = Buffer.from([]);
              for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
              }
              media = buffer;
              type = mediaType;
              mimetype = mediaMsg.mimetype;
              break;
            } catch (e) {
              console.error(`Error downloading ${mediaType} media:`, e);
            }
          }
        }

        // Voice note check
        if (msg.message.audioMessage?.ptt) {
          try {
            const stream = await downloadContentFromMessage(msg.message.audioMessage, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }
            media = buffer;
            type = 'voice';
            mimetype = msg.message.audioMessage.mimetype;
          } catch (e) {
            console.error('Error downloading voice message:', e);
          }
        }

        if (content || media) {
          antiDelete.messageCache.set(msg.key.id, {
            content,
            media,
            type,
            mimetype,
            sender: msg.key.participant || msg.key.remoteJid,
            senderFormatted: `@${formatJid(msg.key.participant || msg.key.remoteJid)}`,
            timestamp: Date.now(),
            chatJid: msg.key.remoteJid
          });
        }
      } catch (error) {
        console.error('Error caching message:', error);
      }
    }
  });

  // Restore deleted message
  Matrix.ev.on('messages.update', async (updates) => {
    if (!antiDelete.enabled || !updates?.length) return;

    for (const update of updates) {
      try {
        const { key, update: updateData } = update;
        const isDeleted = updateData?.messageStubType === proto.WebMessageInfo.StubType.REVOKE ||
          updateData?.status === proto.WebMessageInfo.Status.DELETED;

        if (!isDeleted || key.fromMe || !antiDelete.messageCache.has(key.id)) continue;

        const cachedMsg = antiDelete.messageCache.get(key.id);
        antiDelete.messageCache.delete(key.id);

        const chatInfo = await getChatInfo(cachedMsg.chatJid);

        const deletedBy = updateData?.participant ?
          `@${formatJid(updateData.participant)}` :
          (key.participant ? `@${formatJid(key.participant)}` : 'Unknown');

        const messageType = cachedMsg.type ?
          cachedMsg.type.charAt(0).toUpperCase() + cachedMsg.type.slice(1) :
          'Text';

        const baseInfo = `🚨 *Deleted ${messageType} Recovered!*\n\n` +
          `📌 *Sender:* ${cachedMsg.senderFormatted}\n` +
          `✂️ *Deleted By:* ${deletedBy}\n` +
          `📍 *Chat:* ${chatInfo.name}${chatInfo.isGroup ? ' (Group)' : ''}\n` +
          `🕒 *Sent At:* ${antiDelete.formatTime(cachedMsg.timestamp)}\n` +
          `⏱️ *Deleted At:* ${antiDelete.formatTime(Date.now())}`;

        // Send message back to the same chat (group or private)
        if (cachedMsg.media) {
          const messageOptions = {
            [cachedMsg.type]: cachedMsg.media,
            mimetype: cachedMsg.mimetype,
            caption: baseInfo
          };

          if (cachedMsg.type === 'voice') {
            messageOptions.ptt = true;
          }

          await Matrix.sendMessage(cachedMsg.chatJid, messageOptions);
        } else if (cachedMsg.content) {
          await Matrix.sendMessage(cachedMsg.chatJid, {
            text: `${baseInfo}\n\n💬 *Content:* \n${cachedMsg.content}`
          });
        }
      } catch (error) {
        console.error('Error handling deleted message:', error);
      }
    }
  });
};

export default AntiDelete;
