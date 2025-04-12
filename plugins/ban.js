const banUserHandler = async (m, { conn, usedPrefix, command }) => {
  let who;
  if (m.isGroup) {
    who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
  } else {
    who = m.chat;
  }

  if (!who) {
    return m.reply(`✳️ Tag or mention someone\n\n📌 Example : ${usedPrefix + command} @user`);
  }

  // Ban the mentioned user
  global.db.data.users[who].banned = true;

  // Send confirmation
  await conn.reply(
    m.chat,
    `✅ BANNED\n\n───────────\n@${who.split`@`[0]} you will no longer be able to use my commands.`,
    m,
    { mentions: [who] }
  );
  await m.react('✅');
};

export default banUserHandler;
