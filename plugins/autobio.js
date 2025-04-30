import config from '../config.cjs';
import { format, formatDistanceToNow } from 'date-fns';

// Juice WRLD short quotes
const juiceQuotes = [
  "999 forever 🦋",
  "No drugs, just love 💊",
  "Legends never die 🌙",
  "Demons in my head 😈",
  "Empty thoughts 🌀",
  "Too much pride 🏆",
  "Addictions hurt 🩹",
  "Love & pain ✨"
];

let startTime = new Date();
let bioInterval;

const updateBio = async (Matrix) => {
  if (!config.AUTO_BIO) return;

  const runtime = formatDistanceToNow(startTime, { includeSeconds: true });
  const currentDate = format(new Date(), 'MMM dd, yyyy');
  const randomQuote = juiceQuotes[Math.floor(Math.random() * juiceQuotes.length)];

  const bioText = `${randomQuote}\n⏳ ${runtime} | 📅 ${currentDate}`;

  try {
    await Matrix.updateProfileStatus(bioText);
    console.log('Bio updated:', bioText);
  } catch (error) {
    console.error('Bio update failed:', error);
  }
};

const autobioCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const command = m.body.trim().toLowerCase();

  if (command === 'autobio on' || command === 'autobio off') {
    if (!isCreator) return m.reply("*🚫 OWNER ONLY*");

    config.AUTO_BIO = command === 'autobio on';
    
    if (config.AUTO_BIO) {
      // Initial update
      await updateBio(Matrix);
      // Set interval for updates (every 30 minutes)
      bioInterval = setInterval(() => updateBio(Matrix), 30 * 60 * 1000);
      await Matrix.sendMessage(m.from, { 
        text: "✨ Auto-Bio ACTIVATED\nNew Juice WRLD bio every 30 minutes" 
      }, { quoted: m });
    } else {
      clearInterval(bioInterval);
      await Matrix.sendMessage(m.from, { 
        text: "🚫 Auto-Bio DEACTIVATED" 
      }, { quoted: m });
    }
  }
};

// Initialize if enabled in config
if (config.AUTO_BIO) {
  bioInterval = setInterval(() => updateBio(Matrix), 30 * 60 * 1000);
}

export default autobioCommand;
