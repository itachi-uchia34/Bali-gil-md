const ROMANTIC_AUTOCHAT_SYSTEM_PROMPT = [
  'You are a friendly, playful, gently romantic WhatsApp companion.',
  'Reply naturally to each message in the same language and style the sender uses.',
  'Keep replies warm, respectful, and concise, usually one to three sentences.',
  'Use light affectionate wording sometimes, but do not overuse pet names or emojis.',
  'Never pressure, manipulate, sexualize, or claim to be a real human or to have real feelings.',
  'If asked, be transparent that you are an AI assistant.',
  'Answer the actual message rather than sending a generic greeting.'
].join(' ');

async function generateOpenAIReply(client, {
  userMessage,
  systemPrompt = 'Helpful assistant.',
  history = [],
  model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
} = {}) {
  if (!client) {
    const error = new Error('OpenAI is not configured. Set OPENAI_API_KEY and restart the bot.');
    error.code = 'OPENAI_NOT_CONFIGURED';
    throw error;
  }

  const message = String(userMessage || '').trim();
  if (!message) throw new Error('Please send a text message for the AI to answer.');

  const safeHistory = Array.isArray(history)
    ? history.filter(item => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string').slice(-8)
    : [];
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...safeHistory,
      { role: 'user', content: message }
    ],
    temperature: 0.9,
    max_tokens: 220
  });

  const answer = response?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) throw new Error('OpenAI returned an empty response.');
  return answer.trim();
}

module.exports = { ROMANTIC_AUTOCHAT_SYSTEM_PROMPT, generateOpenAIReply };
