import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const openaiStatusFile = path.resolve(__dirname, "../openai_status.json");
const luminaiStatusFile = path.resolve(__dirname, "../luminai_status.json");
const geminiStatusFile = path.resolve(__dirname, "../gemini_status.json");
const gpt4oStatusFile = path.resolve(__dirname, "../gpt4o_status.json");
const chatHistoryFile = path.resolve(__dirname, "../deepseek_history.json");

const ELEVENLABS_API_KEY = 'sk_f5e46959e592f2f421fcfd3de377da4c0019e60dc2b46672';
const ELEVENLABS_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

async function isOwner(msg, conn) {
  const botNumber = conn.user.id.split(':')[0].replace(/\D/g, '');
  const senderNumber = msg.sender.split(':')[0].replace(/\D/g, '');
  return senderNumber === botNumber;
}

async function readStatus(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { enabled: false };
  }
}

async function writeStatus(filePath, status) {
  try {
    await fs.writeFile(filePath, JSON.stringify({ enabled: status }, null, 2));
  } catch (err) {
    console.error('❌ Error writing status:', err);
  }
}

async function readChatHistory() {
  try {
    const content = await fs.readFile(chatHistoryFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeChatHistory(history) {
  try {
    await fs.writeFile(chatHistoryFile, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Error writing chat history:', err);
  }
}

async function updateChatHistory(history, sender, entry) {
  if (!history[sender]) {
    history[sender] = [];
  }
  history[sender].push(entry);
  if (history[sender].length > 20) {
    history[sender].shift();
  }
  await writeChatHistory(history);
}

async function deleteChatHistory(history, sender) {
  delete history[sender];
  await writeChatHistory(history);
}

const deepseek = async (msg, conn) => {
  const openaiStatus = await readStatus(openaiStatusFile);
  const luminaiStatus = await readStatus(luminaiStatusFile);
  const geminiStatus = await readStatus(geminiStatusFile);
  const gpt4oStatus = await readStatus(gpt4oStatusFile);
  const history = await readChatHistory();
  const text = msg.body.trim().toLowerCase();

  if (text === "who are you" || text === "what are you") {
    await conn.sendMessage(msg.from, {
      text: "I'm CLOUD AI, developed by Bruce Bera and the Bera Tech team."
    }, { quoted: msg });
    return;
  }

  if (text === "/forget") {
    await deleteChatHistory(history, msg.sender);
    await conn.sendMessage(msg.from, {
      text: "🗑️ Conversation deleted successfully."
    }, { quoted: msg });
    return;
  }

  // Handle AI model toggle commands
  if (text === "gpt on" || text === "gpt off" || text === "gemini on" || text === "gemini off" || text === "gpt4o on" || text === "gpt4o off" || text === "luminai on" || text === "luminai off") {
    if (!(await isOwner(msg, conn))) {
      await conn.sendMessage(msg.from, {
        text: "❌ Permission Denied! Only the bot owner can toggle AI models."
      }, { quoted: msg });
      return;
    }

    const model = text.split(' ')[0];
    const enable = text.split(' ')[1] === 'on';
    let statusFile;

    if (model === "gpt") {
      statusFile = openaiStatusFile;
    } else if (model === "gemini") {
      statusFile = geminiStatusFile;
    } else if (model === "gpt4o") {
      statusFile = gpt4oStatusFile;
    } else if (model === "luminai") {
      statusFile = luminaiStatusFile;
    }

    if (statusFile) {
      await writeStatus(statusFile, enable);
      await conn.sendMessage(msg.from, {
        text: `✅ ${model.charAt(0).toUpperCase() + model.slice(1)} has been ${enable ? "activated" : "deactivated"}.`
      }, { quoted: msg });
    }
    return;
  }

  if (!(openaiStatus.enabled || luminaiStatus.enabled || geminiStatus.enabled || gpt4oStatus.enabled)) return;

  if (text === "gpt") {
    await conn.sendMessage(msg.from, {
      text: "Please provide a prompt."
    }, { quoted: msg });
    return;
  }

  try {
    await msg.React('💻');

    let apiUrl = '';
    let response = null;

    if (openaiStatus.enabled) {
      apiUrl = "https://api.vapis.my.id/api/openai?q=" + encodeURIComponent(text);
    } else if (geminiStatus.enabled) {
      apiUrl = "https://vapis.my.id/api/gemini?q=" + encodeURIComponent(text);
    } else if (gpt4oStatus.enabled) {
      apiUrl = "https://vapis.my.id/api/gpt4o?q=" + encodeURIComponent(text);
    } else if (luminaiStatus.enabled) {
      apiUrl = "https://vapis.my.id/api/luminai?q=" + encodeURIComponent(text);
    }

    if (apiUrl) {
      response = await fetch(apiUrl);
      if (!response.ok) throw new Error("HTTP error! status: " + response.status);

      const json = await response.json();
      const reply = json.data;

      await updateChatHistory(history, msg.sender, { role: "user", content: text });
      await updateChatHistory(history, msg.sender, { role: "assistant", content: reply });

      await conn.sendMessage(msg.from, { text: reply }, { quoted: msg });

      // ElevenLabs TTS
      const audioRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: reply,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.75
          }
        })
      });

      if (!audioRes.ok) throw new Error('Failed to fetch ElevenLabs TTS');

      const audioBuffer = await audioRes.buffer();

      const thumbnailRes = await fetch('https://files.catbox.moe/pimw8h.jpg');
      const thumbnailBuffer = await thumbnailRes.buffer();

      await conn.sendMessage(msg.from, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: true,
        contextInfo: {
          externalAdReply: {
            title: "CLOUD AI",
            body: "Generated by Cloud AI",
            thumbnail: thumbnailBuffer,
            mediaType: 2,
            renderLargerThumbnail: true,
            sourceUrl: "https://github.com/DEVELOPER-BERA"
          }
        }
      }, { quoted: msg });

      await msg.React('✅');
    }
  } catch (err) {
    console.error("Error fetching response:", err);
    await conn.sendMessage(msg.from, {
      text: "Something went wrong, please try again."
    }, { quoted: msg });
    await msg.React('❌');
  }
};

export default deepseek;
