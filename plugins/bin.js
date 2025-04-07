import fetch from 'node-fetch';
import config from '../../config.cjs'; // Make sure this has your bot owner number or uses isOwner logic

const triggerWords = ['imagine', 'create','bing'];

const imageHandler = async (m, conn) => {
  const text = m.body?.trim().toLowerCase();

  if (!triggerWords.some(word => text.startsWith(word))) return;

  if (!m.key.fromMe) {
    return await conn.sendMessage(m.chat, { text: '⛔ Only the bot owner can use this command.' }, { quoted: m });
  }

  const prompt = text.split(' ').slice(1).join(' ');
  if (!prompt) {
    return await conn.sendMessage(m.chat, { text: '❌ Please specify what to generate.\n\nExample: *imagine a futuristic robot*' }, { quoted: m });
  }

  const encodedPrompt = encodeURIComponent(prompt);

  try {
    await m.react('⏳'); // loading reaction

    const res = await fetch(`https://aemt.me/bingimg?text=${encodedPrompt}`);
    const data = await res.json();

    if (!data.result) {
      return await conn.sendMessage(m.chat, { text: '❌ Failed to generate image.' }, { quoted: m });
    }

    await conn.sendFile(m.chat, data.result, 'image.png', `*Prompt:* ${prompt}`, m);
    await m.react('✅'); // done reaction
  } catch (err) {
    console.error(err);
    await conn.sendMessage(m.chat, { text: '⚠️ An error occurred while generating the image.' }, { quoted: m });
  }
};

export default imageHandler;
