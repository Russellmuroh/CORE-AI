import config from '../../config.cjs';

const blockUnblock = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);

    // Extract first word as command
    const args = m.body.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();
    const text = args.slice(1).join(' '); // The rest of the message

    const validCommands = ['block', 'unblock'];
    if (!validCommands.includes(cmd)) return; // Ignore if not a valid command

    if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");

    let userToBlockUnblock;

    // Check if a number or mention is provided after the command
    if (text) {
      userToBlockUnblock = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'; // Extract numbers and append domain
    } else {
      // If no number, check for mentioned users or quoted sender
      userToBlockUnblock = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
    }

    // If no user is provided, return a helpful message
    if (!userToBlockUnblock) {
      return m.reply("Please provide a valid number or mention the user to block/unblock.");
    }

    // Perform block or unblock based on the command
    if (cmd === 'block') {
      await gss.updateBlockStatus(userToBlockUnblock, 'block')
        .then(() => m.reply(`Blocked @${userToBlockUnblock.split('@')[0]} successfully.`))
        .catch((err) => m.reply(`Failed to block user: ${err}`));
    } else if (cmd === 'unblock') {
      await gss.updateBlockStatus(userToBlockUnblock, 'unblock')
        .then(() => m.reply(`Unblocked @${userToBlockUnblock.split('@')[0]} successfully.`))
        .catch((err) => m.reply(`Failed to unblock user: ${err}`));
    }
  } catch (error) {
    console.error('Error:', error);
    m.reply('An error occurred while processing the command.');
  }
};

export default blockUnblock;
