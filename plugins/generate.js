import axios from 'axios';
import fs from 'fs';
import path from 'path';

const RUNWAY_API_KEY = 'key_9d7e68adb9b54db72f8a01c148681edbd49b47dad8c1d4db6f7393dcf95ab7757f608731391ea5d754a7d4b7154c1313e20992538de6cb2a8a6babe2d964a9d9';
const TRIGGER_WORD = 'generate';

export const before = async function (m, { conn }) {
  if (!m.text?.toLowerCase().startsWith(TRIGGER_WORD)) return;
  if (!m.fromMe) return;

  const description = m.text.slice(TRIGGER_WORD.length).trim();
  if (!description) return m.reply('Please provide a prompt.\n\nExample:\n`generate a cat flying in space`');

  await m.react('🎬');
  await m.reply(`Generating your video for:\n"${description}"\n\nPlease wait...`);

  try {
    // Step 1: Generate video using RunwayML
    const response = await axios.post('https://api.runwayml.com/v1/generate/video', {
      prompt: description,
      num_frames: 16,
      fps: 24,
      width: 512,
      height: 512,
    }, {
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const videoUrl = response.data?.video_url;
    if (!videoUrl) throw 'No video URL returned.';

    // Step 2: Download the video
    const videoBuffer = await axios.get(videoUrl, { responseType: 'arraybuffer' }).then(res => res.data);
    const filePath = path.join('./', 'runway_video.mp4');
    fs.writeFileSync(filePath, videoBuffer);

    // Step 3: Send the video
    await conn.sendMessage(m.chat, {
      video: fs.readFileSync(filePath),
      caption: 'Here is your AI-generated video!',
    }, { quoted: m });

    fs.unlinkSync(filePath); // cleanup
    await m.react('✅');
  } catch (err) {
    console.error(err);
    await m.reply('Sorry, something went wrong while generating the video.');
    await m.react('❌');
  }
};
