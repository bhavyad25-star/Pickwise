import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/ask-ai', async (req, res) => {
  try {
    const { optionName, topic, userVibeText, userScaleValue, criteriaList } = req.body;

    if (!optionName) {
      return res.status(400).json({ error: "Missing optionName parameter" });
    }

    const engineeredPrompt = `
      You are an analytical movie matchmaking engine.
      The user wants to look at this item: "${optionName}" under the category framework: "${topic || 'Movies'}".
      
      User's Personal Intention Rules:
      - The exact genre style they feel like watching right now: "${userVibeText || 'Any interesting plot'}"
      - Their intensity demand level on a scale from 1 to 10: "${userScaleValue || 7}/10"
      
      Tasks:
      1. Figure out the primary genre of "${optionName}".
      2. Compare the item's genre profiles against the user's vibe description and intensity scale.
      3. Calculate an overall matching index score from 0% to 100% based on how well it satisfies what they want to see today.
      4. Assign specific numeric values out of 100 for each structural tracking item given here: ${JSON.stringify(criteriaList || [])}.
      
      Return your response strictly as a clean JSON object containing no markdown wrapping text blocks:
      {
        "detectedGenre": "Exact Genre Name",
        "analysis": "Provide a clean, direct 2-3 line breakdown summarizing why this choice matches or misses their specified mood.",
        "suggestedScores": {
          "entertainment": 80,
          "pacing": 85,
          "critics": 70,
          "rewatch": 75
        }
      }
    `;

    const modelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const responseResult = await modelInstance.generateContent(engineeredPrompt);
    
    let rawText = responseResult.response.text().trim();
    
    // Safety check to remove potential markdown wrappers if the engine returns them
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedJsonData = JSON.parse(rawText);
    res.json(parsedJsonData);

  } catch (serverError) {
    console.error("Core Engine error:", serverError);
    res.status(500).json({ 
      detectedGenre: "Unknown Profile",
      analysis: "The backend is awake, but the engine is parsing the response format. Press the '+' button once more to execute the check!",
      suggestedScores: {}
    });
  }
});

// Explicit root health verification check route
app.get('/', (req, res) => {
  res.send("PickWise Engine API Layer is Active and Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PickWise Engine active on port ${PORT}`);
});