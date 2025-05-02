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

async function handleShengAI(m, client) {
    try {
        const { body, from, sender, chat } = m;
        const text = body?.trim();
        
        if (!text) return;

        // Case-insensitive trigger words
        const triggerOn = ['shengai on', 'shengai activate', 'enable shengai'].some(trigger => 
            text.toLowerCase().startsWith(trigger.toLowerCase())
        );
        
        const triggerOff = ['shengai off', 'shengai deactivate', 'disable shengai'].some(trigger => 
            text.toLowerCase().startsWith(trigger.toLowerCase())
        );

        // Command handling
        if (triggerOn) {
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

        if (triggerOff) {
            enabledChats.delete(from);
            return client.sendMessage(from, { 
                text: '❌ *ShengAI Disabled*\nKwaheri tuonane tena!'
            });
        }

        // Response logic
        if (enabledChats.has(from)) {
            // Skip commands and short messages
            if (text.startsWith('!') || text.startsWith('/') || text.startsWith('.') || text.length < 2) {
                return;
            }

            if (cooldown.has(from)) return;
            
            cooldown.add(from);
            setTimeout(() => cooldown.delete(from), 5000);

            const response = await getShengResponse(body);
            await client.sendMessage(from, { text: response });
        }
    } catch (error) {
        console.error('ShengAI Error:', error);
        try {
            await client.sendMessage(from, { 
                text: '💢 *Error!* Nimekataa kufanya kazi kwa sasa.'
            });
        } catch (e) {
            console.error('Failed to send error message:', e);
        }
    }
}

export default handleShengAI;
