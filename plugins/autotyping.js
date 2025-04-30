import config from '../config.cjs';

const autotypingCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const command = m.body.trim().toLowerCase();

  if (command === 'autotyping on' || command === 'autotyping off') {
    if (!isCreator) return m.reply("*🚫 OWNER ONLY*");

    config.AUTO_TYPING = command === 'autotyping on';
    
    // Demo typing if enabled
    if (config.AUTO_TYPING) {
      await Matrix.sendPresenceUpdate('composing', m.from);
      setTimeout(() => Matrix.sendPresenceUpdate('paused', m.from), 2000);
    }

    await Matrix.sendMessage(m.from, {
      text: `${config.AUTO_TYPING ? '⌨️' : '🚫'} Auto-Typing ${config.AUTO_TYPING ? 'ACTIVE' : 'INACTIVE'}`
    }, { quoted: m });
  }
};

export default autotypingCommand;
