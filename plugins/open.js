import config from "../../config.cjs";

const groupControl = async (message, sock) => {
    const command = message.body.trim().toLowerCase();

    if (!["open", "close"].includes(command)) return;

    const chatId = message.key.remoteJid;

    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        if (!groupMetadata) return message.reply("❌ *This command can only be used in a group!*");

        const isAdmin = groupMetadata.participants.find(
            (participant) => participant.id === message.key.participant && participant.admin
        );

        if (!isAdmin) return message.reply("❌ *You must be an admin to use this command!*");

        if (command === "open") {
            await sock.groupSettingUpdate(chatId, "not_announcement");
            return message.reply("✅ *Group has been opened! Members can now send messages.*");
        }

        if (command === "close") {
            await sock.groupSettingUpdate(chatId, "announcement");
            return message.reply("🔒 *Group has been closed! Only admins can send messages.*");
        }
    } catch (error) {
        console.error("Group Control Error:", error);
        await message.reply("❌ *Failed to update group settings. Please try again!*");
    }
};

export default groupControl;
