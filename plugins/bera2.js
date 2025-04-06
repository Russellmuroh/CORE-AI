import fs from 'fs-extra';
import config from '../config.cjs';

const stickerCommand = async (m, gss) => {
  const body = m.body.trim().toLowerCase();
  const validCommands = ['sticker', 'tosticker', 'autosticker'];
  const trigger = validCommands.find(v => body.startsWith(v));

  if (!trigger) return;

  const text = m.body.slice(trigger.length).trim();
  const arg = text.split(' ')[0];

  const packname = global.packname || "CLOUD AI";
  const author = global.author || "BERA TECH";

  if (trigger === 'autosticker') {
    if (arg === 'on') {
      config.AUTO_STICKER = true;
      await m.reply('Auto-sticker is now enabled.');
    } else if (arg === 'off') {
      config.AUTO_STICKER = false;
      await m.reply('Auto-sticker is now disabled.');
    } else {
      await m.reply('Usage: autosticker on|off');
    }
    return;
  }

  if (config.AUTO_STICKER && !m.key.fromMe) {
    if (m.type === 'imageMessage') {
      let media = await m.download();
      if (media) {
        await gss.sendImageAsSticker(m.from, media, m, { packname, author });
        console.log('Auto sticker sent');
      } else {
        console.error('Failed to download media for auto-sticker.');
      }
      return;
    } else if (m.type === 'videoMessage' && m.msg.seconds <= 11) {
      let media = await m.download();
      if (media) {
        await gss.sendVideoAsSticker(m.from, media, m, { packname, author });
      } else {
        console.error('Failed to download video for auto-sticker.');
      }
      return;
    }
  }

  if (validCommands.includes(trigger)) {
    const quoted = m.quoted || {};

    if (!quoted || (quoted.mtype !== 'imageMessage' && quoted.mtype !== 'videoMessage')) {
      return m.reply('Send/Reply with an image or video to convert into a sticker using: sticker');
    }

    try {
      const media = await quoted.download();
      if (!media) throw new Error('Failed to download media.');
      if (quoted.mtype === 'imageMessage') {
        await gss.sendImageAsSticker(m.from, media, m, { packname, author });
        m.reply('Sticker created successfully!');
      }
      else if (quoted.mtype === 'videoMessage' && quoted.msg.seconds <= 11) {
        await gss.sendVideoAsSticker(m.from, media, m, { packname, author });
        m.reply('Sticker created successfully!');
      } else {
        m.reply('Video too long. Please send a video that is less than 11 seconds.');
      }
    } catch (error) {
      console.error(error);
      m.reply(`Error: ${error.message}`);
    }
  }
};

export default stickerCommand;
