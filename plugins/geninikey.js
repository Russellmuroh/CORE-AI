import axios from 'axios';
import config from '../../config.cjs';

const aiChat = async (m, sock) => {
  const text = m.body?.trim();
  const triggers = ['ai', 'ask', 'cloud'];
  const match = triggers.find(trigger => text.toLowerCase().startsWith(trigger));

  if (match) {
    const query = text.slice(match.length).trim();
    if (!query) return sock.sendMessage(m.from, { text: "🔍 Ask me anything! Example: *AI explain quantum physics*" }, { quoted: m });

    try {
      const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.GEMINI_KEY}`,
        { contents: [{ parts: [{ text: query }] }] }
      );
      const reply = data.candidates[0].content.parts[0].text;
      await sock.sendMessage(m.from, { text: `🤖 *AI Response:*\n\n${reply}` }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(m.from, { text: "❌ AI service overloaded. Try again later." }, { quoted: m });
    }
  }
};
export default aiChat;
