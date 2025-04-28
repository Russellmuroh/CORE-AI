import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const gptStatusFile = path.resolve(__dirname, "../gpt_status.json");
const chatHistoryFile = path.resolve(__dirname, "../deepseek_history.json");

const deepSeekSystemPrompt = "You are an intelligent AI assistant.";

// ✅ Check if sender is owner
async function isOwner(m, Matrix) {
    const botOwnerId = Matrix.user.id.split(':')[0].replace(/\D/g, '');
    const senderId = m.sender.split(':')[0].replace(/\D/g, '');
    return senderId === botOwnerId;
}

// ✅ Read GPT status
async function readGptStatus() {
    try {
        const data = await fs.readFile(gptStatusFile, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return { enabled: false };
    }
}

// ✅ Write GPT status
async function writeGptStatus(status) {
    try {
        await fs.writeFile(gptStatusFile, JSON.stringify({ enabled: status }, null, 2));
    } catch (err) {
        console.error("❌ Error writing GPT status:", err);
    }
}

// ✅ Read chat history
async function readChatHistory() {
    try {
        const data = await fs.readFile(chatHistoryFile, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

// ✅ Write chat history
async function writeChatHistory(chatHistory) {
    try {
        await fs.writeFile(chatHistoryFile, JSON.stringify(chatHistory, null, 2));
    } catch (err) {
        console.error("Error writing chat history to file:", err);
    }
}

// ✅ Update chat history
async function updateChatHistory(chatHistory, sender, message) {
    if (!chatHistory[sender]) {
        chatHistory[sender] = [];
    }
    chatHistory[sender].push(message);
    if (chatHistory[sender].length > 20) {
        chatHistory[sender].shift();
    }
    await writeChatHistory(chatHistory);
}

// ✅ Delete user chat history
async function deleteChatHistory(chatHistory, userId) {
    delete chatHistory[userId];
    await writeChatHistory(chatHistory);
}

const deepseek = async (m, Matrix) => {
    const gptStatus = await readGptStatus();
    const chatHistory = await readChatHistory();
    const text = m.body.trim().toLowerCase();

    // ✅ Respond to "Who are you?" and "What are you?"
    if (text === "who are you" || text === "what are you") {
        await Matrix.sendMessage(m.from, { text: "I'm CLOUD AI, developed by Bruce Bera and the Bera Tech team." }, { quoted: m });
        return;
    }

    // ✅ Delete conversation history
    if (text === "/forget") {
        await deleteChatHistory(chatHistory, m.sender);
        await Matrix.sendMessage(m.from, { text: "🗑️ Conversation deleted successfully." }, { quoted: m });
        return;
    }

    // ✅ Turn ON/OFF GPT mode
    if (text === "gpt on" || text === "gpt off") {
        if (!(await isOwner(m, Matrix))) {
            await Matrix.sendMessage(m.from, { text: "❌ *Permission Denied!* Only the *bot owner* can toggle GPT mode." }, { quoted: m });
            return;
        }
        const newStatus = text === "gpt on";
        await writeGptStatus(newStatus);
        await Matrix.sendMessage(m.from, { text: `✅ GPT Mode has been *${newStatus ? "activated" : "deactivated"}*.` }, { quoted: m });
        return;
    }

    // ✅ If GPT is OFF, ignore all GPT requests
    if (!gptStatus.enabled) return;

    // ✅ If only "gpt" is sent, ask for a prompt
    if (text === "gpt") {
        await Matrix.sendMessage(m.from, { text: "Please provide a prompt." }, { quoted: m });
        return;
    }

    // ✅ Process GPT prompt
    try {
        await m.React('💻');

        const senderChatHistory = chatHistory[m.sender] || [];
        const userPrompt = m.body.trim();

        const apiUrl = `https://bera-tech-api-site-i7n3.onrender.com/api/ai/gpt4o?q=${encodeURIComponent(userPrompt)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const responseData = await response.json();
        const answer = responseData.result || "No response from AI.";

        await updateChatHistory(chatHistory, m.sender, { role: "user", content: userPrompt });
        await updateChatHistory(chatHistory, m.sender, { role: "assistant", content: answer });

        await Matrix.sendMessage(m.from, { text: answer }, { quoted: m });
        await m.React('✅');

    } catch (err) {
        await Matrix.sendMessage(m.from, { text: "Something went wrong, please try again." }, { quoted: m });
        console.error("Error fetching response:", err);
        await m.React('❌');
    }
};

export default deepseek;
