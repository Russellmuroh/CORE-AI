import config from '../../config.cjs';

const setProfilePicture = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
    
    const cmd = m.body.trim().toLowerCase(); // Normalize input

    if (!['pp', 'fullpp', 'setfullpp'].includes(cmd)) return; // Trigger words only
    
    await m.React('⏳');

    if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");

    // Check if the message has a quoted image
    const quotedMessage = m.quoted || null;

    if (!quotedMessage || !(quotedMessage.mimetype && quotedMessage.mimetype.startsWith('image/')) && quotedMessage.mtype !== 'imageMessage') {
      return m.reply("Please reply with an image to set as your profile picture.");
    }

    // Download the image from the quoted message
    const image = await quotedMessage.download();

    if (!image) {
      return m.reply("No image found. Please make sure you are replying to an image.");
    }

    // Set the profile picture
    await gss.updateProfilePicture(gss.user.id, image)
      .then(() => m.reply("Profile picture updated successfully!"))
      .catch((err) => m.reply(`Failed to update profile picture: ${err.message}`));

    await m.React('✅️');
  } catch (error) {
    console.error('Error:', error);
    m.reply('An error occurred while processing the command.');
  }
};

export default setProfilePicture;
