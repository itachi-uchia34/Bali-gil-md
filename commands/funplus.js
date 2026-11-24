const settings = require('../settings');

const pick = list => list[Math.floor(Math.random() * list.length)];
const send = (sock, from, msg, text, mentions = []) => sock.sendMessage(from, { text, mentions }, { quoted: msg });

function sender(msg) {
  return msg?.key?.participant || msg?.key?.remoteJid || '';
}

function display(jid) {
  return jid ? `@${jid.split('@')[0]}` : '@shinobi';
}

async function fortune(sock, from, msg) {
  const fortunes = [
    'The path is hidden, but your next decision will reveal it.',
    'A quiet ally will become important in your next battle.',
    'Your patience is stronger than the obstacles before you.',
    'The realm rewards those who act with discipline.',
    'A small victory today will become a greater legend tomorrow.'
  ];
  return send(sock, from, msg, `🔮 *BALI GIL FORTUNE*\n\n${pick(fortunes)}\n\n⚔️ Your destiny is still being written.`);
}

async function compatibility(sock, from, msg) {
  const percent = Math.floor(Math.random() * 101);
  const verdict = percent >= 80 ? 'Eternal alliance' : percent >= 55 ? 'Promising shinobi bond' : percent >= 30 ? 'Unstable alliance' : 'Rivals in the same battlefield';
  const target = sender(msg);
  return send(sock, from, msg, `❤️‍🔥 *SHINOBI COMPATIBILITY*\n\n${display(target)} and this realm\nScore: *${percent}%*\nVerdict: *${verdict}*`, target ? [target] : []);
}

async function madarafact(sock, from, msg) {
  const facts = [
    'Madara-themed wisdom: strategy defeats noise when the battlefield is crowded.',
    'The Sharingan sees patterns; the wise shinobi learns from them.',
    'Power without discipline creates chaos, not victory.',
    'A strong leader protects the realm while preparing for the next threat.',
    'The greatest illusion is believing that reality cannot be changed.'
  ];
  return send(sock, from, msg, `👁️ *BALI GIL WISDOM*\n\n${pick(facts)}`);
}

async function battle(sock, from, msg) {
  const moves = ['Perfect Susanoo', 'Wood Style ambush', 'Sharingan counter', 'Meteor decree', 'Shadow clone feint'];
  const first = pick(moves);
  const second = pick(moves);
  const winner = Math.random() > 0.5 ? 'You' : 'Madara';
  return send(sock, from, msg, `⚔️ *SHINOBI BATTLE*\n\nYour move: *${first}*\nMadara's move: *${second}*\n\n🏆 Winner: *${winner}*\n\n> The battlefield remembers every decision.`);
}

async function prediction(sock, from, msg, q) {
  const question = (q || 'Will I succeed?').trim();
  const answers = ['Yes, the path is open.', 'Not yet; prepare before you strike.', 'The outcome depends on your next choice.', 'A surprise will change the result.', 'The signs favor a disciplined attempt.'];
  return send(sock, from, msg, `🪬 *BALI GIL PREDICTION*\n\nQuestion: *${question}*\nAnswer: *${pick(answers)}*`);
}

async function shinobiquiz(sock, from, msg) {
  const quizzes = [
    ['What does a disciplined shinobi value most?', 'Strategy'],
    ['Which eye technique is associated with Madara?', 'Sharingan'],
    ['What should a leader protect?', 'The realm'],
    ['What defeats careless power?', 'Discipline']
  ];
  const [question, answer] = pick(quizzes);
  return send(sock, from, msg, `🧠 *SHINOBI QUIZ*\n\n${question}\n\nReply with your answer.\nAnswer key: ||${answer}||`);
}

async function roastme(sock, from, msg) {
  const roasts = ['Even a shadow clone has more presence than you.', 'Your battle plan needs a battle plan.', 'The Sharingan saw your message and looked away.', 'You entered the realm with confidence and left with a tutorial.'];
  return send(sock, from, msg, `🔥 *BALI GIL ROAST*\n\n${display(sender(msg))}, ${pick(roasts)}`, sender(msg) ? [sender(msg)] : []);
}

async function praise(sock, from, msg) {
  const praiseLines = ['Your presence makes the entire realm sharper.', 'Even Madara would respect that level of determination.', 'Your strategy is calm, precise, and dangerous.', 'The shinobi realm needs more people with your courage.'];
  return send(sock, from, msg, `🌟 *SHINOBI PRAISE*\n\n${display(sender(msg))}, ${pick(praiseLines)}`, sender(msg) ? [sender(msg)] : []);
}

module.exports = { fortune, compatibility, madarafact, battle, prediction, shinobiquiz, roastme, praise };
