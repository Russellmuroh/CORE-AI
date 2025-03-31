
import config from '../config.cjs';

const modeCommand = async (m, Matrix) => {
    const botNumber = await Matrix.decodeJid(Matrix.user.id);
    const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);

    const text = m.body.trim().toLowerCase();

    if (text === 'mode public' || text === 'mode private') {
        if (!isCreator) {
            await Matrix.sendMessage(m.from, { text: "*OWNER COMMAND*" }, { quoted: m });
            return;
        }

        if (text === 'mode public') {
            Matrix.public = true;
            config.MODE = "public";
            await Matrix.sendMessage(m.from, { text: "Mode has been changed to *public*." }, { quoted: m });
        } else if (text === 'mode private') {
            Matrix.public = false;
            config.MODE = "private";
            await Matrix.sendMessage(m.from, { text: "Mode has been changed to *private*." }, { quoted: m });
        }
    }
};

export default modeCommand;