import fetch from 'node-fetch'

let handler = async (m, { conn, args, text }) => {
  if (m.sender !== conn.user.jid) return // Only bot user access

  const triggerWords = [
    'logololi', 'graffiti2', '3dbox', 'future', 'ninja', 'marvel', 'paper', 'glitch', 'neon', 'green',
    'halloween', 'american', 'devil', 'wolf', 'phlogo', 'transformer', 'thunder', 'graffiti',
    'bpink', 'joker', 'matrix', 'glow', 'ballon', 'dmd', 'lightglow'
  ]

  const command = m.body?.toLowerCase().trim()
  if (!triggerWords.includes(command)) return

  const mssg = {
    notext: 'Please provide some text.',
    example: 'Example',
    textSe: 'Use `+` to separate two parts',
    result: 'Here you go!',
  }

  const botName = 'BERA'
  const rwait = '⏳'
  const done = '✅'

  let tee = `✳️ ${mssg.notext}\n\n📌 ${mssg.example}: *${command}* FG98`
  let too = `✳️ ${mssg.textSe} *+* \n\n📌 ${mssg.example}: \n*${command}* fgmods *+* ${botName}`
  await m.react(rwait)

  let img
  switch (command) {
    case 'logololi':
      if (!text) throw tee
      img = global.API('fgmods', '/api/maker/loli', { text }, 'apikey')
      break
    case 'neon':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/neon', { text }, 'apikey')
      break
    case 'devil':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/devil', { text }, 'apikey')
      break
    case 'transformer':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/transformers', { text }, 'apikey')
      break
    case 'thunder':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/thunder', { text }, 'apikey')
      break
    case 'graffiti':
      if (!text.includes('+')) throw too
      var [c, d] = text.split`+`
      img = global.API('fgmods', '/api/textpro/graffiti', { text: c, text2: d }, 'apikey')
      break
    case 'bpink':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/blackpink', { text }, 'apikey')
      break
    case 'joker':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/joker', { text }, 'apikey')
      break
    case 'matrix':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/matrix', { text }, 'apikey')
      break
    case 'wolf':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/logowolf', { text: 'FG98', text2: text }, 'apikey')
      break
    case 'glow':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/advancedglow', { text }, 'apikey')
      break
    case 'phlogo':
      if (!text.includes('+')) throw too
      var [a, b] = text.split`+`
      img = global.API('fgmods', '/api/textpro/pornhub', { text: a, text2: b }, 'apikey')
      break
    case 'ballon':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/ballon', { text }, 'apikey')
      break
    case 'dmd':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/diamond', { text }, 'apikey')
      break
    case 'lightglow':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/lightglow', { text }, 'apikey')
      break
    case 'american':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/American-flag', { text }, 'apikey')
      break
    case 'halloween':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/halloween', { text }, 'apikey')
      break
    case 'green':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/green-horror', { text }, 'apikey')
      break
    case 'glitch':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/impressive-glitch', { text }, 'apikey')
      break
    case 'paper':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/art-paper-cut', { text }, 'apikey')
      break
    case 'marvel':
      if (!text.includes('+')) throw too
      var [e, f] = text.split`+`
      img = global.API('fgmods', '/api/textpro/marvel', { text: e, text2: f }, 'apikey')
      break
    case 'ninja':
      if (!text.includes('+')) throw too
      var [g, h] = text.split`+`
      img = global.API('fgmods', '/api/textpro/ninja', { text: g, text2: h }, 'apikey')
      break
    case 'future':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/futuristic', { text }, 'apikey')
      break
    case '3dbox':
      if (!text) throw tee
      img = global.API('fgmods', '/api/textpro/3dboxtext', { text }, 'apikey')
      break
    case 'graffiti2':
      if (!text.includes('+')) throw too
      var [i, j] = text.split`+`
      img = global.API('fgmods', '/api/textpro/graffiti2', { text: i, text2: j }, 'apikey')
      break
    default:
      return
  }

  if (img) {
    await conn.sendFile(m.chat, img, 'logo.png', `✅ regards ${botName}`, m)
    await m.react(done)
  }
}

handler.customPrefix = /^(logololi|graffiti2|3dbox|future|ninja|marvel|paper|glitch|neon|green|halloween|american|devil|wolf|phlogo|transformer|thunder|graffiti|bpink|joker|matrix|glow|ballon|dmd|lightglow)$/i
handler.command = new RegExp // disables command-style prefix
handler.help = ['textfx'].map(v => v + ' [text]')
handler.tags = ['tools']
handler.diamond = true

export default handler
