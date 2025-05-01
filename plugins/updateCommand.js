const { execSync } = require('child_process');
const config = require('./config');

async function handleUpdate(m, conn) {
  if (m.sender !== config.OWNER_NUMBER + '@s.whatsapp.net') return;

  try {
    await conn.sendMessage(m.chat, { text: '🔄 Checking for updates...' }, { quoted: m });

    // Fetch updates
    execSync('git fetch origin', { stdio: 'ignore' });
    
    // Check for changes
    const changes = execSync(`git log --pretty=format:"%h %s" HEAD..origin/${config.UPDATE_BRANCH}`)
      .toString()
      .trim();

    if (!changes) {
      return conn.sendMessage(m.chat, { text: '✅ Already up-to-date!' }, { quoted: m });
    }

    await conn.sendMessage(m.chat, { 
      text: `📦 Updates available:\n${changes}\n\nUpdating...` 
    }, { quoted: m });

    // Perform update
    execSync(`
      git reset --hard origin/${config.UPDATE_BRANCH} && 
      npm install --production && 
      pm2 restart ${config.PM2_NAME}
    `, { stdio: 'inherit' });

    await conn.sendMessage(m.chat, { 
      text: '✨ Update successful!\nBot is restarting...' 
    });

  } catch (error) {
    await conn.sendMessage(m.chat, { 
      text: `❌ Update failed:\n${error.message}\n\nPlease update manually.` 
    }, { quoted: m });
  }
}

module.exports = {
  handleUpdate
};
