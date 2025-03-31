import config from '../config.cjs';

const report = async (m, gss) => {
  try {
    // Split the message into command and arguments (math expression)
    const parts = m.body.trim().split(" ");
    const cmd = parts[0].toLowerCase();
    const text = parts.slice(1).join(" ").trim();

    // Valid commands
    const validCommands = ['cal', 'calc', 'calculate'];

    // Only proceed if the command is one of the valid ones
    if (!validCommands.includes(cmd)) return;

    let id = m.from;
    gss.math = gss.math ? gss.math : {};

    if (id in gss.math) {
      clearTimeout(gss.math[id][3]);
      delete gss.math[id];
      return m.reply('...');
    }

    // Clean up the math expression:
    let val = text
      .replace(/[^0-9\-\/+*×÷πEe()piPI.]/g, '') // Allow numbers, operators, and decimals
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π|pi/gi, 'Math.PI')
      .replace(/e/gi, 'Math.E')
      .replace(/\/+/g, '/')
      .replace(/\++/g, '+')
      .replace(/-+/g, '-');

    let format = val
      .replace(/Math\.PI/g, 'π')
      .replace(/Math\.E/g, 'e')
      .replace(/\//g, '÷')
      .replace(/\*/g, '×');

    let result = (new Function('return ' + val))();

    if (isNaN(result)) throw new Error('Invalid expression. Example: 17+19');

    m.reply(`*${format}* = _${result}_`);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return m.reply('Invalid syntax. Please check your expression.');
    } else if (error instanceof Error) {
      return m.reply(error.message);
    }
  }
};

export default report;
