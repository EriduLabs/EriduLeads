import { GoogleGenAI, Type } from '@google/genai';
import { Lead } from '../types';

// Initialize the SDK. Assumes API_KEY is available in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

export async function generateAgenticLeads(targetArea: string, industry: string): Promise<Lead[]> {
  try {
    // STEP 1: Grounded Search for Real Data
    // We use the googleSearch tool to ensure the model fetches 100% real, verifiable information.
    const searchPrompt = `Search Google for 6 REAL, currently operating small-to-medium businesses in the ${industry} sector located in or around ${targetArea}.
    Gather their actual company name, location, description, real phone number, real email or website, years operational, and current standings/reviews.
    Do not make up any information. Provide only factual, verifiable data. If you cannot find 6, provide as many real ones as you can find.`;

    const searchResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const rawText = searchResponse.text;
    
    // Extract grounding URLs to display in the UI as required
    const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = chunks.map((chunk: any) => chunk.web?.uri).filter(Boolean);
    const uniqueUrls = Array.from(new Set(sourceUrls)) as string[];

    // STEP 2: Format and Generate Pitch
    // We pass the grounded text to a second call to format it strictly into JSON and generate the AI pitch angles.
    const formatPrompt = `Extract the real business information from the following text and format it into a JSON array.
    For each business, identify a highly specific operational pain point they likely face that could be solved with AI or automation.
    Then, write a short, punchy pitch angle (title and text) to sell them "Time" and "Operational Order".
    
    Text to process:
    ${rawText}`;

    const formatResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formatPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING, description: "Name of the business" },
              category: { type: Type.STRING, description: "Industry category, e.g., 'HVAC / Emergency'" },
              location: { type: Type.STRING, description: "City, State" },
              description: { type: Type.STRING, description: "Brief description of what they do" },
              phone: { type: Type.STRING, description: "Real phone number" },
              email: { type: Type.STRING, description: "Real email or website URL" },
              painPoint: { type: Type.STRING, description: "Specific operational bottleneck" },
              pitchTitle: { type: Type.STRING, description: "Short title for the pitch angle" },
              pitchText: { type: Type.STRING, description: "The actual script to say/send" },
              yearsOperational: { type: Type.STRING, description: "Estimated years in business (e.g., '10+ years', 'Est. 2015')" },
              currentStandings: { type: Type.STRING, description: "Current market standing or reputation (e.g., '4.8/5 Stars on Google', 'Top rated locally')" },
              businessReview: { type: Type.STRING, description: "A brief review of what they do and their current operational state" }
            },
            required: ["companyName", "category", "location", "description", "phone", "email", "painPoint", "pitchTitle", "pitchText"]
          }
        }
      }
    });

    if (!formatResponse.text) {
      throw new Error("Empty response from Gemini formatting step");
    }

    const generatedData = JSON.parse(formatResponse.text);
    
    // Map the raw data to our Lead type, adding IDs, default status, and the grounding URLs
    const newLeads: Lead[] = generatedData.map((item: any) => ({
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...item,
      status: 'New Lead',
      colorHint: ['blue', 'green', 'purple', 'orange', 'yellow'][Math.floor(Math.random() * 5)],
      sourceUrls: uniqueUrls
    }));

    return newLeads;
  } catch (error) {
    console.error("Error generating leads:", error);
    throw error;
  }
}
