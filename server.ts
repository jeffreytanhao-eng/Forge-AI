/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI lazy loader
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. AI functionality will fallback to simulated outputs.");
      // We will handle fallback inside endpoints
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST Api Routes Custom Endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    currentTime: new Date().toISOString()
  });
});

// Endpoint: Generate structured Agent configurations
app.post("/api/agent/generate", async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  // Fallback if no API Key
  if (!process.env.GEMINI_API_KEY) {
    // Generate a beautiful mock agent matching description
    const isReviewMode = description.toLowerCase().includes("review") || description.toLowerCase().includes("safety") || description.toLowerCase().includes("security");
    const isDevOps = description.toLowerCase().includes("devops") || description.toLowerCase().includes("docker") || description.toLowerCase().includes("terminal") || description.toLowerCase().includes("shell");
    
    setTimeout(() => {
      res.json({
        name: isReviewMode ? "GuardAI Inspector" : isDevOps ? "Forge SRE" : "Adaptive Agent",
        avatar: isReviewMode ? "🛡️" : isDevOps ? "🔧" : "🤖",
        description: `Simulated Agent based on your request: "${description}"`,
        systemPrompt: `You are an AI assistant specialized in: ${description}. Focus on strict standards, modular architecture, and precise outcomes.`,
        defaultModelId: "gemini-3.5-flash",
        temperature: 0.3,
        maxTokens: 4096,
        tools: ["read_file", "edit_file", "grep"],
        permissionTier: isDevOps ? "shell" : "workspace_write",
        fallbackSimulated: true
      });
    }, 1200);
    return;
  }

  try {
    const ai = getAI();
    const prompt = `Based on the following user-provided prompt, design a highly specific and specialized developer assistant Agent:
User Request: "${description}"

Provide all details matching the required schema. Ensure the system prompt is comprehensive, professional, and details its exact persona, constraints, and instructions. For the avatar, choose a single, highly relevant emoji that visually represents this agent's core function.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are ForgeAI's senior Agent Studio generator. Your role is to design custom, professional, and highly capable developer assistant Agents. You strictly outputs valid JSON conforming to the exact schema requested.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A concise, developer-friendly nickname (e.g., 'API Refactorer', 'PyTest Engineer')" },
            avatar: { type: Type.STRING, description: "A single, highly representative emoji character (e.g., '🐍', '🧪', '🔒')" },
            description: { type: Type.STRING, description: "A concise sentence explaining the agent's unique capabilities." },
            systemPrompt: { type: Type.STRING, description: "Comprehensive directions detailing how this agent reviews, codes, thinks, and behaves." },
            defaultModelId: { type: Type.STRING, description: "Must be 'gemini-3.5-flash' (for general or fast tasks) or 'gemini-3.1-pro-preview' (for high complexity reasoning)." },
            temperature: { type: Type.NUMBER, description: "Optimal temperature parameter from 0.1 (low creativity, high precision) to 0.7 (higher versatility)." },
            maxTokens: { type: Type.INTEGER, description: "Max output limit. Usually 4096 or 8192." },
            tools: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Array of tools required. Available tools are: 'read_file', 'edit_file', 'grep', 'terminal', 'knowledge_graph'." 
            },
            permissionTier: { 
              type: Type.STRING, 
              description: "Must be: 'read_only' (inspection only), 'workspace_write' (standard file editing), or 'shell' (requires executing build/test commands)." 
            }
          },
          required: ["name", "avatar", "description", "systemPrompt", "defaultModelId", "temperature", "maxTokens", "tools", "permissionTier"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const agentConfig = JSON.parse(resultText);
    res.json(agentConfig);
  } catch (err: any) {
    console.error("AI client error during agent generation", err);
    res.status(500).json({ error: err.message || "Failed to generate Agent details" });
  }
});

// Endpoint: Single Turn Agent Chat
app.post("/api/agent/chat", async (req, res) => {
  const { messages, agentSystemPrompt, modelId, temperature, maxTokens } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  // Fallback if no API Key
  if (!process.env.GEMINI_API_KEY) {
    setTimeout(() => {
      res.json({
        text: `[DEBUG: Simulated Response]
I received your request! Since the Gemini key is not configured, here is a mock response demonstrating the Agent layout.

You asked: "${messages[messages.length - 1]?.content}"

My system instructions were setup as:
"${agentSystemPrompt?.slice(0, 80)}..."`,
        fallbackSimulated: true
      });
    }, 1000);
    return;
  }

  try {
    const ai = getAI();
    
    // Support using either user selected model or fallback to standard safe flash
    const selectedModel = modelId || "gemini-3.5-flash";

    // Format messages for @google/genai
    // Note: Gemini expects roles like 'user' or 'model'
    const formattedContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config: {
        systemInstruction: agentSystemPrompt || "You are a helpful AI assistant specialized in software construction.",
        temperature: typeof temperature === 'number' ? temperature : 0.4,
        maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 2048,
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("AI client error during agent session", err);
    res.status(500).json({ error: err.message || "Failed to solve agent response" });
  }
});

// Endpoint: emulates standard 'vibe coding' / composer mode diff generation
app.post("/api/vibe/action", async (req, res) => {
  const { instruction, fileName, fileContent, workspaceFiles } = req.body;
  
  if (!instruction || !fileName || !fileContent) {
    return res.status(400).json({ error: "instruction, fileName, and fileContent are required" });
  }

  // Fallback if no API Key
  if (!process.env.GEMINI_API_KEY) {
    // Basic automatic local mock code modification
    let mockModifiedCode = fileContent;
    let mockExplanation = "I modified your code to incorporate your request.";

    if (instruction.toLowerCase().includes("async") || instruction.toLowerCase().includes("asynchronous")) {
      mockModifiedCode = fileContent.replace(/def read_items\(db/g, "async def read_items(db")
                                   .replace(/def create_item\(item/g, "async def create_item(item")
                                   .replace(/def read_root\(\)/g, "async def read_root()");
      mockExplanation = "As requested, I successfully declared Python FastAPI enpoints as non-blocking `async` coroutines.";
    } else if (instruction.toLowerCase().includes("type") || instruction.toLowerCase().includes("hint") || instruction.toLowerCase().includes("type annotation")) {
      if (fileName.includes("main.py")) {
        mockModifiedCode = fileContent.replace(/def read_items\(db\):/g, "def read_items(db: Session = Depends(get_db)) -> List[ItemCreate]:")
                                     .replace(/def health_check\(\):/g, "def health_check() -> dict:");
        mockExplanation = "I integrated explicit type-hints and dependencies annotations for FastAPI endpoint routes to maintain strong contract parameters.";
      } else if (fileName.includes("index.ts")) {
        mockModifiedCode = fileContent.replace(/export function transformPayload\(raw: string\): string/g, "export function transformPayload(raw: string): string /* strict TS annotated */");
        mockExplanation = "Added explicit typing and JSDoc documentation markers within the index.ts parser boundaries.";
      }
    } else {
      mockModifiedCode = `// Modified Version of ${fileName}\n// Request: ${instruction}\n\n` + fileContent;
      mockExplanation = `I processed your task ("${instruction}") in ${fileName} and compiled the modifications cleanly into active workspace boundaries.`;
    }

    setTimeout(() => {
      res.json({
        modifiedCode: mockModifiedCode,
        explanation: mockExplanation,
        fallbackSimulated: true
      });
    }, 1500);
    return;
  }

  try {
    const ai = getAI();
    const prompt = `You are the composer engine of ForgeIDE. A user is performing 'vibe coding' (agentic code refactoring).
Instruction: "${instruction}"
File targeted: "${fileName}"

Current Code Content of "${fileName}":
\`\`\`
${fileContent}
\`\`\`

Analyze the user's instructions and modify the provided file content. Produce the complete, clean, fully functional modified version of the file. Do not omit any code, do not use placeholds ("Rest of code stays the same") under any circumstances; the entire file must be fully written. Also write a friendly description/explanation justifying your edits.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are ForgeAI's high-speed core code compiler. You strictly outputs valid json conforming to the requested schema. You never prefix markdown blocks outside the JSON itself.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modifiedCode: { type: Type.STRING, description: "The complete new source code for the file with the instruction applied perfectly. Must be valid, executable code and write the complete file." },
            explanation: { type: Type.STRING, description: "A detailed but direct explanation of what was modified and why, highlighting key lines." }
          },
          required: ["modifiedCode", "explanation"]
        }
      }
    });

    const jsonText = response.text?.trim() || "{}";
    const resultObj = JSON.parse(jsonText);
    res.json(resultObj);
  } catch (err: any) {
    console.error("AI client error during vibe action", err);
    res.status(500).json({ error: err.message || "Failed to compile code updates" });
  }
});

// Vite middleware / asset-serving integrations
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dev Mode (Vite server bridges runtime and files)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode (Serve compiled bundle directly)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ForgeAI Platform Server listening on port ${PORT}`);
  });
}

startServer();
