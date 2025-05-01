import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import pm2 from 'pm2';

const updateHandler = async (m, conn) => {
  const triggers = ['update', 'upgrade', 'refresh'];
  if (!triggers.some(cmd => m.text?.toLowerCase().includes(cmd))) return;

  const config = {
    REPO: 'PRO-DEVELOPER-1/CORE-AI',
    BRANCH: 'main',
    PM2_NAME: 'CORE-AI',
    OWNER_NUMBER: '1234567890@s.whatsapp.net'
    // add Your Number
  };

  try {
    // Owner Verification
    if (!m.sender.endsWith(config.OWNER_NUMBER)) {
      return conn.sendMessage(m.chat, { text: '🚫 Only the bot owner can perform updates' }, { quoted: m });
    }

    // PM2 Verification
    const pm2Process = await new Promise((resolve, reject) => {
      pm2.describe(config.PM2_NAME, (err, processDescription) => {
        if (err) reject(err);
        else resolve(processDescription);
      });
    });
    if (!pm2Process || pm2Process.length === 0) {
      return conn.sendMessage(m.chat, { text: `❌ PM2 process "${config.PM2_NAME}" not found!` }, { quoted: m });
    }

    // Pre-Update Info
    const currentCommit = execSync('git rev-parse --short HEAD').toString().trim();
    const currentDate = execSync('git show -s --format=%ci HEAD').toString().trim();
    await conn.sendMessage(m.chat, { text: `📋 Current Version\nCommit: ${currentCommit}\nDate: ${currentDate}\n\nChecking for updates...` }, { quoted: m });

    // Update Execution
    execSync('git fetch origin', { stdio: 'ignore' });
    const changes = execSync(`git log --pretty=format:"• %h %s (%an)" HEAD..origin/${config.BRANCH}`).toString();
    if (!changes.trim()) {
      return conn.sendMessage(m.chat, { text: '✅ Already running the latest version!' }, { quoted: m });
    }

    await conn.sendMessage(m.chat, { text: `🔄 Updates Available:\n${changes || '• Minor improvements'}\n\nStarting update process...` }, { quoted: m });

    // Starting Update
    const updateScript = `
      #!/bin/bash
      cd ${process.cwd()}
      git reset --hard origin/${config.BRANCH}
      npm install --production
      pm2 restart ${config.PM2_NAME}
    `.trim();
    await fs.writeFile('update.sh', updateScript);
    await fs.chmod('update.sh', 0o755);
    execSync('./update.sh', { stdio: 'inherit', timeout: 180000 }); // Increased timeout to 3 minutes

    // Post-Update Verification && better error handling 
    const newCommit = execSync('git rev-parse --short HEAD').toString().trim();
    const pm2Status = await new Promise((resolve, reject) => {
      pm2.describe(config.PM2_NAME, (err, processDescription) => {
        if (err) reject(err);
        else resolve(processDescription[0].pm2_env.status);
      });
    });
    await conn.sendMessage(m.chat, { text: `✨ Update Successful!\n\nNew Version: ${newCommit}\nPM2 Status: ${pm2Status}\n\nChanges Applied:\n${changes.substring(0, 1000)}${changes.length > 1000 ? '\n...and more' : ''}` }, { quoted: m });
  } catch (error) {
    await conn.sendMessage(m.chat, { text: `❌ Update Failed!\n\nError: ${error.message}\n\nRecovery Steps:\n1. Check internet connection\n2. Verify GitHub access\n3. Run: git status\n4. Check PM2: pm2 show ${config.PM2_NAME}` }, { quoted: m });
  }
};

export default updateHandler;
