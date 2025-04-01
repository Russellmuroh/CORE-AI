// plugins/antidelete.js import fs from 'fs'; import config from '../config.cjs';

const antidelete = async (m, { sock }) => { let chat = m.key.remoteJid; let text = m.body.toLowerCase();

if (text === 'antidelete on') {
    config.antidelete = true;
    fs.writeFileSync('./config.cjs', `export default ${JSON.stringify(config, null, 2)}`);
    await sock.sendMessage(chat, { text: '✅ *Antidelete Activated!*

🔹 Cloud AI will now recover deleted messages, videos, and photos.' }); } else if (text === 'antidelete off') { config.antidelete = false; fs.writeFileSync('./config.cjs', export default ${JSON.stringify(config, null, 2)}); await sock.sendMessage(chat, { text: '❌ Antidelete Deactivated!

🔸 Cloud AI will no longer recover deleted messages.' }); } };

const onDelete = async (m, { sock }) => { if (config.antidelete && m.key.fromMe === false) { let chat = m.key.remoteJid; let messageType = Object.keys(m.message)[0]; let msgText = '🗑 Deleted Message Recovered!';

if (messageType === 'conversation') {
        msgText += `\n👤 *User:* @${m.key.participant.split('@')[0]}\n💬 *Message:* ${m.message.conversation}`;
    } else if (messageType === 'imageMessage') {
        msgText += `\n👤 *User:* @${m.key.participant.split('@')[0]}\n📸 *Photo Deleted!*`;
    } else if (messageType === 'videoMessage') {
        msgText += `\n👤 *User:* @${m.key.participant.split('@')[0]}\n🎥 *Video Deleted!*`;
    }
    
    await sock.sendMessage(chat, { text: msgText, mentions: [m.key.participant] });
}

};

export default { name: 'antidelete', execute: antidelete, onDelete: onDelete, };

            
