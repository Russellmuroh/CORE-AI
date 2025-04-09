import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import AdmZip from "adm-zip";

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import config
const configPath = path.join(__dirname, '../config.cjs');
const config = await import(configPath).then(m => m.default || m).catch(() => ({}));

const update = async (m, Matrix) => {
    const body = m.body.toLowerCase();
    if (!body.includes("update")) return;

    // Only allow the bot itself to use this command
    const botNumber = await Matrix.decodeJid(Matrix.user.id);
    if (m.sender !== botNumber) {
        return Matrix.sendMessage(m.from, { text: "❌ *Only the bot itself can use this command!*" }, { quoted: m });
    }

    await m.React("⏳");

    try {
        console.log("🔄 Checking for updates...");
        const msg = await Matrix.sendMessage(m.from, { text: "```🔍 Checking for updates...```" }, { quoted: m });

        const editMessage = async (newText) => {
            try {
                await Matrix.sendMessage(m.from, { text: newText, edit: msg.key });
            } catch (error) {
                console.error("Message edit failed:", error);
            }
        };

        const { data: commitPage } = await axios.get("https://github.com/PRO-DEVELOPER-1/CORE-AI/commits/main");
        const latestCommitMatch = commitPage.match(/\/commit\/([a-f0-9]{40})/);
        const latestCommitHash = latestCommitMatch ? latestCommitMatch[1] : null;

        if (!latestCommitHash) throw new Error("Could not determine latest commit hash.");

        const packageJsonPath = path.join(process.cwd(), "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const currentHash = packageJson.commitHash || "unknown";

        if (latestCommitHash === currentHash) {
            await m.React("✅");
            return editMessage("```✅ Bot is already up to date!```");
        }

        await editMessage("```🚀 New update found! Downloading...```");

        const zipPath = path.join(process.cwd(), "latest.zip");
        const writer = fs.createWriteStream(zipPath);

        const response = await axios({
            method: 'get',
            url: "https://github.com/PRO-DEVELOPER-1/CORE-AI/archive/refs/heads/main.zip",
            responseType: 'stream'
        });

        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await editMessage("```📦 Extracting the latest code...```");

        const extractPath = path.join(process.cwd(), "latest");
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const folders = fs.readdirSync(extractPath);
        const mainFolder = folders.find(f => f.toLowerCase().includes("core-ai")) || folders[0];
        const sourcePath = path.join(extractPath, mainFolder);

        await editMessage("```🔄 Replacing files...```");

        await copyFolderSync(sourcePath, process.cwd(), ['package.json', 'config.cjs', '.env']);

        packageJson.commitHash = latestCommitHash;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        await editMessage("```♻️ Restarting to apply updates...```");
        setTimeout(() => process.exit(0), 2000);

    } catch (error) {
        console.error("❌ Update error:", error);
        await m.React("❌");
        await Matrix.sendMessage(m.from, {
            text: `❌ Update failed:\n${error.message}`
        }, { quoted: m });
    }
};

async function copyFolderSync(source, target, filesToSkip = []) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        if (filesToSkip.includes(item)) continue;

        const stat = fs.lstatSync(srcPath);
        if (stat.isDirectory()) {
            await copyFolderSync(srcPath, destPath, filesToSkip);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

export default update;
