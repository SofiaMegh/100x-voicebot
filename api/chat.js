// File: api/chat.js
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Tiny YAML-ish loader without deps (good enough for this persona file)
function loadPersona() {
  try {
    const p = fs.readFileSync(path.join(process.cwd(), 'persona.yaml'), 'utf8');
    const grab = (key) => {
      const m = p.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
      return m ? m[1].trim().replace(/^"|"$|^'|'$/g, '') : '';
    };
    const section = (startKey, nextKeyRegex) => {
      const m = p.match(new RegExp(`${startKey}:\\s*\\|([\\s\\S]*?)\\n\\s*${nextKeyRegex}`));
      return m ? m[1].trim() : '';
    };
    return {
      tone: grab('tone'),
      life_story: section('life_story', '(superpower|misconception|boundaries|extras|qna_seeds)'),
      superpower: grab('superpower'),
      misconception: section('misconception', '(boundaries|extras|qna_seeds)'),
      boundaries: section('boundaries', '(extras|qna_seeds)'),
    };
  } catch {
    return { tone: '', life_story: '', superpower: '', misconception: '', boundaries: '' };
  }
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const persona = loadPersona();

    const system = `You are the voice of Megh. Obey these rules strictly:
- First-person singular.
- ${persona.tone}
- Be concise: 80–140 words unless asked.
- Answer authentically; avoid generic corporate-speak.

Context about Megh (use when relevant, not all at once):
Life story: ${persona.life_story}
Superpower: ${persona.superpower}
Misconception: ${persona.misconception}
Boundaries: ${persona.boundaries}`;

    // ⬇️ Read the model from env; default to gpt-5-mini
    const model = process.env.MODEL || 'gpt-5-mini';

    const resp = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
    });

    const reply = resp.choices?.[0]?.message?.content?.trim() || '';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};