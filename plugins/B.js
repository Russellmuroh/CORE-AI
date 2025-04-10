import axios from 'axios';
import config from '../../config.cjs';

const handler = async (m, { body, sender, sendMessage, React }) => {
  const text = body?.trim();
  const trigger = ['bing', 'create'];
  const isTrigger = trigger.some(word => text?.toLowerCase().startsWith(word));
  const isBotOwner = sender === config.OWNER_NUMBER + '@s.whatsapp.net';

  if (!isTrigger || !isBotOwner) return;

  const input = text.split(' ').slice(1).join(' ');
  if (!input) return m.reply('Please provide a prompt. Example:\n\n*bing futuristic city*');

  try {
    await m.React('⏳');
    const url = `https://aemt.me/bingimg?text=${encodeURIComponent(input)}`;
    await sendMessage(m.chat, {
      image: { url },
      caption: `🧠 *Bing AI Image Generator*\n\n🎨 *Prompt:* ${input}`
    });
    await m.React('✅');
  } catch (e) {
    console.error('Bing image error:', e);
    await m.reply('Failed to generate image. Try again later.');
    await m.React('❌');
  }
};

export default handler;

handler.command = /^bing|create$/i;
handler.help = ['bing <text>', 'create <text>'];
handler.tags = ['ai', 'image'];
handler.bot = true; // Only the bot user can trigger it
