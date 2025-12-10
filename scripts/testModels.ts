import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ No API key found");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function listModels() {
  try {
    console.log("🔍 Fetching available models...\n");
    
    // Try different model names
    const modelsToTry = [
      "gemini-pro",
      "gemini-1.5-pro-latest", 
      "gemini-1.5-flash-latest",
      "gemini-1.0-pro"
    ];
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'OK' if this works");
        const response = await result.response;
        console.log(`✅ ${modelName}: WORKS`);
        console.log(`   Response: ${response.text()}\n`);
        return modelName; // Return the first working model
      } catch (error: any) {
        console.log(`❌ ${modelName}: ${error.message}\n`);
      }
    }
    
    console.log("❌ No working models found");
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
