import config from '../../config.cjs';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const update = async (m, sock) => {
    // 1. Check for trigger word (case insensitive)
    const triggerWord = m.body?.toLowerCase().trim();
    if (triggerWord !== 'update') return; // Only respond to "update"
    
    try {
        // 2. Verify permissions
        const botNumber = sock.user?.id.split(':')[0] + '@s.whatsapp.net';
        const isAllowed = [botNumber, ...config.OWNER_NUMBER.map(num => 
            num.includes('@') ? num : `${num}@s.whatsapp.net`
        )].includes(m.sender);

        if (!isAllowed) {
            return m.reply('❌ *Only bot owner can update!*');
        }

        // 3. Check GitHub for updates
        await m.reply('🔍 Checking for updates...');
        const { data: commit } = await axios.get(
            'https://api.github.com/repos/PRO-DEVELOPER-1/CORE-AI/commits/main',
            { timeout: 10000 }
        );
        
        // 4. Compare versions
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        const currentHash = packageData.commitHash || 'unknown';
        
        if (commit.sha === currentHash) {
            return m.reply('✅ Bot is already up-to-date!');
        }

        // 5. Download update
        await m.reply('📥 Downloading update...');
        const zipPath = path.join(process.cwd(), 'update.zip');
        const { data } = await axios.get(
            'https://github.com/PRO-DEVELOPER-1/CORE-AI/archive/main.zip',
            { 
                responseType: 'arraybuffer',
                timeout: 60000 
            }
        );
        fs.writeFileSync(zipPath, Buffer.from(data));

        // 6. Extract update
        await m.reply('📦 Extracting files...');
        const extractPath = path.join(process.cwd(), 'update');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // 7. Copy files
        await m.reply('🔄 Updating files...');
        const updateSrc = path.join(extractPath, 'CORE-AI-main');
        copyFolderSync(updateSrc, process.cwd());

        // 8. Cleanup
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        // 9. Restart
        await m.reply('♻️ Restarting bot...');
        process.exit(0);

    } catch (error) {
        console.error('Update error:', error);
        m.reply(`❌ Update failed: ${error.message}`);
    }
};

// Helper function to copy folders
function copyFolderSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        fs.lstatSync(srcPath).isDirectory() ?
            copyFolderSync(srcPath, destPath) :
            fs.copyFileSync(srcPath, destPath);
    });
}

export default update; // Proper export statement
