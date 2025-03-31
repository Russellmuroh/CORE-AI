import config from '../config.cjs';

const deleteMessage = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);

    // Ensure the message matches one of the trigger words (case-insensitive)
    const command = m.body.toLowerCase().trim();
    const validCommands = ['del', 'delete'];

    if (!validCommands.includes(command)) return;

    if (!isCreator) {
      return m.reply("*🚫 OWNER COMMAND ONLY*");
    }

    if (!m.quoted) {
      return m.reply("*❌ REPLY TO A MESSAGE YOU WANT TO DELETE*");
    }

    const key = {
      remoteJid: m.from,
      id: m.quoted.key.id,
      participant: m.quoted.key.participant || m.quoted.key.remoteJid
    };

    await gss.sendMessage(m.from, { delete: key });

  } catch (error) {
    console.error('Error deleting message:', error);
    m.reply('An error occurred while trying to delete the message.');
  }
};

export default deleteMessage;
