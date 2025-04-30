import config from '../config.cjs';

let ownerRecordingInterval;

const startOwnerRecording = async (Matrix, chatId) => {
  if (!config.AUTO_RECORDING || ownerRecordingInterval) return;
  
  ownerRecordingInterval = setInterval(async () => {
    // Only activate in owner's chats
    if (chatId !== config.OWNER_NUMBER + '@s.whatsapp.net') return;

    // Random recording duration (5-15 seconds)
    const duration = 5000 + Math.random() * 10000;
    
    // Show recording as OWNER
    await Matrix.sendPresenceUpdate('recording', chatId, {
      participant: config.OWNER_NUMBER + '@s.whatsapp.net' // Critical: Sets sender as owner
    });
    
    await new Promise(resolve => setTimeout(resolve, duration));
    await Matrix.sendPresenceUpdate('paused', chatId, {
      participant: config.OWNER_NUMBER + '@s.whatsapp.net'
    });

    // Random break (10-30 seconds)
    await new Promise(resolve => setTimeout(resolve, 10000 + Math.random() * 20000));
  }, 20000); // Check every 20 seconds
};

const ownerrecordingCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const command = m.body.trim().toLowerCase();

  if (command === 'ownerrecording on' || command === 'ownerrecording off') {
    if (!isCreator) return m.reply("*🚫 OWNER ONLY*");

    config.AUTO_RECORDING = command === 'ownerrecording on';
    
    if (config.AUTO_RECORDING) {
      startOwnerRecording(Matrix, m.from);
      await Matrix.sendMessage(m.from, {
        text: "🎤 Owner recording simulation ACTIVATED\n" +
              "Will randomly show YOU as recording voice notes"
      }, { quoted: m });
    } else {
      clearInterval(ownerRecordingInterval);
      ownerRecordingInterval = null;
      await Matrix.sendMessage(m.from, {
        text: "🚫 Owner recording simulation STOPPED"
      }, { quoted: m });
    }
  }
};

// Trigger on incoming messages
export const handleIncoming = async (m, Matrix) => {
  if (config.AUTO_RECORDING && !ownerRecordingInterval) {
    startOwnerRecording(Matrix, m.from);
  }
};

export default ownerrecordingCommand;
