import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.cjs';

const geminiResponse = async (m, Matrix) => {
  const apiKey = config.GEMINI_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  // Ensure the message matches one of the trigger words (case-insensitive)
  const command = m.body.toLowerCase().trim();
  const validCommands = ['gemini', 'vision'];

  if (!validCommands.includes(command)) return;

  if (!m.quoted || m.quoted.mtype !== 'imageMessage') {
    return m.reply("*📸 Send/Reply with an image to analyze.*");
  }

  m.reply("🔍 *Processing image, please wait...*");

  try {
    const prompt = ""; // You can modify this to accept user input if needed
    const media = await m.quoted.download();

    const imagePart = {
      inlineData: {
        data: Buffer.from(media).toString("base64"),
        mimeType: "image/png",
      },
    };

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;

    const textResponse = await response.text();
    m.reply(`*🔍 Analysis Result:*\n\n${textResponse}`);
  } catch (error) {
    console.error('Error in Gemini Vision:', error);
    m.reply(`⚠️ An error occurred: ${error.message}`);
  }
};

export default geminiResponse;
