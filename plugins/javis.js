import axios from 'axios';

const javisToggles = {}; // key: chat ID, value: boolean

const javisHandler = async (m, Matrix) => {
  const chatId = m.isGroup ? m.chat : m.sender;
  const body = m.body.trim();

  // Toggle Commands
  if (body.toLowerCase() === 'javis on') {
    javisToggles[chatId] = true;
    return m.reply('Javis has been activated.');
  }

  if (body.toLowerCase() === 'javis off') {
    javisToggles[chatId] = false;
    return m.reply('Javis has been deactivated.');
  }

  // If not toggled on, skip
  if (!javisToggles[chatId]) return;

  // Trigger word "javis" (non-prefix, case-insensitive)
  const lowerBody = body.toLowerCase();
  if (!lowerBody.startsWith('javis')) return;

  const query = body.slice(5).trim(); // Remove "javis"
  if (!query) return m.reply('Yes?');

  try {
    await m.React('⏳');

    // 1. Get AI reply
    const aiRes = await axios.get(`https://bk9.fun/ai/jeeves-chat?q=${encodeURIComponent(query)}`);
    const replyText = aiRes.data?.response || 'No response.';

    // 2. Send the text reply FIRST
    await m.reply(replyText);

    // 3. Fetch TTS voice from Google
    const ttsRes = await axios.get(
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(replyText)}`,
      { responseType: 'arraybuffer' }
    );

    // 4. Send audio reply (voice note / PTT)
    await Matrix.sendMessage(m.chat, {
      audio: Buffer.from(ttsRes.data),
      mimetype: 'audio/mpeg',
      ptt: true
    }, { quoted: m });

    await m.React('✅');
  } catch (err) {
    console.error('Javis error:', err.message);
    await m.reply('Javis encountered an error.');
    await m.React('❌');
  }
};

export default javisHandler;
