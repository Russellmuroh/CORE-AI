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

    if (cmd === 'menu1') {
        const mainMenu = `
╭━━━〔 ${config.BOT_NAME} 〕━━━┈⊷ 
┃★ Owner : ${config.OWNER_NAME} 
┃★ User : ${m.pushName} 
┃★ Mode : ${mode} 
┃★ Platform : ${os.platform()} 
┃★ Version : 3.1.0 
╰━━━━━━━━━━━━━━━┈⊷

Welcome ${m.pushName}!

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
┃◈ 10. Logo Menu 
╰──────────────┈⊷

Reply with the number (1-10)`;

        const menuImageUrl = 'https://files.catbox.moe/7jt69h.jpg';  // Direct URL to the image

        const sentMessage = await Matrix.sendMessage(m.from, {
            image: { url: menuImageUrl },  // Directly using the URL
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
                "1": `
  ╭━━〔 Download Menu 〕━━┈⊷
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
                "2": `
  ╭━━〔 Converter Menu 〕━━┈⊷
  ┃◈ attp
  ┃◈ ebinary
  ┃◈ dbinary
  ┃◈ emojimix
  ┃◈ mp3
  ┃◈ url
  ╰──────────────┈⊷`,
                "3": `
  ╭━━〔 AI Menu 〕━━┈⊷
  ┃◈ ai
  ┃◈ sheng on/off
  ┃◈ report
  ┃◈ chatbot on/off
  ┃◈ dalle
  ┃◈ gemini
  ╰──────────────┈⊷`,
                "4": `
  ╭━━〔 Tools Menu 〕━━┈⊷
  ┃◈ calculator
  ┃◈ tempmail
  ┃◈ checkmail
  ┃◈ elements 
  ┃◈ tts
  ╰──────────────┈⊷`,
                "5": `
  ╭━━〔 Group Menu 〕━━┈⊷
  ┃◈ linkgroup
  ┃◈ setppgc
  ┃◈ setname
  ┃◈ setdesc
  ┃◈ open
  ┃◈ close
  ┃◈ add
  ┃◈ kick
  ┃◈ antilink on/off
  ┃◈ antibot on/off
  ┃◈ grouplink
  ┃◈ link
  ┃◈ promote
  ┃◈ vcf
  ╰──────────────┈⊷`,
                "6": `
  ╭━━〔 Search Menu 〕━━┈⊷
  ┃◈ play
  ┃◈ yts
  ┃◈ imdb
  ┃◈ google
  ┃◈ pinterest
  ┃◈ wallpaper
  ┃◈ wikimedia
  ┃◈ lyrics
  ┃◈ bible
  ┃◈ biblelist
  ╰──────────────┈⊷`,
                "7": `
  ╭━━〔 Main Menu 〕━━┈⊷
  ┃◈ ping
  ┃◈ alive
  ┃◈ owner
  ┃◈ menu
  ┃◈ about
  ╰──────────────┈⊷`,
                "8": `
  ╭━━〔 Owner Menu 〕━━┈⊷
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
                "9": `
  ╭━━〔 Stalk Menu 〕━━┈⊷
  ┃◈ truecaller
  ┃◈ instastalk
  ┃◈ githubstalk
  ╰──────────────┈⊷`,
                "10": `
  ╭━━〔 Logo Menu 〕━━┈⊷
  ┃◈ logo
  ┃◈ hacker
  ┃◈ blackpink
  ┃◈ glossysilver
  ┃◈ naruto
  ┃◈ digitalglitch
  ┃◈ pixelglitch
  ┃◈ star
  ┃◈ smoke
  ┃◈ bear
  ┃◈ neondevil
  ┃◈ screen
  ┃◈ nature
  ┃◈ dragonball
  ┃◈ foggyglass
  ┃◈ neonlight
  ┃◈ castlepop
  ┃◈ frozenchristmas
  ┃◈ foilballoon
  ┃◈ colorfulpaint
  ┃◈ americanflag
  ┃◈ water
  ┃◈ underwater
  ┃◈ dragonfire
  ┃◈ bokeh
  ┃◈ snow
  ┃◈ sand3d
  ┃◈ pubg
  ┃◈ horror
  ┃◈ blood
  ┃◈ bulb
  ┃◈ graffiti
  ┃◈ thunder
  ┃◈ thunder1
  ┃◈ womensday
  ┃◈ valentine
  ┃◈ graffiti2
  ┃◈ queencard
  ┃◈ galaxy
  ┃◈ pentakill
  ┃◈ birthdayflower
  ┃◈ zodiac
  ┃◈ water3D
  ┃◈ textlight
  ┃◈ wall
  ┃◈ gold
  ┃◈ glow
  ┃◈ team
  ┃◈ rotation
  ┃◈ paint
  ┃◈ avatar
  ┃◈ typography
  ┃◈ tattoo
  ┃◈ luxury
  ╰──────────────┈⊷`
            };

            await Matrix.sendMessage(m.from, {
                text: menus[receivedText] || "*Invalid Reply! Please Reply With A Number Between 1 to 10*",
                contextInfo: { mentionedJid: [m.sender] }
            });
        });
    }
};

export default menu;
