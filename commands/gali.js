const pick = list => list[Math.floor(Math.random() * list.length)];

const GALIS = [
  'your battle plan has more loading screens than victories.',
  'even a shadow clone has more presence than you.',
  'your confidence entered the room before your common sense.',
  'the Sharingan saw your message and politely looked away.',
  'you are the final boss of unfinished tasks.',
  'your strategy is just guessing with dramatic music.',
  'the realm called; it wants its missing logic back.',
  'you bring tutorial-level energy to a legendary battlefield.',
  'your brain is running on one tired scroll and no backup.',
  'even your excuses need better choreography.',
  'you have the patience of a notification waiting to be opened.',
  'you are proof that confidence can survive without evidence.',
  'your timing is so late even the echo has arrived first.',
  'the village gate has better organization than your thoughts.',
  'you turned a simple mission into a five-season filler arc.',
  'your inner shinobi is currently stuck on the loading screen.',
  'you have the tactical awareness of a kunai thrown backward.',
  'your message brought noise but forgot to bring meaning.',
  'even Madara would ask you to read the instructions first.',
  'your common sense took a day off and never returned.',
  'you are the human version of a weak Wi-Fi signal.',
  'your logic is doing hand signs but nothing is happening.',
  'you entered the battlefield with a spoon and a speech.',
  'your plan has more plot holes than a genjutsu nightmare.',
  'you are not lost; you are exploring the wrong direction confidently.',
  'your genius is currently under maintenance.',
  'the scroll of your ideas has mostly empty pages.',
  'you make simple problems feel like forbidden jutsu.',
  'your reply speed is legendary, unfortunately in the wrong direction.',
  'even your shadow needs a map to follow you.',
  'your attention span got defeated by a two-line message.',
  'you have the energy of a boss fight that forgot the boss.',
  'your jokes arrive wearing training wheels.',
  'you are the reason the mute button was invented.',
  'your argument has no chakra and even less evidence.',
  'the battlefield is wide, yet you still missed the point.',
  'your plan is so secret even you were not informed.',
  'you are a walking side quest with no reward.',
  'your brain opened seventeen tabs and lost the important one.',
  'you bring dramatic entrances to very ordinary conclusions.',
  'your confidence is premium, but your results are still buffering.',
  'even a clone would request a different assignment.',
  'you have mastered the art of being confidently incorrect.',
  'your thoughts are doing parkour without reaching a conclusion.',
  'you are the plot twist nobody prepared for.',
  'your focus disappears faster than a smoke bomb.',
  'you have the strategic depth of a shallow puddle.',
  'your notifications have more direction than your life plan.',
  'you brought a storm to a conversation and forgot the rain.',
  'your ideas are rare because they keep escaping.',
  'you are a legendary shinobi of unnecessary explanations.',
  'your compass points toward confusion with perfect accuracy.',
  'even your autocorrect is tired of saving you.',
  'you made a simple entrance look like a diplomatic crisis.',
  'your battle cry needs subtitles and a clearer mission.',
  'you are the undefeated champion of almost getting it.',
  'your patience has the lifespan of a disappearing message.',
  'you have more confidence than completed assignments.',
  'your brain is buffering at the speed of a sleepy turtle.',
  'you are a surprise attack against everyone’s peace and quiet.',
  'the realm has seen many rivals, but none this creatively confused.',
  'your logic took a wrong turn at the village gate.',
  'you are a walking reminder to double-check the plan.',
  'even your mistakes arrive with unnecessary confidence.',
  'your strategy needs a strategy and probably a snack.',
  'you have the subtlety of a meteor entering a library.',
  'your sense of direction is loyal to the wrong destination.',
  'you are the human equivalent of a password hint that says nothing.',
  'your timing could make a calendar feel impatient.',
  'you turned a calm chat into a low-budget war council.',
  'your ideas have entered the realm but forgotten their passports.',
  'you have the dramatic power of a ringtone at midnight.',
  'your plan is held together by hope and suspicious punctuation.',
  'even a training dummy would request a rematch with your logic.',
  'you are a champion of starting strong and ending somewhere else.',
  'your focus is a rogue ninja with no return address.',
  'you make confusion look like an official fighting style.',
  'your brain is currently accepting applications for useful thoughts.',
  'you have the accuracy of a blindfolded paper airplane.',
  'your confidence keeps winning battles that never happened.',
  'you are the reason every mission needs a backup plan.',
  'your explanations take the scenic route to nowhere.',
  'even your silence would benefit from better timing.',
  'you are an unexpected update with no visible improvements.',
  'your logic is a genjutsu, because nobody can find it.',
  'you bring main-character energy to a background role.',
  'your decision-making process is powered by coin flips and vibes.',
  'you have the battle aura of a sleepy house cat.',
  'the scroll says “try again,” and honestly it has a point.',
  'your plan was bold, mysterious, and completely unavailable.',
  'you are the shinobi equivalent of a typo in a royal decree.',
  'your focus left the chat before you did.',
  'even your backup plan is asking for backup.',
  'you have perfected the art of making easy things legendary.',
  'your battlefield report needs fewer chapters and more facts.',
  'you are a rare combination of speed, noise, and no destination.',
  'the realm respects your confidence but questions your map.',
  'your strategy is still in beta, but the bugs are very confident.',
  'you are the final form of “I forgot what I was saying.”',
  'your legendary status is currently awaiting verification.'
];

module.exports = async function gali(sock, from, msg, session, args = []) {
  const requested = args.join(' ').trim();
  const target = msg?.mentionedJid?.[0] || msg?.quoted?.sender || null;
  if (!target && !requested) {
    return sock.sendMessage(from, {
      text: '🔥 *MADARA GALI ARENA*\n\nExample: `.gali @user` or reply to a message with `.gali`.\n\n100 playful roast styles are available.'
    }, { quoted: msg });
  }

  const label = target ? `@${target.split('@')[0]}` : requested;
  const roast = pick(GALIS).replaceAll('your', `${label}'s`);
  const text = `🔥 *MADARA GALI ARENA*\n\n${label}, ${roast}\n\n> Playful shinobi roast — no hate, no protected-class insults.`;
  const options = { text };
  if (target) options.mentions = [target];

  try {
    await sock.sendMessage(from, { react: { text: '🤬', key: msg.key } });
  } catch (_) {}
  return sock.sendMessage(from, options, { quoted: msg });
};

module.exports.count = GALIS.length;
