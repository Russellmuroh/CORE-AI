import ytSearch from 'yt-search';
import config from '../../config.cjs';

const dlSong2 = async (m, sock) => {
  const text = m.body.toLowerCase();
  const triggers = ['song', 'yta2'];
  const match = triggers.find(trigger => text.startsWith(trigger));

  if (match) {
    const query = m.body.slice(match.length).trim();
    const senderName = m.pushName || "User";

    if (!query) {
      return sock.sendMessage(m.from, { text: "🔎 Please provide a song name or YouTube link!" }, { quoted: m });
    }

    await sock.sendMessage(m.from, {
      text: `*_Hello Mr ${senderName}_*, *_please wait..._*\n*_CLOUD AI is downloading your song..._*`
    }, { quoted: m });

    try {
      const results = await ytSearch(query);
      if (!results.videos.length) {
        return sock.sendMessage(m.from, { text: "❌ No results found!" }, { quoted: m });
      }

      const video = results.videos[0];
      const { title, url, views, timestamp, ago, thumbnail } = video;

      await sock.sendMessage(m.from, {
        image: { url: thumbnail },
        caption: `🎶 *Title:* ${title}\n📅 *Published:* ${ago}\n⏱️ *Duration:* ${timestamp}\n👁️ *Views:* ${views}\n\n*_Downloading audio..._*`
      }, { quoted: m });

      const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp3?url=${url}`;
      const response = await fetch(apiUrl);
      const json = await response.json();

      if (!json.success || !json.result?.download_url) {
        return sock.sendMessage(m.from, { text: "❌ Failed to fetch download link!" }, { quoted: m });
      }

      await sock.sendMessage(m.from, {
        audio: { url: json.result.download_url },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
        ptt: false
      }, { quoted: m });

    } catch (err) {
      console.error("Error in song2 command:", err);
      await sock.sendMessage(m.from, { text: "❌ Please try using song3 or play command instead." }, { quoted: m });
    }
  }
};

export default dlSong2;
