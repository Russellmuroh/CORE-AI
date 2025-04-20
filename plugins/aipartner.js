// aiPartner.js

import axios from 'axios';
import fs from 'fs'; // You can remove this if no longer needed
import config from '../config.cjs';

const deepseekUrl = 'https://api.siputzx.my.id/api/ai/deepseek-llm-67b-chat?content=';
const voiceIdFemale = 'JBFqnCBsd6RMkjVDRZzb';
const voiceIdMale = 'TxGEqnHWrfWFTfGW9XjX';
const elevenKey = 'sk_f5e46959e592f2f421fcfd3de377da4c0019e60dc2b46672';

const genderFile = './chat_profile.json';
const memoryFile = './chat_memory.json';
const toggleFile = './feature_status.json';

const loadJSON = (file) => {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
};

const saveJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const getMemory = (sender) => {
  const memory = loadJSON(memoryFile);
  return memory[sender] || [];
};

const addToMemory = (sender, role, content) => {
  const memory = loadJSON(memoryFile);
  if (!memory[sender]) memory[sender] = [];
  memory[sender].push({ role, content });
  if (memory[sender].length > 15) memory[sender] = memory[sender].slice(-15);
  saveJSON(memoryFile, memory);
};

const getVoiceId = (userGender) => {
  return userGender === 'female' ? voiceIdMale : voiceIdFemale;
};

export const aiPartner = async (msg, sock, botNumber) => {
  const text = msg.body?.trim();
  const sender = msg.key.remoteJid;
  const senderNumber = msg.key.participant || sender;
  const isBotUser = senderNumber.includes(botNumber);

  if (!text) return;

  // Handle toggle
  if (text.toLowerCase() === 'gf mode on' || text.toLowerCase() === 'bf mode on') {
    const toggle = loadJSON(toggleFile);
    toggle['aipartner'] = true;
    saveJSON(toggleFile, toggle);
    return sock.sendMessage(sender, { text: 'AI Partner mode activated.' });
  }
  if (text.toLowerCase() === 'gf mode off' || text.toLowerCase() === 'bf mode off') {
    const toggle = loadJSON(toggleFile);
    toggle['aipartner'] = false;
    saveJSON(toggleFile, toggle);
    return sock.sendMessage(sender, { text: 'AI Partner mode deactivated.' });
  }

  const status = loadJSON(toggleFile);
  if (!status['aipartner']) return;

  if (!['gf', 'bf', 'partner'].some(t => text.toLowerCase().startsWith(t))) return;

  const genderData = loadJSON(genderFile);
  if (!genderData[sender]) {
    await sock.sendMessage(sender, { text: 'Hi! Are you male or female?' });
    genderData[sender] = { asking: true };
    saveJSON(genderFile, genderData);
    return;
  }

  if (genderData[sender].asking) {
    const gender = text.toLowerCase().includes('male') ? 'male' : text.toLowerCase().includes('female') ? 'female' : null;
    if (!gender) {
      await sock.sendMessage(sender, { text: 'Please reply with "male" or "female".' });
      return;
    }
    genderData[sender] = { gender };
    saveJSON(genderFile, genderData);
    await sock.sendMessage(sender, { text: 'Thanks! You can now talk to your AI partner.' });
    return;
  }

  const userGender = genderData[sender]?.gender || 'male';
  const aiGender = userGender === 'female' ? 'boyfriend' : 'girlfriend';
  const name = msg.pushName || 'Love';
  const userMessage = text.split(/gf|bf|partner/i)[1]?.trim();
  if (!userMessage) return;

  const memory = getMemory(sender);
  const historyText = memory.map(m => `${m.role === 'user' ? name : aiGender.toUpperCase()}: ${m.content}`).join('\n');
  const prompt = `You're an emotionally responsive ${aiGender} AI partner chatting with ${name}. Continue the conversation naturally.\n\n${historyText}\n${name}: ${userMessage}\n${aiGender.toUpperCase()}:`;

  const gptRes = await axios.get(deepseekUrl + encodeURIComponent(prompt));
  const reply = gptRes.data?.result?.trim() || "I'm here for you.";

  addToMemory(sender, 'user', userMessage);
  addToMemory(sender, 'ai', reply);

  const voiceId = getVoiceId(userGender);
  const voiceRes = await axios.post(
    'https://api.elevenlabs.io/v1/text-to-speech/generate', 
    {
      text: reply,
      voice_id: voiceId
    },
    {
      headers: {
        'Authorization': `Bearer ${elevenKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    }
  );

  // Send the GPT response as text
  await sock.sendMessage(sender, { text: reply });

  // Send the TTS audio directly without saving it to the server
  const audioBuffer = voiceRes.data;
  if (audioBuffer) {
    await sock.sendMessage(sender, {
      audio: audioBuffer,
      mimetype: 'audio/mp4',
      ptt: true
    });
  }
};
