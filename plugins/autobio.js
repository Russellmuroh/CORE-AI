import config from '../config.cjs';
import { format, formatDistanceToNow } from 'date-fns';

// Short Juice WRLD quotes
const juiceQuotes = [
  "forever is not enough 🦋",
  "No vanity, just clarity ✨",
  "Addictions hurt 🩹",
  "Love & drugs 💊",
  "Legends never die 🌙",
  "Empty thoughts 🌀",
  "on my knees my hands fold",
  "Too much pride 🏆"
];

let startTime = new Date();

const updateBio = async (Matrix) => {
  if (!config.AUTO_BIO) return;

  const runtime = formatDistanceToNow(startTime);
  const currentDate = format(new Date(), 'MM/dd/yy');
  const randomQuote = juiceQuotes[Math.floor(Math.random() * juiceQuotes.length)];

  await Matrix.setStatus(
    `${randomQuote}\n` +
    `⏱️ ${runtime} | 📅 ${currentDate}`
  );
};

// Update every 15 mins
setInterval(() => updateBio(Matrix), 900000);

const autobioCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const command = m.body.trim().toLowerCase();

  if (command === 'autobio on' || command === 'autobio off') {
    if (!isCreator) return m.reply("*🚫 OWNER ONLY*");

    config.AUTO_BIO = command === 'autobio on';
    if (config.AUTO_BIO) await updateBio(Matrix);

    await Matrix.sendMessage(m.from, {
      text: `${config.AUTO_BIO ? '✨' : '🚫'} Auto-Bio ${config.AUTO_BIO ? 'ON' : 'OFF'}`
    }, { quoted: m });
  }
};

export default autobioCommand;
