# 100x – Voice Bot (Megh)

A simple, user-friendly voice chatbot for Stage 1. Mic input + spoken output in the browser, with a serverless LLM backend (OpenAI). No API key on the client.

## Deploy (Vercel)
1. Push this folder to a GitHub repo.
2. Import the repo into Vercel (or use `vercel` CLI).
3. Add env var `OPENAI_API_KEY`.
4. Deploy → share the production URL.

## Try It
- Click 🎙️ Start, ask a question → bot replies and speaks back.
- If mic is blocked or unsupported, use the text input.

## Why this design
- **No key on client** → secure.
- **Zero install** → works in a regular browser.
- **Voice both ways** → inclusive for non-technical users.
- **Persona file** → consistent, authentic answers.
