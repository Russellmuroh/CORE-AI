import fetch from 'node-fetch';
import GIFBufferToVideoBuffer from '../lib/Gifbuffer.js';
import config from '../../config.cjs';

const getBuffer = async (url) => {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    console.error('Failed to get buffer', error);
    throw new Error('Failed to get buffer');
  }
};

const reactionHandler = async (m, sock) => {
  const command = m.text.split(' ')[0].slice(1).toLowerCase();
  const validCommands = [
    'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 
    'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 
    'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'happy', 
    'wink', 'poke', 'dance', 'cringe'
  ];

  if (!validCommands.includes(command)) return;

  let who;
  if (m.isGroup) {
    who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
  } else {
    who = m.chat;
  }

  if (!who) {
    return sock.sendMessage(
      m.from, 
      { text: `✳️ Tag or mention someone\n\n📌 Example : ${config.prefix}${command} @tag` },
      { quoted: m }
    );
  }

  const name = sock.getName(who);
  const name2 = sock.getName(m.sender);
  
  try {
    const reaction = await fetch(`https://api.waifu.pics/sfw/${command}`);
    if (!reaction.ok) throw await reaction.text();

    const json = await reaction.json();
    const gifBuffer = await getBuffer(json.url);
    const gifToVideoBuffer = await GIFBufferToVideoBuffer(gifBuffer);

    await sock.sendMessage(
      m.from,
      {
        video: gifToVideoBuffer,
        caption: `(${name2}) ${command} ${name}`,
        gifPlayback: true,
        gifAttribution: 0,
      },
      { quoted: m }
    );
  } catch (error) {
    console.error(error);
    await sock.sendMessage(
      m.from,
      { text: '❌ Failed to process reaction. Please try again later.' },
      { quoted: m }
    );
  }
};

export default reactionHandler;
