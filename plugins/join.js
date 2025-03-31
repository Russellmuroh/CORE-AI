
import config from '../config.cjs';

const joinGroup = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);

    // Extract command (first word) and arguments (rest of the message)
    const text = m.body.trim();
    const parts = text.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd !== 'join') return;

    if (!isCreator) return m.reply("*🚫 THIS IS AN OWNER COMMAND*");

    if (!args.length) return m.reply("*⚠️ Enter The Group Link!*");
    if (!isUrl(args[0]) || !args[0].includes('whatsapp.com')) return m.reply("*❌ INVALID LINK!*");

    m.reply('🔄 Please wait...');
    const result = args[0].split('https://chat.whatsapp.com/')[1];

    await gss.groupAcceptInvite(result)
      .then((res) => m.reply(`✅ *SUCCESSFULLY JOINED THE GROUP.*`))
      .catch((err) => m.reply(`🚫 *FAILED TO JOIN THE GROUP.*`));

  } catch (error) {
    console.error('Error:', error);
    m.reply('⚠️ An error occurred while processing the command.');
  }
};

// Function to check if the given string is a valid URL
const isUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export default joinGroup;