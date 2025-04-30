import config from '../config.cjs';

const autotypingCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const command = m.body.trim().toLowerCase();

  if (command === 'autotyping on' || command === 'autotyping off') {
    if (!isCreator) return m.reply("*🚫 OWNER ONLY*");

    config.AUTO_TYPING = command === 'autotyping on';
    
    // 10-second typing demo if enabled
    if (config.AUTO_TYPING) {
      await Matrix.sendPresenceUpdate('composing', m.from);
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay
      await Matrix.sendPresenceUpdate('paused', m.from);
    }

    await Matrix.sendMessage(m.from, {
      text: `${config.AUTO_TYPING ? '⌨️' : '🚫'} Auto-Typing ${config.AUTO_TYPING ? 'ACTIVE' : 'INACTIVE'}`
    }, { quoted: m });
  }
};

export default autotypingCommand;
