// commands/dpz.js
// .dpz command - sends 10 profile-style images at once
// Supports categories: girls, boys, mixed
// Usage: .dpz            -> sends mixed images
//        .dpz girls      -> sends girls images
//        .dpz boys       -> sends boys images
// Notes: uses Unsplash random queries for images. Replace with your own image list if desired.

module.exports = async function(...args) {
  const sock = args[0];
  const from = args[1];
  const msg = args[2];

  if (!sock || !from || !msg) {
    console.error('dpz: missing required arguments');
    return;
  }

  // Determine category either from explicit param (args[4]) or from message text
  let explicit = typeof args[4] === 'string' ? args[4].toLowerCase() : '';

  // Fallback: attempt to read the text body from message
  let body = '';
  try {
    body = (msg.message?.conversation) || (msg.message?.extendedTextMessage?.text) || '';
  } catch (e) {
    body = '';
  }
  
  const textParts = body.trim().split(/\s+/).filter(Boolean);
  const bodyArg = textParts[1] ? textParts[1].toLowerCase() : '';

  const category = (explicit === 'girls' || explicit === 'boys') ? explicit
                 : (bodyArg === 'girls' || bodyArg === 'boys') ? bodyArg
                 : 'mixed';

  const count = 10; // number of images to send

  // Helper to build image URL; uses Unsplash random query
  function buildUrl(cat, i) {
    if (cat === 'girls') return `https://source.unsplash.com/600x600/?girl&sig=${Date.now()}${i}`;
    if (cat === 'boys') return `https://source.unsplash.com/600x600/?boy&sig=${Date.now()}${i}`;
    // mixed: random between girl/boy/portrait
    const queries = ['portrait','person','face','girl','boy','model'];
    const q = queries[Math.floor(Math.random()*queries.length)];
    return `https://source.unsplash.com/600x600/?${q}&sig=${Date.now()}${i}`;
  }

  try {
    await sock.sendMessage(from, { text: `⏳ Preparing ${count} ${category === 'mixed' ? '' : category + ' '}DP images...` }, { quoted: msg });

    for (let i = 0; i < count; i++) {
      const url = buildUrl(category, i);
      try {
        await sock.sendMessage(from, { image: { url }, caption: `🖼️ DPZ ${i+1}/${count} (${category})` }, { quoted: msg });
      } catch (e) {
        // If direct URL sending fails, send the URL as text fallback
        try { await sock.sendMessage(from, { text: url }, { quoted: msg }); } catch (e2) { /* ignore */ }
      }
      // small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    await sock.sendMessage(from, { text: `✅ Sent ${count} ${category} DP images.` }, { quoted: msg });
  } catch (e) {
    console.error('dpz error', e);
    try {
      await sock.sendMessage(from, { text: `❌ Failed to send DP images: ${e && e.message ? e.message : String(e)}` }, { quoted: msg });
    } catch (e2) {
      console.error('dpz: failed to send error message', e2);
    }
  }
};
