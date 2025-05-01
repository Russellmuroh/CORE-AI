import { execSync } from 'child_process';
import config from './config.js';

async function handleUpdate(m, conn) {
  const text = m.text?.toLowerCase();
  const shouldUpdate = config.UPDATE_TRIGGERS.some(trigger =>
    text.includes(trigger.toLowerCase())
  );
  if (!shouldUpdate) return;

  if (!m.sender.endsWith(`${config.OWNER_NUMBER}@s.whatsapp.net`)) {
    return conn.sendMessage(m.chat, {
      text: '🚫 Only the owner can update the bot'
    }, { quoted: m });
  }

  try {
    const currentCommit = execSync('git rev-parse --short HEAD').toString().trim();
    await conn.sendMessage(m.chat, {
      text: `🔍 Current version: ${currentCommit}\nChecking for updates...`
    }, { quoted: m });

    execSync('git fetch origin', { stdio: 'ignore' });

    const changes = execSync(
      `git log --pretty=format:"• %h %s" HEAD..origin/${config.UPDATE_BRANCH}`
    ).toString().trim();

    if (!changes) {
      return conn.sendMessage(m.chat, {
        text: '✅ You already have the latest version!'
      }, { quoted: m });
    }

    await conn.sendMessage(m.chat, {
      text: `📦 Updates available:\n${changes}\n\nStarting update...`
    }, { quoted: m });

    execSync(
      `git reset --hard origin/${config.UPDATE_BRANCH} && npm install --production && pm2 restart ${config.PM2_NAME}`,
      { stdio: 'inherit', timeout: 120000 }
    );

    const newCommit = execSync('git rev-parse --short HEAD').toString().trim();
    await conn.sendMessage(m.chat, {
      text: `✨ Update successful!\nNew version: ${newCommit}\nBot is restarting...`
    });

  } catch (error) {
    console.error('Update error:', error);
    await conn.sendMessage(m.chat, {
      text: `❌ Update failed:\n${error.message}\n\nPlease update manually.`
    }, { quoted: m });
  }
}

export default handleUpdate;
