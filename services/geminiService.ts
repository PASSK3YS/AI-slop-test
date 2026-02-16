import { GoogleGenAI, Type } from "@google/genai";
import { AIServiceTask } from "../types";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Generic function to handle various AI text operations on notes
 */
export const processNoteWithAI = async (
  task: AIServiceTask,
  content: string,
  context?: string
): Promise<string | string[]> => {
  try {
    let prompt = "";
    let responseSchema = undefined;
    let responseMimeType = undefined;

    switch (task) {
      case AIServiceTask.SUMMARIZE:
        prompt = `Please provide a concise summary (max 2-3 sentences) of the following note:\n\n${content}`;
        break;
      
      case AIServiceTask.CONTINUE:
        prompt = `Continue writing the following text efficiently and creatively. Match the tone and style. Provide only the continuation, do not repeat the start:\n\n${content}`;
        break;
      
      case AIServiceTask.FIX_GRAMMAR:
        prompt = `Fix the grammar, spelling, and punctuation of the following text. Keep the tone natural. Return only the corrected text:\n\n${content}`;
        break;

      case AIServiceTask.GENERATE_TITLE:
        prompt = `Generate a short, descriptive, and engaging title (maximum 6 words) for the following note content. Do not use quotes:\n\n${content}`;
        break;

      case AIServiceTask.GENERATE_TAGS:
        prompt = `Analyze the following note content and generate up to 5 relevant tags (keywords). Return them as a JSON array of strings.`;
        responseMimeType = "application/json";
        responseSchema = {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        };
        break;
        
      default:
        throw new Error("Unknown task");
    }

    // If there's extra context (like existing tags or title), append it
    const fullContent = context ? `Context: ${context}\n\nTask Payload:\n${content}\n\n${prompt}` : `${prompt}\n\nNote Content:\n${content}`;

    const config: any = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
    };

    if (responseMimeType) config.responseMimeType = responseMimeType;
    if (responseSchema) config.responseSchema = responseSchema;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: fullContent,
      config: config
    });

    const text = response.text;
    
    if (!text) {
        throw new Error("No response from AI");
    }

    if (task === AIServiceTask.GENERATE_TAGS) {
        return JSON.parse(text);
    }

    return text.trim();

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};