import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import config from '../config.cjs';
import axios from 'axios';

const menu = async (m, Matrix) => {
    const cmd = m.body.toLowerCase().trim();
    const mode = config.MODE === 'public' ? 'public' : 'private';

    if (cmd !== 'menu1') return;

    const mainMenu = `
╭━━━〔 ${config.BOT_NAME} 〕━━━┈⊷
┃★ Owner : ${config.OWNER_NAME}
┃★ User : ${m.pushName}
┃★ Mode : ${mode}
┃★ Platform : ${os.platform()}
┃★ Version : 3.1.0
╰━━━━━━━━━━━━━━━┈⊷

> Welcome ${m.pushName}!

╭━━〔 Menu List 〕━━┈⊷
┃◈ 1. Download Menu
┃◈ 2. Converter Menu
┃◈ 3. AI Menu
┃◈ 4. Tools Menu
┃◈ 5. Group Menu
┃◈ 6. Search Menu
┃◈ 7. Main Menu
┃◈ 8. Owner Menu
┃◈ 9. Stalk Menu
╰──────────────┈⊷

> Reply with the number (1-9)`;

    const getMenuImage = async () => {
        const imageUrl = 'https://files.catbox.moe/7jt69h.jpg';
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            return Buffer.from(response.data, 'binary');
        } catch (error) {
            console.error('Error fetching menu image:', error);
            return fs.readFileSync('./media/khan.jpg');
        }
    };

    const menuImage = await getMenuImage();
    const sentMessage = await Matrix.sendMessage(m.from, {
        image: menuImage,
        caption: mainMenu,
        contextInfo: { mentionedJid: [m.sender] }
    }, { quoted: m });

    await Matrix.sendMessage(m.from, {
        audio: { url: 'https://files.catbox.moe/ksvao4.mp3' },
        mimetype: 'audio/mp4',
        ptt: true
    }, { quoted: m });

    // Handle user reply with menu selection
    const menus = {
        "1": `╭━━〔 Download Menu 〕━━┈⊷
┃◈ apk
┃◈ facebook
┃◈ mediafire
┃◈ pinterestdl
┃◈ insta
┃◈ ytmp3
┃◈ ytmp4
┃◈ play
┃◈ song
┃◈ video
╰──────────────┈⊷`,
        "2": `╭━━〔 Converter Menu 〕━━┈⊷
┃◈ attp
┃◈ ebinary
┃◈ dbinary
┃◈ emojimix
┃◈ mp3
┃◈ url
╰──────────────┈⊷`,
        "3": `╭━━〔 AI Menu 〕━━┈⊷
┃◈ ai
┃◈ sheng on/off
┃◈ report
┃◈ chatbot on/off
┃◈ dalle
┃◈ gemini
╰──────────────┈⊷`,
        "4": `╭━━〔 Tools Menu 〕━━┈⊷
┃◈ calculator
┃◈ tempmail
┃◈ checkmail
┃◈ tts
╰──────────────┈⊷`,
        "5": `╭━━〔 Group Menu 〕━━┈⊷
┃◈ linkgroup
┃◈ setppgc
┃◈ setname
┃◈ setdesc
┃◈ group
┃◈ welcome
┃◈ add
┃◈ kick
┃◈ antilink
┃◈ promote
┃◈ vcf
╰──────────────┈⊷`,
        "6": `╭━━〔 Search Menu 〕━━┈⊷
┃◈ play
┃◈ yts
┃◈ imdb
┃◈ google
┃◈ pinterest
┃◈ wallpaper
┃◈ wikimedia
┃◈ lyrics
╰──────────────┈⊷`,
        "7": `╭━━〔 Main Menu 〕━━┈⊷
┃◈ ping
┃◈ alive
┃◈ owner
┃◈ menu
╰──────────────┈⊷`,
        "8": `╭━━〔 Owner Menu 〕━━┈⊷
┃◈ join
┃◈ leave
┃◈ block
┃◈ unblock
┃◈ setppbot
┃◈ anticall
┃◈ alwaysonline
┃◈ autoread
┃◈ pp <set profile>
┃◈ update
╰──────────────┈⊷`,
        "9": `╭━━〔 Stalk Menu 〕━━┈⊷
┃◈ truecaller
┃◈ instastalk
┃◈ githubstalk
╰──────────────┈⊷`
    };

    const handleMenuSelection = async (event) => {
        const receivedMessage = event.messages[0];
        if (!receivedMessage?.message?.extendedTextMessage) return;

        const receivedText = receivedMessage.message.extendedTextMessage.text.trim();
        if (receivedMessage.message.extendedTextMessage.contextInfo?.stanzaId !== sentMessage.key.id) return;

        const menuResponse = menus[receivedText] || "*Invalid Reply! Please Reply With A Number Between 1 to 9*";

        await Matrix.sendMessage(m.from, {
            text: menuResponse,
            contextInfo: { mentionedJid: [m.sender] }
        });
    };

    Matrix.ev.off('messages.upsert', handleMenuSelection); // Prevent multiple event listeners
    Matrix.ev.on('messages.upsert', handleMenuSelection);
};

export default menu;
