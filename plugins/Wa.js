import axios from 'axios';
import config from '../config.cjs';

const stickerCommandHandler = async (m, gss) => {
  const body = m.body.trim().toLowerCase();

  const stickerCommands = ['cry', 'kiss', 'kill', 'kick', 'hug', 'pat', 'lick', 'bite', 'yeet', 'bully', 'bonk', 'wink', 'poke', 'nom', 'slap', 'smile', 'wave', 'awoo', 'blush', 'smug', 'dance', 'happy', 'sad', 'cringe', 'cuddle', 'shinobu', 'handhold', 'glomp', 'highfive'];

  const cmd = body.split(' ')[0];

  if (stickerCommands.includes(cmd)) {
    const packname = `CLOUD AI`;
    const author = '';

    try {
      const { data } = await axios.get(`https://api.waifu.pics/sfw/${cmd}`);
      if (data && data.url) {
        await gss.sendImageAsSticker(m.from, data.url, m, { packname, author });
      } else {
        m.reply('Error fetching sticker.');
      }
    } catch (error) {
      console.error('Error fetching sticker:', error);
      m.reply('Error fetching sticker.');
    }
  }
};

export default stickerCommandHandler;
