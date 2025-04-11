import { promises as _0x34477e } from 'fs';
import _0x45582f from 'path';
import _0x32eabe from 'node-fetch';

const __filename = new URL(import.meta.url).pathname;
const __dirname = _0x45582f.dirname(__filename);

const gptStatusFile = _0x45582f.resolve(__dirname, "../gpt_status.json");
const chatHistoryFile = _0x45582f.resolve(__dirname, '../deepseek_history.json');

async function isOwner(_0x3fa2fa, _0x1bb3c8) {
const _0x47c325 = _0x1bb3c8.user.id.split(':')[0x0].replace(/\D/g, '');
const _0x74fcac = _0x3fa2fa.sender.split(':')[0x0].replace(/\D/g, '');
return _0x74fcac === _0x47c325;
}

async function readGptStatus() {
try {
const _0x1a0533 = await _0x34477e.readFile(gptStatusFile, "utf-8");
return JSON.parse(_0x1a0533);
} catch (_0x70d612) {
return { 'enabled': false };
}
}

async function writeGptStatus(_0x3732a0) {
try {
await _0x34477e.writeFile(gptStatusFile, JSON.stringify({ 'enabled': _0x3732a0 }, null, 2));
} catch (_0x5d47bd) {
console.error("❌ Error writing GPT status:", _0x5d47bd);
}
}

async function readChatHistory() {
try {
const _0x3293ce = await _0x34477e.readFile(chatHistoryFile, "utf-8");
return JSON.parse(_0x3293ce);
} catch (_0x171214) {
return {};
}
}

async function writeChatHistory(_0x4e1596) {
try {
await _0x34477e.writeFile(chatHistoryFile, JSON.stringify(_0x4e1596, null, 2));
} catch (_0x302a6c) {
console.error("Error writing chat history to file:", _0x302a6c);
}
}

async function updateChatHistory(_0x42f5cb, _0x518f27, _0x275808) {
if (!_0x42f5cb[_0x518f27]) {
_0x42f5cb[_0x518f27] = [];
}
_0x42f5cb[_0x518f27].push(_0x275808);
if (_0x42f5cb[_0x518f27].length > 20) {
_0x42f5cb[_0x518f27].shift();
}
await writeChatHistory(_0x42f5cb);
}

async function deleteChatHistory(_0x10bbaa, _0x446a2a) {
delete _0x10bbaa[_0x446a2a];
await writeChatHistory(_0x10bbaa);
}

const deepseek = async (_0xb1ff4a, _0xc5b8ec) => {
const _0x36c6f9 = await readGptStatus();
const _0x3abcfa = await readChatHistory();
const _0x313ed8 = _0xb1ff4a.body.trim().toLowerCase();

if (_0x313ed8 === "who are you" || _0x313ed8 === "what are you") {
await _0xc5b8ec.sendMessage(_0xb1ff4a.from, {
'text': "I'm CLOUD AI, developed by Bruce Bera and the Bera Tech team."
}, { 'quoted': _0xb1ff4a });
return;
}

if (_0x313ed8 === "/forget") {
await deleteChatHistory(_0x3abcfa, _0xb1ff4a.sender);
await _0xc5b8ec.sendMessage(_0xb1ff4a.from, {
'text': "🗑️ Conversation deleted successfully."
}, { 'quoted': _0xb1ff4a });
return;
}

if (_0x313ed8 === "deepseek on" || _0x313ed8 === "deepseek off") {
if (!(await isOwner(_0xb1ff4a, _0xc5b8ec))) {
await _0xc5b8ec.sendMessage(_0xb1ff4a.from, {
'text': "❌ Permission Denied! Only the bot owner can toggle GPT mode."
}, { 'quoted': _0xb1ff4a });
return;
}
const _0x5781fd = _0x313ed8 === "deepseek on";
await writeGptStatus(_0x5781fd);
await _0xc5b8ec.sendMessage(_0xb1ff4a.from, {
'text': "✅ GPT Mode has been " + (_0x5781fd ? "activated" : "deactivated") + '.'
}, { 'quoted': _0xb1ff4a });
return;
}

if (!_0x36c6f9.enabled) return;

if (_0x313ed8 === "gpt") {
await _0xc5b8ec.sendMessage(_0xb1ff4a.from, {
'text': "Please provide a prompt."
}, { 'quoted': _0xb1ff4a });
return;
}

try {
await _0xb1ff4a.React('💻');
const _0x22414c = "https://api.siputzx.my.id/api/ai/deepseek-llm-67b-chat?content=" + encodeURIComponent(_0x313ed8);
const _0xc04951 = await _0x32eabe(_0x22414c);
if (!_0xc04951.ok) throw new Error("HTTP error! status: " + _0xc04951.status);

const _0x388774 = await _0xc04951.json();  
const _0x39f6a9 = _0x388774.data;  

await updateChatHistory(_0x3abcfa, _0xb1ff4a.sender, { 'role': "user", 'content': _0x313ed8 });  
await updateChatHistory(_0x3abcfa, _0xb1ff4a.sender, { 'role': "assistant", 'content': _0x39f6a9 });  

await _0xc5b8ec.sendMessage(_0xb1ff4a.from, { 'text': _0x39f6a9 }, { 'quoted': _0xb1ff4a });  

const gttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(_0x39f6a9)}&tl=en&client=tw-ob`;  
const ttsRes = await _0x32eabe(gttsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });  
const ttsBuffer = await ttsRes.buffer();  
await _0xc5b8ec.sendMessage(_0xb1ff4a.from, {  
  audio: ttsBuffer,  
  mimetype: 'audio/mp4',  
  ptt: true  
}, { quoted: _0xb1ff4a });  

await _0xb1ff4a.React('✅');

} catch (_0x54f005) {
await _0xc5b8ec.sendMessage(_0xb1ff4a.from, {
'text': "Something went wrong, please try again."
}, { 'quoted': _0xb1ff4a });
console.error("Error fetching response:", _0x54f005);
await _0xb1ff4a.React('❌');
}
};

export default deepseek;
