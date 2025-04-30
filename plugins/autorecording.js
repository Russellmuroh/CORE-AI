import config from '../config.cjs';

let recordingInterval;

const startFakeRecording = async (Matrix, chatId) => {
  if (!config.AUTO_RECORDING || recordingInterval) return;
  
  recordingInterval = setInterval(async () => {
    // Random recording duration between 5-15 seconds
    const duration = 5000 + Math.random() * 10000;
    
    await Matrix.sendPresenceUpdate('recording', chatId);
    await new Promise(resolve => setTimeout(resolve, duration));
    await Matrix.sendPresenceUpdate('paused', chatId);
    
    // Random break before next session
    await new Promise(resolve => setTimeout(resolve, 10000 + Math.random() * 20000));
  }, 30000); // Check every 30 seconds
};

const autorecordingCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const command = m.body.trim().toLowerCase();

  if (command === 'autorecording on' || command === 'autorecording off') {
    if (!isCreator) return m.reply("*🚫 OWNER ONLY*");

    config.AUTO_RECORDING = command === 'autorecording on';
    
    if (config.AUTO_RECORDING) {
      startFakeRecording(Matrix, m.from);
      await Matrix.sendMessage(m.from, {
        text: "🎙️ Fake recording ACTIVATED\n" +
              "Bot will now randomly show recording indicators"
      }, { quoted: m });
    } else {
      clearInterval(recordingInterval);
      recordingInterval = null;
      await Matrix.sendMessage(m.from, {
        text: "🚫 Fake recording DEACTIVATED"
      }, { quoted: m });
    }
  }
};

// Activate on incoming messages
export const handleIncoming = async (m, Matrix) => {
  if (config.AUTO_RECORDING && !recordingInterval) {
    startFakeRecording(Matrix, m.from);
  }
};

export default autorecordingCommand;
