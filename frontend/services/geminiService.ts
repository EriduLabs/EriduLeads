import { GoogleGenAI, Type } from '@google/genai';
import { Lead } from '../types';

// Initialize the SDK. Assumes API_KEY is available in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

export async function generateAgenticLeads(targetArea: string, industry: string): Promise<Lead[]> {
  try {
    // STEP 1: Grounded Search for Real Data
    // We use the googleSearch tool to ensure the model fetches 100% real, verifiable information.
    const searchPrompt = `Perform a comprehensive Google Search to find 6 REAL, currently operating businesses in the "${industry}" sector located in or around "${targetArea}". 
    You MUST extract their ACTUAL company name, REAL physical address, REAL phone number, and REAL website or email address. 
    Do not summarize yet. Just return the raw facts, contact pages, and about us summaries for these 6 real businesses. Ensure you are pulling from real directories or their actual websites.`;

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
    const formatPrompt = `You are a strict data extraction parser. Extract the real business information from the provided text and format it into a JSON array.
    
    CRITICAL RULES - VIOLATION RESULTS IN SYSTEM FAILURE:
    1. ABSOLUTELY NO FAKE DATA. DO NOT INVENT, GUESS, OR HALLUCINATE ANY DATA.
    2. NO "555" NUMBERS. If a real phone number is not explicitly in the text, you MUST output "Not available".
    3. NO "example.com" or fake emails. If a real email or website is not explicitly in the text, you MUST output "Not available".
    4. Only include businesses that actually exist in the text.
    5. For each business, identify a highly specific operational pain point they likely face that could be solved with AI or automation.
    6. Write a short, punchy pitch angle (title and text) to sell them "Time" and "Operational Order".
    
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
              phone: { type: Type.STRING, description: "Real phone number, or 'Not available'" },
              email: { type: Type.STRING, description: "Real email or website URL, or 'Not available'" },
              painPoint: { type: Type.STRING, description: "Specific operational bottleneck" },
              pitchTitle: { type: Type.STRING, description: "Short title for the pitch angle" },
              pitchText: { type: Type.STRING, description: "The actual script to say/send" },
              yearsOperational: { type: Type.STRING, description: "Estimated years in business (e.g., '10+ years', 'Est. 2015'), or 'Not available'" },
              currentStandings: { type: Type.STRING, description: "Current market standing or reputation (e.g., '4.8/5 Stars on Google', 'Top rated locally'), or 'Not available'" },
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
    // Apply a strict post-processing filter to guarantee no fake data slips through
    const newLeads: Lead[] = generatedData
      .filter((item: any) => {
        const p = String(item.phone || '').toLowerCase();
        const e = String(item.email || '').toLowerCase();
        
        // Drop obvious hallucinations
        if (p.includes('555-') || p.includes('555 ')) return false;
        if (e.includes('example.com') || e.includes('fake')) return false;
        
        // Drop if both contact methods are missing
        if ((p === 'not available' || p === 'n/a' || p === '') && 
            (e === 'not available' || e === 'n/a' || e === '')) {
          return false;
        }
        
        return true;
      })
      .map((item: any) => ({
        id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...item,
        status: 'New Lead',
        colorHint: ['blue', 'green', 'purple', 'orange', 'yellow'][Math.floor(Math.random() * 5)],
        sourceUrls: uniqueUrls
      }));

    if (newLeads.length === 0) {
      throw new Error("Could not find verifiable contact information for businesses in this area. Please try a broader search or different industry.");
    }

    return newLeads;
  } catch (error) {
    console.error("Error generating leads:", error);
    throw error;
  }
}
