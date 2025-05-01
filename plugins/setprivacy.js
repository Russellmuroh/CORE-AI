import pkg from '@shizodevs/shizoweb';
const { WA_DEFAULT_EPHEMERAL } = pkg;

const privacySettings = async (m, sock) => {
  const text = m.body?.trim();
  const triggers = ['privacy', 'setprivacy', 'privacysettings']; // Multiple trigger words
  const match = triggers.find(trigger => text.toLowerCase().startsWith(trigger));

  if (match) {
    const validValues = {
      lastseen: ['all', 'contacts', 'contact_blacklist', 'none'],
      online: ['all', 'match_last_seen'],
      picture: ['all', 'contacts', 'contact_blacklist', 'none'],
      status: ['all', 'contacts', 'contact_blacklist', 'none'],
      readreceipts: ['all', 'none'],
      groupsadd: ['all', 'contacts', 'contact_blacklist', 'none'],
      disappearingmode: [WA_DEFAULT_EPHEMERAL, 0, 86400, 604800, 7776000],
    };

    const args = text.slice(match.length).trim().split(/\s+/);
    const typeNumber = parseInt(args[0]);
    const valueNumber = parseInt(args[1]);

    const typeKeys = Object.keys(validValues);

    // Help message with trigger word examples
    const privacyTypes = typeKeys
      .map((type, index) => `${index + 1}. ${type}`)
      .join('\n');
    const helpMessage = 
      `🔒 *Privacy Settings*\n\n` +
      `Usage: _${triggers[0]} [type_number] [value_number]_\n\n` +
      `Example: _privacy 1 2_\n\n` +
      'Available Types:\n' +
      privacyTypes;

    if (!typeNumber || isNaN(typeNumber) || typeNumber < 1 || typeNumber > typeKeys.length) {
      await sock.sendMessage(m.from, { text: helpMessage }, { quoted: m });
      return;
    }

    const selectedType = typeKeys[typeNumber - 1];
    const validTypeValues = validValues[selectedType];

    const validTypeValuesList = validTypeValues
      .map((val, index) => `${index + 1}. ${val}`)
      .join('\n');
    const typeHelpMessage = 
      `🔧 ${selectedType.toUpperCase()} Options:\n\n` +
      validTypeValuesList +
      `\n\nExample: _${triggers[0]} ${typeNumber} 2_`;

    if (!valueNumber || isNaN(valueNumber) || valueNumber < 1 || valueNumber > validTypeValues.length) {
      await sock.sendMessage(m.from, { text: typeHelpMessage }, { quoted: m });
      return;
    }

    const selectedValue = validTypeValues[valueNumber - 1];
    const privacyType = selectedType.charAt(0).toUpperCase() + selectedType.slice(1);

    try {
      // Map types to their corresponding functions
      const privacyFunctions = {
        lastseen: sock.updateLastSeenPrivacy,
        online: sock.updateOnlinePrivacy,
        picture: sock.updateProfilePicturePrivacy,
        status: sock.updateStatusPrivacy,
        readreceipts: sock.updateReadReceiptsPrivacy,
        groupsadd: sock.updateGroupsAddPrivacy,
        disappearingmode: sock.updateDefaultDisappearingMode
      };

      if (privacyFunctions[selectedType]) {
        await privacyFunctions[selectedType](selectedValue);
        await sock.sendMessage(
          m.from,
          { text: `✅ Privacy ${privacyType} updated to: ${selectedValue}` },
          { quoted: m }
        );
      }
    } catch (error) {
      console.error('Privacy update error:', error);
      await sock.sendMessage(
        m.from,
        { text: `❌ Failed to update ${privacyType} privacy` },
        { quoted: m }
      );
    }
  }
};

export default privacySettings;
