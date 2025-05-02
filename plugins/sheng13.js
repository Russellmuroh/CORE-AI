import config from '../config.cjs';
import axios from 'axios';

const enabledChats = new Set();
const cooldown = new Set();

async function isAdmin(sender, chat, client) {
    if (!chat.isGroup) return false;
    try {
        const metadata = await client.groupMetadata(chat.id);
        const participant = metadata.participants.find(p => p.id === sender);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
}

async function getShengResponse(query) {
    try {
        const response = await axios.get('https://apis.davidcyriltech.my.id/ai/chatbot', {
            params: { query },
            timeout: 8000
        });
        return response.data?.response || 'Eish! Sijui jibu hili...';
    } catch {
        return 'Nimekataa kufanya kazi leo!';
    }
}

export default async function shengAI(m, client) {
    try {
        const { body, from, sender, chat } = m;
        const text = body?.toLowerCase()?.trim();
        
        if (!text) return;

        // Command handling
        if (text === 'shengai on') {
            const isGroupAdmin = chat.isGroup ? await isAdmin(sender, chat, client) : true;
            const isOwner = sender === config.OWNER_NUMBER + '@s.whatsapp.net';
            
            if (chat.isGroup && !isGroupAdmin && !isOwner) {
                return client.sendMessage(from, { 
                    text: '🚫 *Permission Denied!* Only admins can enable ShengAI in groups!',
                    mentions: [sender]
                });
            }
            
            enabledChats.add(from);
            return client.sendMessage(from, { 
                text: '✅ *ShengAI Activated!*\nNiko ready kuongea na wewe kwa Sheng!'
            });
        }

        if (text === 'shengai off') {
            enabledChats.delete(from);
            return client.sendMessage(from, { 
                text: '❌ *ShengAI Disabled*\nKwaheri tuonane tena!'
            });
        }

        // Response logic
        if (enabledChats.has(from) && 
            !text.startsWith('!') && 
            !text.startsWith('/') && 
            !text.startsWith('.')) {
            
            if (cooldown.has(from)) {
                return client.sendMessage(from, {
                    text: '⏳ *Pole!* Niko busy... Try again in 5 seconds!'
                });
            }

            cooldown.add(from);
            setTimeout(() => cooldown.delete(from), 5000);

            const response = await getShengResponse(body);
            await client.sendMessage(from, { text: response });
        }
    } catch (error) {
        console.error('ShengAI Error:', error);
        await client.sendMessage(from, { 
            text: '💢 *Error!* Nimekataa kufanya kazi kwa sasa.'
        });
    }
                }
