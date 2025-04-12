const deleteChatHandler = async (m, { conn }) => {
  // Deletes the message that triggered this command
  await conn.chatModify(
    {
      delete: true,
      lastMessages: [
        {
          key: m.key,
          messageTimestamp: m.messageTimestamp,
        },
      ],
    },
    m.chat
  );

  // Sends a confirmation reply
  await m.reply("*✅ cloud ai  successfully deleted this chat message!*");
  await m.react('✅');
};

export default deleteChatHandler;
