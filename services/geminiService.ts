
import { GoogleGenAI, Type } from "@google/genai";

// Shared function to get a clean AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  // Low Latency Tips: Gemini 2.5 Flash Lite
  async getQuickTip(animalType: string): Promise<string> {
    const ai = getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite-latest",
        contents: `You are a survival guide. Give a 5-word hunting tip for tracking a ${animalType}.`,
      });
      return response.text?.trim() || "Stay low, watch the shadows.";
    } catch (error) {
      return "Listen to the forest closely.";
    }
  },

  // Complex Strategy: Gemini 3 Pro Preview with Thinking
  async getDeepStrategy(huntHistory: string): Promise<string> {
    const ai = getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Analyze this hunt history and provide a complex, data-driven master hunting strategy for the next phase. Consider weather patterns and animal behaviors. History: ${huntHistory}`,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
        },
      });
      return response.text || "Continue your patient vigil.";
    } catch (error) {
      return "The forest remains mysterious. Adapt your tactics.";
    }
  },

  // Image Generation: Gemini 3 Pro Image Preview
  async generateHuntArt(prompt: string, aspectRatio: string = "16:9"): Promise<string | null> {
    const ai = getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: {
          parts: [{ text: `A cinematic 4K digital painting of: ${prompt}. Majestic wildlife, lush forest environment, epic lighting.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: "1K"
          }
        }
      });
      
      for (const part of response.candidates?.[0].content.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image generation failed", error);
      return null;
    }
  },

  // Image Editing: Gemini 2.5 Flash Image
  async editHuntArt(base64Image: string, editPrompt: string): Promise<string | null> {
    const ai = getAI();
    try {
      // Remove data prefix if exists
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "image/png"
              }
            },
            { text: editPrompt }
          ]
        }
      });

      for (const part of response.candidates?.[0].content.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image editing failed", error);
      return null;
    }
  }
};
