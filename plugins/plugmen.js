import moment from 'moment-timezone'; 
import fs from 'fs'; 
import os from 'os'; 
import pkg from '@whiskeysockets/baileys'; 
const { generateWAMessageFromContent, proto } = pkg; 
import config from '../config.cjs'; 
import axios from 'axios';

const menu = async (m, Matrix) => { const cmd = m.body.toLowerCase().trim(); const mode = config.MODE === 'public' ? 'public' : 'private';

if (cmd === 'menu1') {
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

    Matrix.ev.on('messages.upsert', async (event) => {
        const receivedMessage = event.messages[0];
        if (!receivedMessage?.message?.extendedTextMessage) return;

        const receivedText = receivedMessage.message.extendedTextMessage.text.trim();
        if (receivedMessage.message.extendedTextMessage.contextInfo?.stanzaId !== sentMessage.key.id) return;

        const menus = {
            "1": "
  ╭━━〔 Download Menu 〕━━┈⊷
\n┃◈ apk
\n┃◈ facebook
\n┃◈ mediafire
\n┃◈ pinterestdl
\n┃◈ insta
\n┃◈ ytmp3
\n┃◈ ytmp4
\n┃◈ play
\n┃◈ song
\n┃◈ video
\n╰──────────────┈⊷",
            "2": "
  ╭━━〔 Converter Menu 〕━━┈⊷
\n┃◈ attp
\n┃◈ ebinary
\n┃◈ dbinary
\n┃◈ emojimix
\n┃◈ mp3
\n┃◈ url
\n╰──────────────┈⊷",
            "3": "
  ╭━━〔 AI Menu 〕━━┈⊷
\n┃◈ ai
\n┃◈ sheng on/off
\n┃◈ report
\n┃◈ chatbot on/off
\n┃◈ dalle
\n┃◈ gemini
\n╰──────────────┈⊷",
            "4": "
  ╭━━〔 Tools Menu 〕━━┈⊷
\n┃◈ calculator
\n┃◈ tempmail
\n┃◈ checkmail
\n┃◈ tts
\n╰──────────────┈⊷",
            "5": "
  ╭━━〔 Group Menu 〕━━┈⊷
\n┃◈ linkgroup
\n┃◈ setppgc
\n┃◈ setname
\n┃◈ setdesc
\n┃◈ antibot on/off
\n┃◈ welcome
\n┃◈ add
\n┃◈ kick
\n┃◈ antilink on/off
\n┃◈ promote
\n┃◈ open
\n┃◈ close
\n┃◈ vcf
\n╰──────────────┈⊷",
            "6": "
╭━━〔 Search Menu 〕━━┈⊷
\n┃◈ play
\n┃◈ yts
\n┃◈ imdb
\n┃◈ google
\n┃◈ pinterest
\n┃◈ wallpaper
\n┃◈ wikimedia
\n┃◈ lyrics
\n╰──────────────┈⊷",
            "7": "
  ╭━━〔 Main Menu 〕━━┈⊷
\n┃◈ ping
\n┃◈ alive
\n┃◈ owner
\n┃◈ menu
\n╰──────────────┈⊷",
            "8": "
  ╭━━〔 Owner Menu 〕━━┈⊷
\n┃◈ join
\n┃◈ leave
\n┃◈ block
\n┃◈ unblock
\n┃◈ setppbot
\n┃◈ anticall
\n┃◈ alwaysonline
\n┃◈ autoread
\n┃◈ pp <set profile>
\n┃◈ update 
\n╰──────────────┈⊷",
            "9": "
  ╭━━〔 Stalk Menu 〕━━┈⊷
\n┃◈ truecaller
\n┃◈ instastalk
\n┃◈ githubstalk
\n╰──────────────┈⊷"
        };

        const menuResponse = menus[receivedText] || "*Invalid Reply! Please Reply With A Number Between 1 to 9*";

        await Matrix.sendMessage(m.from, {
            text: menuResponse,
            contextInfo: { mentionedJid: [m.sender] }
        });
    });
}

};

export default menu;

                                   
