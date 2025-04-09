import axios from 'axios';
import fs from 'fs';
import path from 'path';

const javisToggles = {}; // key: chat ID, value: boolean

const javisHandler = async (m, Matrix) => {
  const chatId = m.isGroup ? m.chat : m.sender;
  const body = m.body.trim();

  // Toggle Commands
  if (body.toLowerCase() === '.javis on') {
    javisToggles[chatId] = true;
    return m.reply('Javis has been activated.');
  }

  if (body.toLowerCase() === '.javis off') {
    javisToggles[chatId] = false;
    return m.reply('Javis has been deactivated.');
  }

  // Check if toggled on
  if (!javisToggles[chatId]) return;

  // Trigger word check (non-prefix, case-insensitive)
  const lowerBody = body.toLowerCase();
  if (!lowerBody.startsWith('javis')) return;

  const query = body.slice(5).trim(); // Remove "javis"
  if (!query) return m.reply('Yes?');

  try {
    await m.React('🕐');

    // Get AI Response
    const res = await axios.get(`https://bk9.fun/ai/jeeves-chat?q=${encodeURIComponent(query)}`);
    const result = res.data?.response || 'No response.';

    // Send text reply
    await m.reply(result);

    // Generate voice using Google TTS
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(result)}`;
    const voiceRes = await axios.get(ttsUrl, { responseType: 'arraybuffer' });

    const filePath = path.join(__dirname, 'javis-voice.mp3');
    fs.writeFileSync(filePath, Buffer.from(voiceRes.data));

    await Matrix.sendMessage(m.chat, { audio: fs.readFileSync(filePath), mimetype: 'audio/mp4', ptt: true }, { quoted: m });
    await m.React('✅');
  } catch (error) {
    console.error('Javis Error:', error.message);
    await m.reply('Something went wrong trying to talk to Javis.');
    await m.React('❌');
  }
};

export default javisHandler;
