import axios from 'axios';
import config from '../../config.cjs';

const imageSearchCommand = async (m, sock) => {
  const triggers = ['img', 'image'];
  const body = m.body?.toLowerCase();
  const match = triggers.find(trigger => body.startsWith(trigger));

  if (match) {
    const query = m.body.slice(match.length).trim();
    if (!query) {
      return await sock.sendMessage(m.from, {
        text: '❌ Please provide a search term after the command.',
        mentions: [m.sender]
      }, { quoted: m });
    }

    try {
      const { data } = await axios.get(`https://bera-tech-api-site-i7n3.onrender.com/api/search/bing/images?q=${encodeURIComponent(query)}`);
      
      if (!data.results || data.results.length === 0) {
        return await sock.sendMessage(m.from, {
          text: '❌ No images found.',
          mentions: [m.sender]
        }, { quoted: m });
      }

      const image = data.results[0]; // First image

      await sock.sendMessage(m.from, {
        image: { url: image.url },
        caption: `🖼️ *Image Search Result for:* ${query}`,
        footer: `Powered by CLOUD AI`,
        mentions: [m.sender]
      }, { quoted: m });

    } catch (error) {
      await sock.sendMessage(m.from, {
        text: '❌ Failed to fetch image results.',
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};

export default imageSearchCommand;
