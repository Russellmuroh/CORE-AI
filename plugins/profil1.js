import pkg from '@whiskeysockets/baileys';
const { fetchStatus, profilePictureUrl } = pkg;
import config from '../../config.cjs';

const ProfileCommand = async (m, Matrix) => {
    const text = m.body?.trim().toLowerCase();
    
    // Check if command is "profile" or "user"
    if (!["profile", "user"].includes(text)) return;

    // Ensure only the bot user can use this command
    if (m.sender !== Matrix.user.id) {
        return m.reply("❌ You are not authorized to use this command.");
    }

    try {
        // Determine target user
        let userJid = m.quoted?.sender || 
                      m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                      m.sender;

        // Verify user exists on WhatsApp
        const [user] = await Matrix.onWhatsApp(userJid).catch(() => []);
        if (!user?.exists) return m.reply("❌ User not found on WhatsApp");

        // Get profile picture
        let ppUrl;
        try {
            ppUrl = await profilePictureUrl(userJid, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        // Get user name
        let userName = userJid.split('@')[0];
        try {
            const presence = await Matrix.presenceSubscribe(userJid).catch(() => null);
            if (presence?.pushname) userName = presence.pushname;
        } catch (e) {}

        // Get bio/about
        let bioText = "No bio available";
        try {
            const statusData = await fetchStatus(userJid).catch(() => null);
            if (statusData?.status) {
                bioText = `${statusData.status} \n📌 Updated: ${new Date(statusData.setAt * 1000).toLocaleString()}`;
            }
        } catch (e) {}

        // Format and send result
        const userInfo = `
*👤 USER PROFILE INFO*

📛 *Name:* ${userName}
🔢 *Number:* ${userJid.replace(/@.+/, '')}
📌 *Account Type:* ${user.isBusiness ? "💼 Business" : "👤 Personal"}
📝 *Bio:* ${bioText}

✅ *Registered:* ${user.isUser ? "Yes" : "No"}
🛡️ *Verified:* ${user.verifiedName ? "✅ Verified" : "❌ Not verified"}
`.trim();

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
