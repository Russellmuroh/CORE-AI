import dotenv from 'dotenv';  // Load environment variables
import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config();  // Initialize dotenv to read the .env file

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const gptStatusFile = path.resolve(__dirname, "../gpt_status.json");
const chatHistoryFile = path.resolve(__dirname, "../deepseek_history.json");

const OPENAI_API_KEY = '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';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;  // Load ElevenLabs API key from .env file
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel's voice

// Function to read the status from gpt_status.json
async function readGptStatus() {
  try {
    const content = await fs.readFile(gptStatusFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { gpt: false, gemini: false, gpt4o: false, luminai: false };  // Default status
  }
}

// Function to write the status to gpt_status.json
async function writeGptStatus(status) {
  try {
    await fs.writeFile(gptStatusFile, JSON.stringify(status, null, 2));
  } catch (err) {
    console.error('❌ Error writing GPT status:', err);
  }
}

// Function to toggle the AI model status
async function toggleModelStatus(model, status) {
  const gptStatus = await readGptStatus();
  gptStatus[model] = status;  // Update the status of the model
  await writeGptStatus(gptStatus);  // Save the updated status
}

// Handling the bot's response logic
async function deepseek(msg, conn) {
  const gptStatus = await readGptStatus();
  const history = await readChatHistory();
  const text = msg.body.trim();

  if (text.toLowerCase() === "who are you" || text.toLowerCase() === "what are you") {
    await conn.sendMessage(msg.from, {
      text: "I'm CLOUD AI, developed by Bruce Bera and the Bera Tech team."
    }, { quoted: msg });
    return;
  }

  // Command to toggle AI models on or off
  if (text.toLowerCase().startsWith("chatbot") || text.toLowerCase().startsWith("gpt") || text.toLowerCase().startsWith("gemini") || text.toLowerCase().startsWith("gpt4o") || text.toLowerCase().startsWith("luminai")) {
    if (!(await isOwner(msg, conn))) {
      await conn.sendMessage(msg.from, {
        text: "❌ Permission Denied! Only the bot owner can toggle AI models."
      }, { quoted: msg });
      return;
    }

    const parts = text.split(" ");
    const model = parts[0].toLowerCase();  // First part of the command (e.g., "gpt", "gemini")
    const enable = parts[1]?.toLowerCase() === "on";  // Second part of the command (on/off)

    if (["gpt", "gemini", "gpt4o", "luminai"].includes(model)) {
      await toggleModelStatus(model, enable);  // Toggle the model status
      await conn.sendMessage(msg.from, {
        text: `✅ ${model.charAt(0).toUpperCase() + model.slice(1)} has been ${enable ? "activated" : "deactivated"}.`
      }, { quoted: msg });
      return;
    } else {
      await conn.sendMessage(msg.from, {
        text: "❌ Invalid model. Please use 'gpt', 'gemini', 'gpt4o', or 'luminai'."
      }, { quoted: msg });
      return;
    }
  }

  if (!gptStatus.gpt) return;  // If GPT is disabled, do nothing

  // Continue with the rest of the logic, e.g., querying AI models
  try {
    await msg.React('💻');
    
    if (gptStatus.gpt) {
      const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            ...(history[msg.sender] || []),
            { role: "user", content: text }
          ]
        })
      });

      if (!openAiResponse.ok) throw new Error("OpenAI API error: " + openAiResponse.status);

      const openAiData = await openAiResponse.json();
      const reply = openAiData.choices[0].message.content.trim();

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
}

export default deepseek;
