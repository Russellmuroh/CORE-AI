import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import config from '../config.cjs';
import axios from 'axios';

// Get total memory and free memory in bytes
const totalMemoryBytes = os.totalmem();
const freeMemoryBytes = os.freemem();

// Define unit conversions
const byteToKB = 1 / 1024;
const byteToMB = byteToKB / 1024;
const byteToGB = byteToMB / 1024;

// Function to format bytes to a human-readable format
function formatBytes(bytes) {
  if (bytes >= Math.pow(1024, 3)) {
    return (bytes * byteToGB).toFixed(2) + ' GB';
  } else if (bytes >= Math.pow(1024, 2)) {
    return (bytes * byteToMB).toFixed(2) + ' MB';
  } else if (bytes >= 1024) {
    return (bytes * byteToKB).toFixed(2) + ' KB';
  } else {
    return bytes.toFixed(2) + ' bytes';
  }
}

// Bot Process Time
const uptime = process.uptime();
const day = Math.floor(uptime / (24 * 3600)); // Calculate days
const hours = Math.floor((uptime % (24 * 3600)) / 3600); // Calculate hours
const minutes = Math.floor((uptime % 3600) / 60); // Calculate minutes
const seconds = Math.floor(uptime % 60); // Calculate seconds

// Uptime
const uptimeMessage = `I am alive now since ${day}d ${hours}h ${minutes}m ${seconds}s`;
const runMessage = `☀️ ${day} Day\n🕐 ${hours} Hour\n⏰ ${minutes} Minutes\n⏱️ ${seconds} Seconds`;

const xtime = moment.tz("Asia/Colombo").format("HH:mm:ss");
const xdate = moment.tz("Asia/Colombo").format("DD/MM/YYYY");
const time2 = moment().tz("Asia/Colombo").format("HH:mm:ss");
let pushwish = "";

if (time2 < "05:00:00") {
  pushwish = 'Good Morning 🌄';
} else if (time2 < "11:00:00") {
  pushwish = 'Good Morning 🌄';
} else if (time2 < "15:00:00") {
  pushwish = 'Good Afternoon 🌅';
} else if (time2 < "18:00:00") {
  pushwish = 'Good Evening 🌃';
} else if (time2 < "19:00:00") {
  pushwish = 'Good Evening 🌃';
} else {
  pushwish = 'Good Night 🌌';
}

// Main Menu function
const sendMenu = async (m, Matrix) => {
  const mainMenu = `
╭━━━〔 ${config.BOT_NAME} 〕━━━┈⊷
┃★╭──────────────
┃★│ Owner : ${config.OWNER_NAME}
┃★│ User : ${m.pushName}
┃★│ Baileys : Multi Device
┃★│ Type : NodeJs
┃★│ Mode : ${config.MODE === 'public' ? 'public' : 'private'}
┃★│ Platform : ${os.platform()}
┃★│ Prefix : [No Prefix]
┃★│ Version : 3.1.0
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷

> ${pushwish} ${m.pushName}!

╭━━〔 Menu List 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• 1. Download Menu
┃◈┃• 2. Converter Menu
┃◈┃• 3. AI Menu
┃◈┃• 4. Tools Menu
┃◈┃• 5. Group Menu
┃◈┃• 6. Search Menu
┃◈┃• 7. Main Menu
┃◈┃• 8. Owner Menu
┃◈┃• 9. Stalk Menu
┃◈┃•10. update
┃◈└───────────┈⊷
╰──────────────┈⊷

> Reply with the number (1-9)`;

  const menuImage = 'https://files.catbox.moe/7jt69h.jpg';  // Image URL

  // Send the main menu with image
  const sentMessage = await Matrix.sendMessage(m.from, {
    image: menuImage,
    caption: mainMenu,
    contextInfo: {
      mentionedJid: [m.sender]
    }
  });

  // Send audio after the menu
  await Matrix.sendMessage(m.from, {
    audio: { url: 'https://files.catbox.moe/ksvao4.mp3' },
    mimetype: 'audio/mp4',
    ptt: true
  });
};

// Handle menu responses
Matrix.ev.on('messages.upsert', async (event) => {
  const message = event.messages[0];

  if (!message?.message?.extendedTextMessage) return;

  const messageText = message.message.extendedTextMessage.text.trim().toLowerCase();

  // Trigger word is 'menu1'
  if (messageText === 'menu1') {
    await sendMenu(message, Matrix);
  }

  // Listen for menu selections after menu display
  if (message.message.extendedTextMessage.contextInfo?.stanzaId === sentMessage.key.id) {
    let menuResponse;
    let menuTitle;

    const receivedText = message.message.extendedTextMessage.text.trim();

    switch (receivedText) {
      case "1":
        menuTitle = "Download Menu";
        menuResponse = `
╭━━〔 Download Menu 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• apk
┃◈┃• facebook
┃◈┃• mediafire
┃◈┃• pinterestdl
┃◈┃• gitclone
┃◈┃• gdrive
┃◈┃• insta
┃◈┃• ytmp3
┃◈┃• ytmp4
┃◈┃• play
┃◈┃• song
┃◈┃• video
┃◈┃• ytmp3doc
┃◈┃• ytmp4doc
┃◈┃• tiktok
┃◈└───────────┈⊷
╰──────────────┈⊷`;
        break;

      case "2":
        menuTitle = "Converter Menu";
        menuResponse = `
╭━━〔 Converter Menu 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• attp
┃◈┃• attp2
┃◈┃• attp3
┃◈┃• ebinary
┃◈┃• dbinary
┃◈┃• emojimix
┃◈┃• mp3
┃◈└───────────┈⊷
╰──────────────┈⊷`;
        break;

      case "3":
        menuTitle = "AI Menu";
        menuResponse = `
╭━━〔 AI Menu 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• ai
┃◈┃• bug
┃◈┃• report
┃◈┃• gpt
┃◈┃• dalle
┃◈┃• remini
┃◈┃• gemini
┃◈└───────────┈⊷
╰──────────────┈⊷`;
        break;

      case "4":
        menuTitle = "Tools Menu";
        menuResponse = `
╭━━〔 Tools Menu 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• calculator
┃◈┃• tempmail
┃◈┃• checkmail
┃◈┃• trt
┃◈┃• tts
┃◈└───────────┈⊷
╰──────────────┈⊷`;
        break;

      case "5":
        menuTitle = "Group Menu";
        menuResponse = `
╭━━〔 Group Menu 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• linkgroup
┃◈┃• setppgc
┃◈┃• setname
┃◈┃• setdesc
┃◈┃• group
┃◈┃• gcsetting
┃◈┃• welcome
┃◈┃• add
┃◈┃• kick
┃◈┃• hidetag
┃◈┃• tagall
┃◈┃• antilink
┃◈┃• antitoxic
┃◈┃• promote
┃◈┃• demote
┃◈┃• getbio
┃◈└───────────┈⊷
╰──────────────┈⊷`;
        break;

      case "6":
        menuTitle = "Search Menu";
        menuResponse = `
╭━━〔 Search Menu 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• play
┃◈┃• yts
┃◈┃• imdb
┃◈┃• google
┃◈┃• gimage
┃◈┃• pinterest
┃◈┃• wallpaper
┃◈┃• wikimedia
┃◈┃• ytsearch
┃◈┃• ringtone
┃◈┃• lyrics
┃◈└───────────┈⊷
╰──────────────┈⊷`;
        break;

      case "7":
        menuTitle = "Main Menu";
        menuResponse = `
╭━━〔 Main Menu 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• ping
┃◈┃• alive
┃◈┃• info
┃◈┃• botinfo
┃◈┃• donate
┃◈┃• uptime
┃◈┃• support
┃◈┃• donate
┃◈┃• changelog
┃◈┃• help
┃◈┃• update
┃◈└───────────┈⊷
╰──────────────┈⊷`;
        break;

      case "8":
        menuTitle = "Owner Menu";
        menuResponse = `
╭━━〔 Owner Menu 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• addbot
┃◈┃• deletebot
┃◈┃• blacklist
┃◈┃• restart
┃◈┃• botstatus
┃◈┃• lockbot
┃◈┃• unlockbot
┃◈└───────────┈⊷
╰──────────────┈⊷`;
        break;

      case "9":
        menuTitle = "Stalk Menu";
        menuResponse = `
╭━━〔 Stalk Menu 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• stalkuser
┃◈┃• stalkprofile
┃◈┃• stalkstatus
┃◈┃• stalkgroup
┃◈┃• stalkchat
┃◈└───────────┈⊷
╰──────────────┈⊷`;
        break;

      default:
        menuTitle = "Invalid Option";
        menuResponse = "Please select a valid menu option (1-9).";
    }

    // Send the selected menu
    await Matrix.sendMessage(m.from, {
      text: menuResponse,
      contextInfo: {
        mentionedJid: [m.sender]
      }
    });
  }
});
