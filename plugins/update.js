import config from '../../config.cjs';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { execSync } from 'child_process';

// Version backup system
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 3;

class CoreUpdater {
    constructor(sock) {
        this.sock = sock;
        this.currentVersion = this.getCurrentVersion();
    }

    async handleUpdate(m) {
        const botNumber = this.sock.user?.id.split(':')[0] + '@s.whatsapp.net';
        const isAllowed = [botNumber, ...config.OWNER_NUMBER.map(num => num + '@s.whatsapp.net')]
            .includes(m.sender);

        if (!isAllowed && !m.isAutoUpdate) {
            return this.sendMessage(m.from, "❌ *Only bot owner/self can update!*", m);
        }

        try {
            // Progress tracking
            const progress = (pct, stage) => {
                if (!m.isAutoUpdate) {
                    this.sendMessage(m.from, `🔄 ${stage}... (${pct}%)`, m);
                }
                console.log(`${stage}: ${pct}%`);
            };

            // 1. Check for updates
            progress(0, 'Checking versions');
            const { latestHash, changelog } = await this.checkUpdates();
            
            if (latestHash === this.currentVersion) {
                return !m.isAutoUpdate && 
                    this.sendMessage(m.from, "✅ Already running latest version", m);
            }

            // 2. Confirmation (manual only)
            if (!m.isAutoUpdate) {
                const confirmMsg = `📢 New update available!\n\n` +
                    `*Current:* ${this.currentVersion.slice(0, 7)}\n` +
                    `*Latest:* ${latestHash.slice(0, 7)}\n\n` +
                    `Changelog:\n${changelog || 'No details'}\n\n` +
                    `Reply "yes" to update or "no" to cancel`;
                
                await this.sendMessage(m.from, confirmMsg, m);
                
                // Wait for confirmation
                const confirmed = await this.waitForConfirmation(m);
                if (!confirmed) return;
            }

            // 3. Create backup
            progress(20, 'Creating backup');
            const backupPath = await this.createBackup();

            // 4. Download update with progress
            progress(30, 'Downloading update');
            const zipPath = await this.downloadUpdate(
                'https://github.com/PRO-DEVELOPER-1/CORE-AI/archive/main.zip',
                (pct) => progress(30 + pct*0.5, 'Downloading update')
            );

            // 5. Apply update
            progress(80, 'Applying update');
            await this.applyUpdate(zipPath);

            // 6. Cleanup
            progress(95, 'Finalizing');
            fs.unlinkSync(zipPath);

            // 7. Restart
            progress(100, 'Update complete');
            if (!m.isAutoUpdate) {
                await this.sendMessage(m.from, 
                    "♻️ Update complete! Restarting...", m);
            }
            process.exit(0);

        } catch (error) {
            console.error("Update failed:", error);
            
            // Auto-rollback on failure
            if (fs.existsSync(path.join(BACKUP_DIR, this.currentVersion))) {
                await this.rollback();
            }

            if (!m.isAutoUpdate) {
                await this.sendMessage(m.from, 
                    `❌ Update failed:\n${error.message}\n` +
                    (error.rollback ? "✅ Rollback completed" : ""), m);
            }
        }
    }

    // ========== CORE METHODS ========== //
    async checkUpdates() {
        const { data: commit } = await axios.get(
            'https://api.github.com/repos/PRO-DEVELOPER-1/CORE-AI/commits/main'
        );
        return {
            latestHash: commit.sha,
            changelog: commit.commit?.message
        };
    }

    async downloadUpdate(url, progressCallback) {
        const zipPath = path.join(process.cwd(), 'latest.zip');
        const writer = fs.createWriteStream(zipPath);
        
        const { data, headers } = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            onDownloadProgress: (progress) => {
                const pct = Math.round((progress.loaded / (headers['content-length'] || 1)) * 100);
                progressCallback(pct);
            }
        });

        data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(zipPath));
            writer.on('error', reject);
        });
    }

    async applyUpdate(zipPath) {
        // Create backup before applying
        await this.createBackup();
        
        const extractPath = path.join(process.cwd(), 'latest_update');
        new AdmZip(zipPath).extractAllTo(extractPath, true);
        
        copyFolderSync(
            path.join(extractPath, 'CORE-AI-main'),
            process.cwd()
        );
        
        fs.rmSync(extractPath, { recursive: true });
    }

    // ========== SAFETY FEATURES ========== //
    async createBackup() {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        const backupPath = path.join(BACKUP_DIR, this.currentVersion);
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath);
            
            // Copy essential files
            const filesToBackup = [
                'package.json',
                'config.cjs',
                'plugins',
                'lib',
                'handlers'
            ];
            
            filesToBackup.forEach(file => {
                const src = path.join(process.cwd(), file);
                if (fs.existsSync(src)) {
                    copyFolderSync(src, path.join(backupPath, file));
                }
            });
        }

        // Cleanup old backups
        const backups = fs.readdirSync(BACKUP_DIR)
            .sort()
            .reverse();
        
        if (backups.length > MAX_BACKUPS) {
            backups.slice(MAX_BACKUPS).forEach(ver => {
                fs.rmSync(path.join(BACKUP_DIR, ver), { recursive: true });
            });
        }

        return backupPath;
    }

    async rollback() {
        console.log("Attempting rollback...");
        const backupPath = path.join(BACKUP_DIR, this.currentVersion);
        
        if (fs.existsSync(backupPath)) {
            copyFolderSync(backupPath, process.cwd());
            return true;
        }
        return false;
    }

    // ========== HELPER METHODS ========== //
    getCurrentVersion() {
        try {
            const packagePath = path.join(process.cwd(), 'package.json');
            return JSON.parse(fs.readFileSync(packagePath, 'utf-8')).commitHash || 'unknown';
        } catch {
            return 'unknown';
        }
    }

    async waitForConfirmation(m, timeout = 60000) {
        return new Promise((resolve) => {
            const listener = (response) => {
                if (response.from === m.from && 
                    ['yes', 'no'].includes(response.body.toLowerCase())) {
                    this.sock.ev.off('messages.upsert', listener);
                    clearTimeout(timer);
                    resolve(response.body.toLowerCase() === 'yes');
                }
            };
            
            const timer = setTimeout(() => {
                this.sock.ev.off('messages.upsert', listener);
                resolve(false);
            }, timeout);
            
            this.sock.ev.on('messages.upsert', listener);
        });
    }

    async sendMessage(chatId, text, quoted) {
        return this.sock.sendMessage(chatId, { text }, { quoted });
    }

    // Auto-update scheduler
    scheduleAutoUpdates(intervalHours = 24) {
        setInterval(() => this.handleUpdate({
            isAutoUpdate: true,
            sender: this.sock.user.id,
            from: 'system@auto'
        }), intervalHours * 60 * 60 * 1000);
    }
}

// Helper function
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

export default CoreUpdater;
