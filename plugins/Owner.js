import _0x5f083d from '../../config.cjs';

const owner = async (_0x1b9510, _0xde7a32) => {
  const _0x5809fc = _0x1b9510.body.trim().toLowerCase();

  if (_0x5809fc.startsWith('owner')) { // Non-prefix trigger word
    const _0xownerNumbers = _0x5f083d.owner; // Fetch owners from config.cjs
    const _0xownerList = _0xownerNumbers.map(num => `▫ @${num.replace(/@.+/, '')}`).join("\n");

    const _0xmessage = `👑 *Bot Owner:*\n\n${_0xownerList}\n\n📌 *Contact for inquiries or support.*`;

    await _0xde7a32.sendMessage(_0x1b9510.from, { text: _0xmessage, mentions: _0xownerNumbers });
  }
};

export default owner;
