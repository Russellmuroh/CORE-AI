import fetch from 'node-fetch';
import config from '../../config.cjs';

const animeQuote = async (m, sock) => {
  const text = m.body?.trim();
  const triggers = ['animequotes', 'animequote', 'aq']; // Added multiple trigger words
  const match = triggers.find(trigger => text.toLowerCase().startsWith(trigger));

  if (match) {
    try {
      const res = await fetch('https://some-random-api.com/animu/quote');
      if (!res.ok) throw await res.text();
      const json = await res.json();
      const { sentence, character, anime } = json;

      const message = `❖𝐐𝐔𝐎𝐓𝐄\n${sentence}\n\n❖𝐂𝐇𝐀𝐑𝐀𝐂𝐓𝐄𝐑: \`\`\`${character}\`\`\`\n❖𝐀𝐍𝐈𝐌𝐄: \`\`\`${anime}\`\`\`\n`;
      await sock.sendMessage(m.from, { text: message }, { quoted: m });
    } catch (error) {
      console.error(error);
      await sock.sendMessage(m.from, { text: "❌ Failed to fetch anime quote. Please try again later." }, { quoted: m });
    }
  }
};

export default animeQuote;
