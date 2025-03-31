import axios from 'axios';
import config from '../config.cjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const imageCommand = async (m, sock) => {
  // Ensure the message matches one of the trigger words (case-insensitive)
  const command = m.body.toLowerCase().trim();
  const validCommands = ['image', 'img'];

  if (!validCommands.includes(command)) return;

  let query = m.body.slice(command.length).trim();

  if (!query && m.quoted && m.quoted.text) {
    query = m.quoted.text;
  }

  if (!query) {
    return sock.sendMessage(m.from, { text: "*📸 Please provide a search query.*\n\n*Example:* `image black cats`" });
  }

  const numberOfImages = 5;

  try {
    await sock.sendMessage(m.from, { text: "⏳ *Fetching images... Please wait!*" });

    const images = [];

    for (let i = 0; i < numberOfImages; i++) {
      const endpoint = `https://api.guruapi.tech/api/googleimage?text=${encodeURIComponent(query)}`;
      const response = await axios.get(endpoint, { responseType: 'arraybuffer' });

      if (response.status === 200) {
        const imageBuffer = Buffer.from(response.data, 'binary');
        images.push(imageBuffer);
      } else {
        throw new Error("Image generation failed");
      }
    }

    for (let i = 0; i < images.length; i++) {
      await sleep(500);
      await sock.sendMessage(m.from, { image: images[i], caption: `🔍 *Search result for:* ${query}` }, { quoted: m });
    }
    await m.React("✅");
  } catch (error) {
    console.error("Error fetching images:", error);
    await sock.sendMessage(m.from, { text: "*❌ Oops! Something went wrong while generating images. Please try again later.*" });
  }
};

export default imageCommand;
