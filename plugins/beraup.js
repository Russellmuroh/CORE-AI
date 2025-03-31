import pkg from '@whiskeysockets/baileys';
import config from '../../config.cjs';
const { generateWAMessageFromContent } = pkg;

const validCommands = ['alive', 'runtime', 'uptime']; // Valid commands list

const alive = async (m, Matrix) => {
  // Get the incoming text from the message
  const text = (m.body || m.message?.conversation || "").trim().toLowerCase();

  // Check if the message is exactly one of the valid commands
  if (!validCommands.includes(text)) {
    console.log(`Invalid command: ${text}`);
    return;
  }

  // Calculate uptime
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / (24 * 3600));
  const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  const uptimeMessage = `╭──────────◆
│  *ɴᴏɴ ᴘʀᴇғɪx xᴍᴅ*
│───────────◆
│ *ᴜᴘᴛɪᴍᴇ ɪɴғᴏ:*
│  *📆ᴅᴀʏs:* ${days}
│  *🕰️ʜᴏᴜʀs:* ${hours}
│  *⏳ᴍɪɴᴜᴛᴇs:* ${minutes}
│  *⏲️sᴇᴄᴏɴᴅs:* ${seconds}
│───────────◆
│   ©ʀᴇɢᴀʀᴅs ʙᴇʀᴀ ᴛᴇᴄʜ
╰──────────◆`;

  const msg = generateWAMessageFromContent(
    m.from,
    { conversation: uptimeMessage },
    {}
  );

  await Matrix.relayMessage(m.from, msg.message, { messageId: msg.key.id });
};

export default alive;
