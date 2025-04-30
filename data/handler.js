import { serialize, decodeJid } from '../lib/Serializer.js';
import path from 'path';
import fs from 'fs/promises';
import config from '../config.cjs';
import { smsg } from '../lib/myfunc.cjs';
import { handleAntilink } from './antilink.js';
import { fileURLToPath } from 'url';
import { shengChat, shengCommand } from '../lib/shengMode.js';
import GroupManager from '../plugins/groupmanager.js'; // FIXED IMPORT

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instantiate GroupManager
const groupManager = new GroupManager();

export const getGroupAdmins = (participants) => {
  return participants.filter(i => i.admin === "superadmin" || i.admin === "admin").map(i => i.id);
};

const Handler = async (chatUpdate, sock, logger) => {
  try {
    if (chatUpdate.type !== 'notify') return;

    const m = serialize(JSON.parse(JSON.stringify(chatUpdate.messages[0])), sock, logger);
    if (!m.message) return;

    const participants = m.isGroup ? await sock.groupMetadata(m.from).then(metadata => metadata.participants) : [];
    const groupAdmins = m.isGroup ? getGroupAdmins(participants) : [];
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmins = m.isGroup ? groupAdmins.includes(botId) : false;
    const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;

    const PREFIX = /^[\\/!#.]/;
    const isCOMMAND = (body) => PREFIX.test(body);
    const prefixMatch = isCOMMAND(m.body) ? m.body.match(PREFIX) : null;
    const prefix = prefixMatch ? prefixMatch[0] : '/';
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const botNumber = await sock.decodeJid(sock.user.id);
    const ownerNumber = config.OWNER_NUMBER + '@s.whatsapp.net';
    let isCreator = m.sender === ownerNumber || m.sender === botNumber;

    if (!sock.public && !isCreator) return;

    await handleAntilink(m, sock, logger, isBotAdmins, isAdmins, isCreator);
    await shengCommand(m);
    await shengChat(m);

    // GroupManager commands & auto actions
    await groupManager.handleCommand(sock, m, {
      isAdmin: isAdmins,
      isBotAdmin: isBotAdmins,
      prefix: '' // No prefix needed
    });

    await groupManager.handleMessages(sock, m); // For antilink & welcome message

    // Load other plugins (non-group commands)
    const pluginDir = path.resolve(__dirname, '..', 'plugins');
    try {
      const pluginFiles = await fs.readdir(pluginDir);
      for (const file of pluginFiles) {
        if (file.endsWith('.js') && file !== 'groupmanager.js') {
          const pluginPath = path.join(pluginDir, file);
          try {
            const pluginModule = await import(`file://${pluginPath}`);
            await pluginModule.default(m, sock);
          } catch (err) {
            console.error(`❌ Failed to load plugin: ${pluginPath}`, err);
          }
        }
      }
    } catch (err) {
      console.error(`❌ Plugin folder not found: ${pluginDir}`, err);
    }

  } catch (e) {
    console.error(e);
  }
};

export default Handler;
