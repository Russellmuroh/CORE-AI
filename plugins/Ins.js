import axios from "axios";
import config from "../config.cjs";

const instagram = async (m, Matrix) => {
  const body = m.body.toLowerCase().trim();
  const validTriggers = ["ig", "insta", "instagram"];
  const triggerUsed = validTriggers.find(trigger => body.startsWith(trigger));

  if (!triggerUsed) return;

  const query = m.body.slice(triggerUsed.length).trim();

  if (!query || !query.startsWith("http")) {
    return Matrix.sendMessage(m.from, { text: "❌ *Usage:* ig <Instagram URL>" }, { quoted: m });
  }

  try {
    await Matrix.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

    const { data } = await axios.get(`https://api.davidcyriltech.my.id/instagram?url=${query}`);

    if (!data.success || !data.downloadUrl) {
      return Matrix.sendMessage(m.from, { text: "⚠️ *Failed to fetch Instagram video. Please try again.*" }, { quoted: m });
    }

    await Matrix.sendMessage(m.from, {
      video: { url: data.downloadUrl },
      mimetype: "video/mp4",
      caption: "📥 *Instagram Video Fetched Successfully!*",
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true
      },
    }, { quoted: m });

    await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("Instagram Downloader Error:", error);
    Matrix.sendMessage(m.from, { text: "❌ *An error occurred while processing your request. Please try again later.*" }, { quoted: m });
  }
};

export default instagram;
