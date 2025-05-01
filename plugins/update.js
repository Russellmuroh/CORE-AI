const { execSync } = require('child_process');
const config = require('./config');

async function handleUpdate(m, conn) {
  const text = m.text?.toLowerCase();
  
  // Check if message contains any trigger word
  const shouldUpdate = config.UPDATE_TRIGGERS.some(trigger => 
    text.includes(trigger.toLowerCase())
  );
  
  if (!shouldUpdate) return;
  
  // Owner verification
  if (!m.sender.endsWith(config.OWNER_NUMBER + '@s.whatsapp.net')) {
    return conn.sendMessage(m.chat, { 
      text: '🚫 Only the owner can update the bot' 
    }, { quoted: m });
  }

  try {
    // Step 1: Check current version
    const currentCommit = execSync('git rev-parse --short HEAD').toString().trim();
    await conn.sendMessage(m.chat, { 
      text: `🔍 Current version: ${currentCommit}\nChecking for updates...` 
    }, { quoted: m });

    // Step 2: Fetch updates
    execSync('git fetch origin', { stdio: 'ignore' });
    
    // Step 3: Check changes
    const changes = execSync(
      `git log --pretty=format:"• %h %s" HEAD..origin/${config.UPDATE_BRANCH}`
    ).toString().trim();

    if (!changes) {
      return conn.sendMessage(m.chat, { 
        text: '✅ You already have the latest version!' 
      }, { quoted: m });
    }

    // Step 4: Show update preview
    await conn.sendMessage(m.chat, {
      text: `📦 Updates available:\n${changes}\n\nStarting update...`
    }, { quoted: m });

    // Step 5: Execute update
    execSync(`
      git reset --hard origin/${config.UPDATE_BRANCH} && 
      npm install --production && 
      pm2 restart ${config.PM2_NAME}
    `, { stdio: 'inherit', timeout: 120000 }); // 2 minute timeout

    // Step 6: Verify
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

module.exports = {
  handleUpdate
};
