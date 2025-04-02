// plugins/antidelete.js import fs from 'fs'; import config from '../config.cjs';

const antidelete = async (m, { sock }) => { let chat = m.key.remoteJid; let text = m.body?.toLowerCase();

if (text === 'antidelete on') {
    config.antidelete = true;
    fs.writeFileSync('./config.cjs', `export default ${JSON.stringify(config, null, 2)}`);
    await sock.sendMessage(chat, { text: '✅ *Antidelete Activated!*

🔹 Cloud AI will now recover deleted messages, videos, and photos.' }); } else if (text === 'antidelete off') { config.antidelete = false; fs.writeFileSync('./config.cjs', export default ${JSON.stringify(config, null, 2)}); await sock.sendMessage(chat, { text: '❌ Antidelete Deactivated!

🔸 Cloud AI will no longer recover deleted messages.' }); } };

const onDelete = async (m, sock) => { if (config.antidelete && m.key.remoteJid && !m.key.fromMe) { let chat = m.key.remoteJid; let participant = m.key.participant || m.participant || m.key.remoteJid; let messageType = Object.keys(m.message || {})[0]; let msgText = 🗑 *Deleted Message Recovered!* 👤 *User:* @${participant.split('@')[0]}; let forwardMessage = {};

if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
        msgText += `\n💬 *Message:* ${m.message.conversation || m.message.extendedTextMessage?.text}`;
    } else if (messageType === 'imageMessage') {
        msgText += '\n📸 *Photo Deleted!*';
        forwardMessage = { image: m.message.imageMessage, caption: msgText };
    } else if (messageType === 'videoMessage') {
        msgText += '\n🎥 *Video Deleted!*';
        forwardMessage = { video: m.message.videoMessage, caption: msgText };
    } else {
        msgText += '\n❗ *Unsupported message type deleted!*';
    }

    if (Object.keys(forwardMessage).length > 0) {
        await sock.sendMessage(chat, { ...forwardMessage, mentions: [participant] });
    } else {
        await sock.sendMessage(chat, { text: msgText, mentions: [participant] });
    }
}

};

export default { name: 'antidelete', execute: antidelete, onDelete: onDelete, };

