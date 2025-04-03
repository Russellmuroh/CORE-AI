import pkg from '@whiskeysockets/baileys';
const { downloadMediaMessage } = pkg;
import config from '../../config.cjs';

const ProfileCommand = async (m, Matrix) => {
    const text = m.body.trim().split(' ');
    const cmd = text[0]?.toLowerCase();

    // Ensure the command trigger is either "profile" or "user"
    if (!["profile", "user"].includes(cmd)) return;

    try {
        // Ensure only the bot user can execute this
        if (m.sender !== Matrix.user.id) return;

        // Determine target user
        let userJid = m.quoted?.sender || 
                      m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                      m.sender;

        // Verify user exists
        const [user] = await Matrix.onWhatsApp(userJid).catch(() => []);
        if (!user?.exists) return m.reply("❌ User not found on WhatsApp");

        // Get profile picture
        let ppUrl;
        try {
            ppUrl = await Matrix.profilePictureUrl(userJid, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        // Get name from multiple sources
        let userName = userJid.split('@')[0];
        try {
            const presence = await Matrix.presenceSubscribe(userJid).catch(() => null);
            if (presence?.pushname) userName = presence.pushname;
        } catch (e) {
            console.log("Name fetch error:", e);
        }

        // Get bio/about
        let bio = {};
        try {
            const statusData = await Matrix.fetchStatus(userJid).catch(() => null);
            if (statusData?.status) {
                bio = {
                    text: statusData.status,
                    type: "Personal",
                    updated: statusData.setAt ? new Date(statusData.setAt * 1000) : null
                };
            }
        } catch (e) {
            console.log("Bio fetch error:", e);
        }

        // Format output
        const formattedBio = bio.text ? 
            `${bio.text}\n└─ 📌 ${bio.type} Bio${bio.updated ? ` | 🕒 ${bio.updated.toLocaleString()}` : ''}` : 
            "No bio available";

        const userInfo = `
*👤 USER PROFILE INFO*

📛 *Name:* ${userName}
🔢 *Number:* ${userJid.replace(/@.+/, '')}
📌 *Account Type:* ${user.isBusiness ? "💼 Business" : "👤 Personal"}

*📝 About:*
${formattedBio}

✅ *Registered:* ${user.isUser ? "Yes" : "No"}
🛡️ *Verified:* ${user.verifiedName ? "✅ Verified" : "❌ Not verified"}
`.trim();

        // Send result
        await Matrix.sendMessage(m.from, {
            image: { url: ppUrl },
            caption: userInfo,
            mentions: [userJid]
        }, { quoted: m });

    } catch (e) {
        console.error("Profile command error:", e);
        m.reply(`❌ Error: ${e.message || "Failed to fetch profile"}`);
    }
};

export default ProfileCommand;
