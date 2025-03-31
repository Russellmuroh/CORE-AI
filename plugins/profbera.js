import axios from "axios";
import config from "../../config.cjs";

const shortenUrl = async (m, sock) => {
  const cmd = m.body.trim().split(" ")[0].toLowerCase();

  const validCommands = ["shortenurl", "urlshortener", "shorten"];
  if (!validCommands.includes(cmd)) return;

  const url = m.body.split(" ")[1];

  if (!url) {
    return await sock.sendMessage(
      m.from,
      { text: "❌ Please provide a URL to shorten. Example: *shortenurl https://github.com/DEVELOPER-BERA/CLOUD-AI*" },
      { quoted: m }
    );
  }

  const apiUrl = `https://bk9.fun/tools/shorten?url=${encodeURIComponent(url)}`;

  try {
    await m.React("⏳"); // React with a loading icon

    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.status === true && data.BK9) {
      const originalUrl = data.BK9.origin;
      const shortenedUrl = data.BK9.url;

      const responseText = `🔗 *URL Shortened*\n\n🌐 Original URL: *${originalUrl}*\n➡️ Shortened URL: *${shortenedUrl}*\n\n💡 _Tap and hold on the shortened URL to copy it._\n\nRegards, Bruce Bera`;

      await sock.sendMessage(
        m.from,
        {
          text: responseText,
          contextInfo: {
            isForwarded: false,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "@newsletter",
              newsletterName: "",
              serverMessageId: -1,
            },
            forwardingScore: 999, // Score to indicate it has been forwarded
            externalAdReply: {
              title: "Regards, Bruce Bera",
              body: "URL Shortener Service",
              thumbnailUrl: "", // Add thumbnail URL if required
              sourceUrl: "", // Source URL
              mediaType: 1,
              renderLargerThumbnail: false,
            },
          },
        },
        { quoted: m }
      );
    } else {
      throw new Error("Invalid response from the API");
    }
  } catch (error) {
    console.error("Error:", error); // Log the full error for debugging

    await sock.sendMessage(
      m.from,
      {
        text: `❌ Error shortening URL: ${error.message}`,
        contextInfo: {
          externalAdReply: {
            title: "Regards, Bruce Bera",
            body: "URL Shortener Service",
            sourceUrl: "",
            mediaType: 1,
          },
        },
      },
      { quoted: m }
    );
  }
};

export default shortenUrl;
