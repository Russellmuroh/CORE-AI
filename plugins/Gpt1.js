import pkg from '@whiskeysockets/baileys';
const { default: axios } = await import('axios');
const { writeFile } = await import('fs/promises');
const { tmpdir } = await import('os');
const { join } = await import('path');
const { proto } = pkg;
import config from '../../config.cjs';

let GPT_MODE = false;

const GPTBot = async (m, Matrix) => {
  const text = m.body?.trim();
  if (!text) return;

  const sender = m.sender;
  const isOwner = sender === `${config.OWNER_NUMBER}@s.whatsapp.net`;
  const lowerText = text.toLowerCase();

  if (lowerText === 'gpt1 on' && isOwner) {
    GPT_MODE = true;
    await m.reply('✅ *GPT Mode activated.*\nI will now respond to any message.');
    await m.React('✅');
    return;
  }

  if (lowerText === 'gpt1 off' && isOwner) {
    GPT_MODE = false;
    await m.reply('❌ *GPT Mode deactivated.*\nI will stop responding to messages.');
    await m.React('✅');
    return;
  }

  if (!GPT_MODE) return;

  try {
    await m.React('⏳');
    
    // GPT API
    const gptRes = await axios.post('https://api.fgmods.xyz/api/gpt4', {
      text: text,
    }, {
      headers: {
        'Authorization': `Bearer ${config.FGMODS_KEY}`,
      }
    });

    const replyText = gptRes?.data?.response?.trim();
    if (!replyText) return await m.reply('⚠️ No reply from GPT.');

    // Voice generation
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(replyText)}&tl=en&client=tw-ob`;
    const ttsRes = await axios.get(ttsUrl, { responseType: 'arraybuffer' });

    const voicePath = join(tmpdir(), `gpt-${Date.now()}.mp3`);
    await writeFile(voicePath, ttsRes.data);

    await Matrix.sendMessage(m.chat, { text: replyText }, { quoted: m });
    await Matrix.sendMessage(m.chat, {
      audio: { url: voicePath },
      mimetype: 'audio/mp4',
      ptt: true
    }, { quoted: m });

    await m.React('✅');
  } catch (err) {
    console.error('GPT Bot Error:', err);
    await m.reply('❌ Error generating response.');
    await m.React('❌');
  }
};

export default GPTBot;
