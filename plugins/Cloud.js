import fetch from 'node-fetch';

const LyricsFetcher = async (m, { conn }) => {
  const body = m.body.toLowerCase();
  if (!m.key.fromMe || !body.startsWith('lyrics') && !body.startsWith('lyric')) return;

  const query = m.body.slice(body.startsWith('lyrics') ? 6 : 5).trim();
  if (!query) return m.reply('❌ *Please provide a song title.*\n\nExample: `lyrics faded`');

  await m.react('🎵');

  try {
    // Fetch lyrics
    const lyricsRes = await fetch(`https://api.dreaded.site/api/lyrics?title=${encodeURIComponent(query)}`);
    const lyricsData = await lyricsRes.json();

    if (!lyricsData?.lyrics) {
      await m.react('❌');
      return m.reply(`❌ *Lyrics not found for:* ${query}`);
    }

    await m.reply(`🎼 *Lyrics for:* ${lyricsData.title || query}\n\n${lyricsData.lyrics}`);
    
    // Fetch and send audio
    const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)} song`;
    const ytidRes = await fetch(`https://noembed.com/embed?url=${ytSearch}`);
    const yturl = ytidRes.url || `https://youtube.com/watch?v=60ItHLz5WEA`; // fallback

    const musicRes = await fetch(`https://apis.davidcyriltech.my.id/download/ytmp3?url=${yturl}`);
    const music = await musicRes.json();

    if (!music?.result?.url) {
      await m.react('❌');
      return m.reply(`❌ *Unable to download audio for:* ${query}`);
    }

    await conn.sendMessage(m.chat, {
      audio: { url: music.result.url },
      mimetype: 'audio/mpeg',
      ptt: false,
      fileName: 'Core AI'
    }, { quoted: m });

    await m.react('✅');

  } catch (e) {
    console.error('Lyrics/Music Fetch Error:', e);
    await m.react('❌');
    m.reply('❌ *An error occurred while fetching data.*');
  }
};

export default LyricsFetcher;
