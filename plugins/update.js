import config from '../../config.cjs';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { formatDistanceToNow } from 'date-fns';

const update = async (m, sock) => {
    // 1. Check for trigger word (case insensitive)
    const triggerWord = m.body?.toLowerCase().trim();
    if (triggerWord !== 'update') return;

    try {
        // 2. Verify permissions
        const botNumber = sock.user?.id.split(':')[0] + '@s.whatsapp.net';
        const isAllowed = [botNumber, ...config.OWNER_NUMBER.map(num => 
            num.includes('@') ? num : `${num}@s.whatsapp.net`
        )].includes(m.sender);

        if (!isAllowed) {
            return m.reply('❌ *Only bot owner can update!*');
        }

        // 3. Check GitHub for updates with enhanced info
        await m.reply('🔍 *Checking for updates...*');
        const { data: commit } = await axios.get(
            'https://api.github.com/repos/PRO-DEVELOPER-1/CORE-AI/commits/main',
            { timeout: 10000 }
        );
        
        // 4. Compare versions with detailed info
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        const currentHash = packageData.commitHash || 'unknown';
        
        if (commit.sha === currentHash) {
            return m.reply('✅ *Already up-to-date!*\n' +
                `┣ *Version:* ${currentHash.slice(0, 7)}\n` +
                `┗ *Last Updated:* ${formatDistanceToNow(new Date(packageData.updatedAt || 0))} ago`);
        }

        // 5. Show update info before proceeding
        const updateInfo = `📢 *New Update Available!*\n\n` +
            `┏ *Current Version:* ${currentHash.slice(0, 7)}\n` +
            `┣ *New Version:* ${commit.sha.slice(0, 7)}\n` +
            `┣ *Released:* ${formatDistanceToNow(new Date(commit.commit.committer.date))} ago\n` +
            `┗ *Changes:*\n${commit.commit.message.split('\n').map(line => `      › ${line}`).join('\n')}\n\n` +
            `Reply *"confirm"* to proceed with update`;
        
        await m.reply(updateInfo);
        
        // 6. Wait for confirmation
        const confirmed = await waitForConfirmation(m, sock);
        if (!confirmed) return m.reply('❌ Update cancelled.');

        // 7. Download update with progress
        await m.reply('📥 *Downloading update...*');
        const zipPath = path.join(process.cwd(), 'update.zip');
        const { data } = await axios.get(
            'https://github.com/PRO-DEVELOPER-1/CORE-AI/archive/main.zip',
            { 
                responseType: 'arraybuffer',
                timeout: 60000,
                onDownloadProgress: progress => {
                    const percent = Math.round((progress.loaded / (progress.total || 1)) * 100);
                    if (percent % 10 === 0) {
                        m.reply(`⬇️ Downloading: ${percent}%`).catch(() => {});
                    }
                }
            }
        );
        fs.writeFileSync(zipPath, Buffer.from(data));

        // 8. Extract update
        await m.reply('📦 *Extracting files...*');
        const extractPath = path.join(process.cwd(), 'update');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // 9. Copy files with backup
        await m.reply('🔄 *Updating files...*\n(Backing up current version)');
        const updateSrc = path.join(extractPath, 'CORE-AI-main');
        const backupDir = path.join(process.cwd(), 'backups', new Date().toISOString().split('T')[0]);
        fs.mkdirSync(backupDir, { recursive: true });
        copyFolderSync(process.cwd(), backupDir);
        copyFolderSync(updateSrc, process.cwd());

        // 10. Update package.json with new version info
        packageData.commitHash = commit.sha;
        packageData.updatedAt = new Date().toISOString();
        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));

        // 11. Cleanup and restart
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });
        
        await m.reply('♻️ *Update Complete!*\n' +
            `┣ *New Version:* ${commit.sha.slice(0, 7)}\n` +
            `┣ *Changes Applied:*\n${commit.commit.message.split('\n').map(line => `      › ${line}`).join('\n')}\n` +
            `┗ *Restarting bot...*`);
        
        process.exit(0);

    } catch (error) {
        console.error('Update error:', error);
        m.reply(`❌ *Update Failed!*\n` +
            `┣ *Error:* ${error.message}\n` +
            `┗ Check console for details`);
    }
};

// Helper functions
async function waitForConfirmation(m, sock, timeout = 30000) {
    return new Promise((resolve) => {
        const listener = async ({ messages }) => {
            const msg = messages[0];
            if (msg?.key?.remoteJid === m.from && msg?.message?.conversation?.toLowerCase() === 'confirm') {
                sock.ev.off('messages.upsert', listener);
                clearTimeout(timer);
                resolve(true);
            }
        };
        
        const timer = setTimeout(() => {
            sock.ev.off('messages.upsert', listener);
            resolve(false);
        }, timeout);
        
        sock.ev.on('messages.upsert', listener);
    });
}

function copyFolderSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        fs.lstatSync(srcPath).isDirectory() 
            ? copyFolderSync(srcPath, destPath) 
            : fs.copyFileSync(srcPath, destPath);
    });
}

export default update;
