import Obf from "javascript-obfuscator";
import config from '../../config.cjs';

const EncryptCode = async (context) => {
    const { m, Matrix } = context;

    // Check if the message contains the trigger word 'encrypt'
    const text = m.message.conversation || '';
    if (text.toLowerCase() === 'encrypt') {
        // Check if there is a quoted message with JavaScript code
        if (m.quoted && m.quoted.text) {
            const forq = m.quoted.text;

            try {
                // Obfuscate the code
                const obfuscationResult = Obf.obfuscate(forq, {
                    compact: true,
                    controlFlowFlattening: true,
                    controlFlowFlatteningThreshold: 1,
                    numbersToExpressions: true,
                    simplify: true,
                    stringArrayShuffle: true,
                    splitStrings: true,
                    stringArrayThreshold: 1
                });

                // Log success and send obfuscated code to the user
                console.log("Successfully encrypted the code");
                await Matrix.sendMessage(m.key.remoteJid, {
                    text: `Here is the obfuscated JavaScript code:\n\n${obfuscationResult.getObfuscatedCode()}`
                });
            } catch (error) {
                console.error("Error during obfuscation:", error);
                await Matrix.sendMessage(m.key.remoteJid, {
                    text: "Sorry, there was an error while obfuscating the code."
                });
            }
        } else {
            // If no quoted text is found, prompt the user to tag valid JavaScript code
            await Matrix.sendMessage(m.key.remoteJid, {
                text: "Please tag a valid JavaScript code to encrypt!"
            });
        }
    }
};

export default EncryptCode;
