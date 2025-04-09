import axios from 'axios';

const javisToggles = {}; // key: chat ID, value: boolean

const javisHandler = async (m, Matrix) => {
  const chatId = m.isGroup ? m.chat : m.sender;
  const body = m.body.trim();

  // Toggle
  if (body.toLowerCase() === 'javis on') {
    javisToggles[chatId] = true;
    return m.reply('Javis has been activated.');
  }

  if (body.toLowerCase() === 'javis off') {
    javisToggles[chatId] = false;
    return m.reply('Javis has been deactivated.');
  }

  // Not toggled on
  if (!javisToggles[chatId]) return;

  // Trigger check
  const lowerBody = body.toLowerCase();
  if (!lowerBody.startsWith('javis')) return;

  const query = body.slice(5).trim();
  if (!query) return m.reply('Yes?');

  try {
    await m.React('🕐');

    const res = await axios.get(`https://bk9.fun/ai/jeeves-chat?q=${encodeURIComponent(query)}`);
    const result = res.data?.response || 'No response.';

    await m.reply(result);

    // Get TTS audio buffer
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(result)}`;
    const ttsRes = await axios.get(ttsUrl, { responseType: 'arraybuffer' });

    // Send voice note (PTT)
    await Matrix.sendMessage(m.chat, {
      audio: Buffer.from(ttsRes.data),
      mimetype: 'audio/mpeg',
      ptt: true
    }, { quoted: m });

    await m.React('✅');
  } catch (error) {
    console.error('Javis Error:', error.message);
    await m.reply('Failed to respond with voice.');
    await m.React('❌');
  }
};

export default javisHandler;
