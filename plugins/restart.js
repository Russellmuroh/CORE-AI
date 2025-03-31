
import config from '../config.cjs';

const restartBot = async (m) => {
  const cmd = m.body.trim().toLowerCase();  // No prefix required

  const encodedTrigger = atob('cmVzdGFydA=='); // Decoded value: "restart"

  if (cmd === encodedTrigger) {
    try {
      m.reply('Processing...');
      await process.exit();
    } catch (error) {
      console.error(error);
      await m.React("❌");
      return m.reply(`An error occurred while restarting the bot: ${error.message}`);
    }
  }
};

export default restartBot;