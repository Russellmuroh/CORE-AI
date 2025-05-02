import config from '../config.cjs';
import axios from 'axios';

const shengAiEnabledChats = new Set();
const cooldown = new Set();

async function isAdmin(sender, chat, Matrix) {
    try {
        const metadata = await Matrix.groupMetadata(chat.id);
        const participant = metadata.participants.find(p => p.id === sender);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
}

async function fetchShengAIResponse(query) {
    try {
        const response = await axios.get(`https://apis.davidcyriltech.my.id/ai/chatbot`, {
            params: { query },
            timeout: 10000
        });
        return response.data?.response || 'Nimekosa maneno...';
    } catch (error) {
        throw new Error('API request failed');
    }
}

async function shengAIHandler(m, Matrix) {
    try {
        const { body, from, sender, chat, mentionedJid } = m;
        const text = body?.toLowerCase()?.trim() || '';
        const isOwner = sender === config.OWNER_NUMBER + '@s.whatsapp.net';
        const isBot = sender === Matrix.user.id.split(':')[0] + '@s.whatsapp.net';
        const isGroupAdmin = chat.isGroup ? await isAdmin(sender, chat, Matrix) : true;

        // Command handling
        if (text === 'shengai on') {
            if (chat.isGroup && !isGroupAdmin && !isOwner) {
                return Matrix.sendMessage(from, { 
                    text: '🚫 *Halt!* Only group admins can enable ShengAI!',
                    mentions: [sender]
                });
            }
            
            shengAiEnabledChats.add(from);
            return Matrix.sendMessage(from, { 
                text: '🎉 *ShengAI Activated!*\nMambo vipi? Niko tayari kuongea Sheng na wewe!'
            });
        }

        if (text === 'shengai off') {
            if (chat.isGroup && !isGroupAdmin && !isOwner) {
                return Matrix.sendMessage(from, { 
                    text: '🚫 *Halt!* Only group admins can disable ShengAI!',
                    mentions: [sender]
                });
            }
            
            shengAiEnabledChats.delete(from);
            return Matrix.sendMessage(from, { 
                text: '😴 *ShengAI Offline*\nKwaheri tuonane tena!'
            });
        }

        // Response logic
        if (shengAiEnabledChats.has(from) && !isBot && text && !text.startsWith('!') && !text.startsWith('/')) {
            if (cooldown.has(from)) {
                return Matrix.sendMessage(from, { 
                    text: '⏳ *Pole!* Niko busy... Try again in a few seconds!'
                });
            }

            cooldown.add(from);
            setTimeout(() => cooldown.delete(from), 5000);

            try {
                const response = await fetchShengAIResponse(body);
                await Matrix.sendMessage(from, { 
                    text: response || 'Sijui manze!',
                    mentions: mentionedJid
                });
            } catch (error) {
                console.error('ShengAI Error:', error);
                await Matrix.sendMessage(from, { 
                    text: '💢 *Nimekataa!* Sina majibu kwa sasa.'
                });
            }
        }
    } catch (error) {
        console.error('ShengAI Plugin Error:', error);
    }
}

export default shengAIHandler;
