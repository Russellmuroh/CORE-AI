import axios from 'axios';
import pkg, { prepareWAMessageMedia } from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import config from '../config.cjs';

const Lyrics = async (m, Matrix) => {
  const body = m.body.trim().toLowerCase();
  const validTriggers = ['lyrics', 'lyric'];
  const triggerUsed = validTriggers.find(trigger => body.startsWith(trigger));

  if (triggerUsed) {
    const text = m.body.slice(triggerUsed.length).trim();
    if (!text) return m.reply(`Hello *_${m.pushName}_,*\nHere's how to use:\n*lyrics song name|artist name*`);

    try {
      await m.React('🕘');

      // Smooth percentage countdown
      await m.reply('Starting download...');
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(res => setTimeout(res, 120)); // 120ms for smooth speed
        await m.reply(`Downloading lyrics... *${i}%*`);
      }

      await m.reply('Finalizing...');

      if (!text.includes('|')) {
        return m.reply('Please use the format: *song name|artist name*');
      }

      const [title, artist] = text.split('|').map(part => part.trim());

      if (!title || !artist) {
        return m.reply('Both song name and artist name are required. Example: *Spectre|Alan Walker*');
      }

      const apiUrl = `https://vihangayt.me/search/lyrics?q=${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
      const response = await axios.get(apiUrl);
      const result = response.data;

      if (result && result.lyrics) {
        const lyrics = result.lyrics;

        const buttons = [
          {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: "📋 ᴄᴏᴘʏ ʟʏʀɪᴄs",
              id: "copy_code",
              copy_code: lyrics
            })
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "sʜᴏᴡ 💜 ғᴏʀ ᴋʜᴀɴ-ᴍᴅ",
              url: `https://whatsapp.com/channel/0029Vaj1hl1Lo4hksSXY0U2t`
            })
          },
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "ᴍᴀɪɴ ᴍᴇɴᴜ",
              id: ".menu"
            })
          }
        ];

        const msg = generateWAMessageFromContent(m.from, {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({
                  text: lyrics
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                  text: "> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋʜᴀɴ-ᴍᴅ*"
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                  title: "",
                  subtitle: "",
                  hasMediaAttachment: false
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: buttons
                })
              })
            }
          }
        }, {});

        await Matrix.relayMessage(msg.key.remoteJid, msg.message, {
          messageId: msg.key.id
        });

        await m.React('✅');
      } else {
        throw new Error('Invalid response from the Lyrics API.');
      }
    } catch (error) {
      console.error('Error getting lyrics:', error.message);
      await m.reply('Error getting lyrics.');
      await m.React('❌');
    }
  }
};

export default Lyrics;
