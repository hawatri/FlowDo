import { GoogleGenAI, Type } from "@google/genai";

// Helper to get an API client with a key that works in the browser build
const getAiClient = () => {
  const envKey =
    (typeof process !== "undefined" &&
      typeof process.env !== "undefined" &&
      (process.env.GEMINI_API_KEY || process.env.API_KEY)) ||
    "";

  const storedKey =
    typeof window !== "undefined"
      ? window.localStorage.getItem("flowdo_settings") || ""
      : "";

  const apiKey = envKey || storedKey;

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not set. Set GEMINI_API_KEY in your .env.local file or save a key in the Settings modal."
    );
  }

  return new GoogleGenAI({ apiKey });
};

export const generateText = async (
  prompt: string,
  systemInstruction?: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Updated to latest fast model
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate content.");
  }
};

export const generateFlashcards = async (context: string): Promise<Array<{front: string, back: string}>> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Generate 3 flashcards based on this content: "${context}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING }
            },
            required: ["front", "back"]
          }
        }
      }
    });
    
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Flashcard Gen Error:", error);
    return [];
  }
};

export const generateQuiz = async (context: string): Promise<Array<{question: string, options: string[], answer: string}>> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Generate a multiple choice quiz question based on: "${context}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              answer: { type: Type.STRING, description: "The correct option text" }
            },
            required: ["question", "options", "answer"]
          }
        }
      }
    });
    
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Quiz Gen Error:", error);
    return [];
  }
};

// --- NEW FEATURE: Topic to Graph ---
export const generateMindMap = async (topic: string): Promise<{
    nodes: Array<{ id: string, label: string, type: string, summary: string }>,
    edges: Array<{ source: string, target: string, label?: string }>
}> => {
  try {
    const ai = getAiClient();
    const prompt = `Create a comprehensive concept map for the topic: "${topic}". 
    Identify the main central concept, 5-7 key sub-concepts, and connections between them.
    Return a JSON object with 'nodes' and 'edges'. 
    For nodes, use types like 'concept', 'lecture' (for main topic), 'fact', or 'example'.
    Include a brief 'summary' for each node.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING },
                  summary: { type: Type.STRING }
                },
                required: ["id", "label", "type", "summary"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  label: { type: Type.STRING }
                },
                required: ["source", "target"]
              }
            }
          },
          required: ["nodes", "edges"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : { nodes: [], edges: [] };
  } catch (error) {
    console.error("Mind Map Gen Error:", error);
    throw error;
  }
};