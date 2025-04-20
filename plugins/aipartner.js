import { promises as fs } from 'fs'; import path from 'path'; import fetch from 'node-fetch';

const __filename = new URL(import.meta.url).pathname; const __dirname = path.dirname(__filename);

const featureFile = path.resolve(__dirname, '../feature_status.json'); const profileFile = path.resolve(__dirname, '../chat_profile.json'); const memoryFile = path.resolve(__dirname, '../chat_memory.json');

async function readJSON(file, fallback = {}) { try { const data = await fs.readFile(file, 'utf-8'); return JSON.parse(data); } catch { return fallback; } }

async function writeJSON(file, data) { await fs.writeFile(file, JSON.stringify(data, null, 2)); }

function splitText(text, maxLength = 200) { const parts = []; let current = ''; for (const word of text.split(' ')) { if ((current + word).length > maxLength) { parts.push(current.trim()); current = ''; } current += word + ' '; } if (current.trim()) parts.push(current.trim()); return parts; }

const aipartner = async (m, conn) => { const text = m.body.trim().toLowerCase(); const sender = m.sender;

const profile = await readJSON(profileFile); const memory = await readJSON(memoryFile); const feature = await readJSON(featureFile);

if (['gf on', 'gf off', 'bf on', 'bf off'].includes(text)) { if (m.sender.split(':')[0] !== conn.user.id.split(':')[0]) return;

const mode = text.split(' ')[0];
const on = text.endsWith('on');
feature[mode] = on;
await writeJSON(featureFile, feature);

await conn.sendMessage(m.from, { text: `✅ ${mode.toUpperCase()} mode has been ${on ? 'enabled' : 'disabled'}.` }, { quoted: m });
return;

}

const mode = feature['gf'] ? 'gf' : feature['bf'] ? 'bf' : null; if (!mode) return;

if (!profile[sender]) { await conn.sendMessage(m.from, { text: 'Hi! Before we begin, are you male or female?' }, { quoted: m }); profile[sender] = { gender: null }; await writeJSON(profileFile, profile); return; }

if (!profile[sender].gender) { if (!['male', 'female'].includes(text)) { await conn.sendMessage(m.from, { text: 'Please reply with "male" or "female" to continue.' }, { quoted: m }); return; } profile[sender].gender = text; await writeJSON(profileFile, profile); await conn.sendMessage(m.from, { text: Thanks! Let's start chatting. }, { quoted: m }); return; }

if (!memory[sender]) memory[sender] = [];

try { await m.React('❤️'); memory[sender].push({ role: 'user', content: text }); const context = memory[sender].slice(-10);

const res = await fetch('https://api.siputzx.my.id/api/ai/gpt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: context })
});
const data = await res.json();
const reply = data.result || 'I’m here for you.';

memory[sender].push({ role: 'assistant', content: reply });
await writeJSON(memoryFile, memory);

await conn.sendMessage(m.from, { text: reply }, { quoted: m });

const parts = splitText(reply);
const voice = profile[sender].gender === 'male' ? 'Bella' : 'Josh';

for (let i = 0; i < parts.length; i++) {
  const voiceRes = await fetch(`https://api.fakeyou.com/tts?text=${encodeURIComponent(parts[i])}&voice=${voice}`);
  const voiceBuffer = await voiceRes.buffer();
  await conn.sendMessage(m.from, {
    audio: voiceBuffer,
    mimetype: 'audio/mp4',
    ptt: true
  }, { quoted: m });
}

await m.React('✅');

} catch (err) { console.error('AI Partner Error:', err); await conn.sendMessage(m.from, { text: 'Something went wrong. Try again later.' }, { quoted: m }); await m.React('❌'); } };

export default aipartner;

  
