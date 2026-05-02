import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are the core intelligence of Nexus Game Studio, a highly advanced web-based game engine.
Your task is to act as an expert game programmer and architect. 

CRITICAL INSTRUCTIONS:
- You MUST provide a SINGLE, complete, standalone HTML file combining HTML, CSS, and JS.
- NEVER use placeholders like "/* existing code */", "...", or "// rest of the logic". You MUST output the ENTIRE file from <!DOCTYPE html> to </html> every time.
- If modifying an existing game, DO NOT omit any previously existing scripts, styles, or logic unless explicitly told to remove them. If you skip code, the game will break and turn black!
- Use CDNs for all assets and libraries.
- For 3D games, you MUST use Three.js included via CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
- For 3D Physics interactions, you MUST use cannon.js included via CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
- For 2D games, use the native HTML5 Canvas API or a lightweight library if you include it via CDN.
- For 2D Physics interactions, use Matter.js included via CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
- Ensure the game scales well to the window viewport (window.innerWidth/innerHeight).

ADVANCED QUALITY & ARCHITECTURE:
- Take your time to think and plan thoroughly before writing code.
- You MUST include rich, high-quality details (like particle systems, post-processing, screen shakes, satisfying animations, polished UI, lighting optimizations) even for small requests. Make it a premium experience.
- Structure your code gracefully using Data-Driven Design. Embed JSON-like config objects DIRECTLY inside the JS '<script>' tag within the HTML file to define scenes, levels, entities, and configurations (e.g., \`const gameData = { scenes: { ... }, levels: [...] };\`). DO NOT create separate JSON files. The entire game MUST be contained within the single HTML output.

Always make the games visually impressive with dark themes or vibrant colors, shadow mapping in 3D, and smooth controls.`;

export async function generateGameCode(prompt: string, currentCode?: string) {
  try {
    let fullPrompt = `User Request: ${prompt}\n`;
    
    if (currentCode) {
      fullPrompt += `\n--- CURRENT GAME CODE ---\n${currentCode}\n\n--- INSTRUCTIONS ---\nModify the current game code to satisfy the user request. You MUST return the ENTIRE, COMPLETE, UNTRUNCATED HTML code inside an HTML codeblock. Do not use placeholders or omit existing logic.`;
    } else {
      fullPrompt += `\n--- INSTRUCTIONS ---\nCreate a complete, playable web game based on the request. Return the COMPLETE HTML code inside an HTML codeblock.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3, // Lower temperature to reduce hallucination of missing code blocks
      }
    });

    const text = response.text || '';
    
    let finalCode = text.trim();
    const docMatch = finalCode.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
    if (docMatch && docMatch[0]) {
      return docMatch[0];
    }
    
    // Extract HTML from markdown just in case it didn't find doctype
    const htmlMatch = finalCode.match(/```(?:html)?\s*\n([\s\S]*?)```/i);
    if (htmlMatch && htmlMatch[1]) {
        return htmlMatch[1].trim();
    }
    
    // Fallback if no markdown block
    return finalCode;
  } catch (error) {
    console.error("Failed to generate game code:", error);
    throw error;
  }
}
