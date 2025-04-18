import fetch from 'node-fetch';

export async function before(m, { conn }) {
  const text = m.text?.trim();
  if (!text?.toLowerCase().startsWith('generate')) return;

  const prompt = text.replace(/generate/i, '').trim();
  if (!prompt) return m.reply('Please provide a description after "generate"');

  await conn.sendMessage(m.chat, { react: { text: '🎬', key: m.key } });

  try {
    const response = await fetch('https://api.runwayml.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer key_9d7e68adb9b54db72f8a01c148681edbd49b47dad8c1d4db6f7393dcf95ab7757f608731391ea5d754a7d4b7154c1313e20992538de6cb2a8a6babe2d964a9d9',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "stable-video-diffusion",
        input: { prompt }
      })
    });

    const data = await response.json();
    const videoUrl = data?.result?.video_url;
    if (!videoUrl) return m.reply('Failed to generate video. Try again later.');

    const buffer = await (await fetch(videoUrl)).buffer();
    await conn.sendMessage(m.chat, {
      video: buffer,
      caption: `Here is your video for: *${prompt}*`,
    }, { quoted: m });

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
  } catch (err) {
    console.error(err);
    m.reply('An error occurred while generating the video.');
  }
}
