import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import baileysPkg from '@whiskeysockets/baileys';
const { serialize, decodeJid } = baileysPkg;

// CommonJS imports
import config from '../config.cjs';
import { smsg } from '../lib/myfunc.cjs';

// Dynamic ESM imports
const { handleAntilink } = await import('./antilink.js');
const { shengChat, shengCommand } = await import('../lib/shengMode.js');
const GroupManagerModule = await import('../plugins/groupmanager.js');
const GroupManager = GroupManagerModule.default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const groupManager = new GroupManager();

export const getGroupAdmins = (participants) => {
    return participants.filter(p => p.admin === "superadmin" || p.admin === "admin").map(p => p.id);
};

const Handler = async (chatUpdate, sock, logger) => {
    try {
        if (chatUpdate.type !== 'notify') return;

        const m = serialize(JSON.parse(JSON.stringify(chatUpdate.messages[0])), sock, logger);
        if (!m.message) return;

        let participants = [];
        try {
            participants = m.isGroup ? await sock.groupMetadata(m.from).then(md => md.participants) : [];
        } catch (err) {
            console.error('Group metadata error:', err);
            return;
        }

        const groupAdmins = getGroupAdmins(participants);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = m.isGroup ? groupAdmins.includes(botId) : false;
        const isAdmin = m.isGroup ? groupAdmins.includes(m.sender) : false;

        const PREFIX = /^[\\/!#.]/;
        const isCommand = (body) => PREFIX.test(body);
        const prefix = m.body.match(PREFIX)?.[0] || '/';
        const [cmd, ...args] = isCommand(m.body) ? m.body.slice(prefix.length).split(' ') : [];
        const text = args.join(' ').trim();

        const isCreator = [config.OWNER_NUMBER + '@s.whatsapp.net', botId].includes(m.sender);
        if (!sock.public && !isCreator) return;

        // 1. Trigger words check
        if (m.isGroup && !isCommand(m.body)) {
            try {
                if (await groupManager.checkTriggers(sock, m)) return;
            } catch (err) {
                console.error('Trigger check error:', err);
            }
        }

        // 2. Existing handlers
        await Promise.all([
            handleAntilink(m, sock, logger, isBotAdmin, isAdmin, isCreator),
            shengCommand(m),
            shengChat(m)
        ]);

        // 3. Group commands
        if (isCommand(m.body)) {
            try {
                await groupManager.handleCommand(sock, m, {
                    isAdmin,
                    isBotAdmin,
                    prefix
                });
            } catch (err) {
                console.error('Group command error:', err);
                await sock.sendMessage(m.from, { text: '❌ Command failed' });
            }
        }

        // 4. Group protections
        await groupManager.handleMessages(sock, m);

        // 5. Load other plugins
        const pluginDir = path.resolve(__dirname, '..', 'plugins');
        try {
            const files = await fs.readdir(pluginDir);
            await Promise.all(files.map(async (file) => {
                if (file.endsWith('.js') && file !== 'groupmanager.js') {
                    try {
                        const plugin = await import(`file://${path.join(pluginDir, file)}`);
                        await plugin.default(m, sock);
                    } catch (err) {
                        console.error(`Plugin ${file} error:`, err);
                    }
                }
            }));
        } catch (err) {
            console.error('Plugin dir error:', err);
        }

    } catch (e) {
        console.error('Handler error:', e);
    }
};

export default Handler;
