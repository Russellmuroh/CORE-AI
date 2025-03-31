
import config from '../config.cjs';

const pollCommand = async (m, Matrix) => {
  // Use the full message text (without any prefix handling)
  const text = m.body.trim();
  // Extract the first word as the command
  const parts = text.split(" ");
  const cmd = parts[0].toLowerCase();

  if (cmd === 'poll') {
    // Remove the command word to get the poll content
    const rest = text.slice(cmd.length).trim();

    if (!rest.includes('|')) {
      return m.reply("⚠️ Usage: *poll Question | Option1 | Option2 | Option3*");
    }

    let [question, ...options] = rest.split('|').map(t => t.trim());
    if (options.length < 2) {
      return m.reply("⚠️ You need at least *two options* for a poll.");
    }

    await Matrix.sendMessage(m.from, {
      poll: {
        name: question,
        values: options
      }
    }, { quoted: m });
  }
};

export default pollCommand;