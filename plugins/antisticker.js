import config from '../config.cjs';

const antistickerCommand = async (m, Matrix) => {
    const text = m.body?.trim().toLowerCase() || '';
    const isGroup = m.from.endsWith('@g.us');
    const isAdmin = m.isGroup && m.isAdmin;
    const isOwner = [config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
    const isBot = m.sender === Matrix.user.id.split(':')[0] + '@s.whatsapp.net'; // Detect if sender is the bot

    // Initialize per-group setting
    if (!global.antisticker) global.antisticker = {};
    if (!global.antisticker[m.from]) global.antisticker[m.from] = false;

    if (!isGroup) return;

    // Toggle command (now allows bot + owner/admin)
    if (text === 'antisticker on') {
        if (!isAdmin && !isOwner && !isBot) { // Allow bot to activate
            await Matrix.sendMessage(m.from, { text: '*ADMIN or BOT COMMAND ONLY*' }, { quoted: m });
            return;
        }
        global.antisticker[m.from] = true;
        await Matrix.sendMessage(m.from, { text: '*Antisticker* is now *enabled*.' }, { quoted: m });
    }

    if (text === 'antisticker off') {
        if (!isAdmin && !isOwner && !isBot) { // Allow bot to deactivate
            await Matrix.sendMessage(m.from, { text: '*ADMIN or BOT COMMAND ONLY*' }, { quoted: m });
            return;
        }
        global.antisticker[m.from] = false;
        await Matrix.sendMessage(m.from, { text: '*Antisticker* is now *disabled*.' }, { quoted: m });
    }

    // Auto-delete stickers (skip if sender is owner/bot)
    if (global.antisticker[m.from] && m.type === 'stickerMessage' && !isOwner && !isBot) {
        await Matrix.sendMessage(m.from, { 
            text: '*Stickers are not allowed in this group!*' 
        }, { quoted: m });
        await Matrix.sendMessage(m.from, { delete: m.key }); // Delete the sticker
    }
};

export default antistickerCommand;
