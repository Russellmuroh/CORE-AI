import config from '../config.cjs';

const autoreadCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const command = m.body.trim().toLowerCase();

  if (command === 'autoread on' || command === 'autoread off') {
    if (!isCreator) return m.reply("*ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ*");
    
    const newState = command === 'autoread on';
    config.AUTO_READ = newState;
    const responseMessage = `Auto-Read has been ${newState ? "enabled" : "disabled"}.`;

    try {
      await Matrix.sendMessage(m.from, { text: responseMessage }, { quoted: m });
    } catch (error) {
      console.error("Error processing your request:", error);
      await Matrix.sendMessage(m.from, { text: 'Error processing your request.' }, { quoted: m });
    }
  }
};

export default autoreadCommand;
