import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// YAML-like persona loader
function loadPersona() {
  try {
    const p = fs.readFileSync(path.join(process.cwd(), "persona.yaml"), "utf8");
    const grab = (key) => {
      const m = p.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
      return m ? m[1].trim().replace(/^"|"$|^'|'$/g, "") : "";
    };
    const section = (startKey, nextKeyRegex) => {
      const m = p.match(
        new RegExp(`${startKey}:\\s*\\|([\\s\\S]*?)\\n\\s*${nextKeyRegex}`)
      );
      return m ? m[1].trim() : "";
    };
    return {
      tone: grab("tone"),
      life_story: section("life_story", "(superpower|misconception|boundaries|extras|qna_seeds)"),
      superpower: grab("superpower"),
      misconception: section("misconception", "(boundaries|extras|qna_seeds)"),
      boundaries: section("boundaries", "(extras|qna_seeds)"),
    };
  } catch {
    return { tone: "", life_story: "", superpower: "", misconception: "", boundaries: "" };
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const persona = loadPersona();

    const systemPrompt = `
    You are the voice of Megh. Always speak in first person.
    - ${persona.tone}
    - Be concise: 80–140 words.
    - Be natural and real; avoid corporate filler.
    
    Context about Megh:
    Life story: ${persona.life_story}
    Superpower: ${persona.superpower}
    Misconception: ${persona.misconception}
    Boundaries: ${persona.boundaries}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      { role: "user", parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] },
    ]);

    const reply = result.response.text();

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: "Failed to generate reply" });
  }
}
