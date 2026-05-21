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
    const { optionName, topic, genreMixProfile, criteriaList } = req.body;

    if (!optionName) {
      return res.status(400).json({ error: "Missing optionName parameter" });
    }

    const modelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Convert criteria array to a descriptive string for the AI weights
    const criteriaString = (criteriaList || []).map(c => c.id).join(', ');

    // ROUTE A: The user clicked "Generate AI Suggestions"
    if (optionName === "RECOMMENDATION_REQUEST_TRIGGER") {
      const recPrompt = `
        You are an expert personalized discovery engine for the category: "${topic}".
        The user has configured a custom mix profile on a scale of 0 to 10:
        ${JSON.stringify(genreMixProfile)}

        Task: Recommend exactly 3 items (movies, places, sports, or food depending on the category context) that perfectly match this structural preference blend.
        
        Return your response STRICTLY as a clean JSON object with no markdown code blocks or backticks:
        {
          "recommendedItems": [
            { "title": "Recommendation Name 1", "genre": "Brief blend description", "reason": "1-2 line explanation matching their mixture values.", "score": "95%" },
            { "title": "Recommendation Name 2", "genre": "Brief blend description", "reason": "1-2 line explanation matching their mixture values.", "score": "88%" },
            { "title": "Recommendation Name 3", "genre": "Brief blend description", "reason": "1-2 line explanation matching their mixture values.", "score": "82%" }
          ]
        }
      `;

      const responseResult = await modelInstance.generateContent(recPrompt);
      let rawText = responseResult.response.text().trim();
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      return res.json(JSON.parse(rawText));
    }

    // ROUTE B: The user is checking a specific item title match
    const analysisPrompt = `
      You are an analytical matchmaking engine for the category framework: "${topic}".
      Target Item to evaluate: "${optionName}"
      
      User's Custom Preference Mix Profile (Scale 0-10):
      ${JSON.stringify(genreMixProfile)}

      Tasks:
      1. Determine the exact characteristics/genres of "${optionName}".
      2. Compare it directly against the user's preference mix ratios.
      3. Assign specific score values from 0 to 100 for each of these tracking keys based on how well this specific item satisfies them: [${criteriaString}].

      Return your response STRICTLY as a clean JSON object with no markdown wrappers or backticks:
      {
        "detectedGenre": "Primary characteristic or category profile",
        "analysis": "A concise 2-3 line breakdown summarizing why this choice matches or misses their specified mix layout.",
        "suggestedScores": {
          ${(criteriaList || []).map(c => `"${c.id}": 80`).join(',\n          ')}
        }
      }
    `;

    const responseResult = await modelInstance.generateContent(analysisPrompt);
    let rawText = responseResult.response.text().trim();
    
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedJsonData = JSON.parse(rawText);
    res.json(parsedJsonData);

  } catch (serverError) {
    console.error("Core Engine error:", serverError);
    
    // Create safe fallback scores matching the current active criteria
    const fallbackScores = {};
    if (req.body.criteriaList) {
      req.body.criteriaList.forEach(c => { fallbackScores[c.id] = 70; });
    }

    res.status(500).json({ 
      detectedGenre: "Error Matching",
      analysis: "The AI was parsing complex data. Click the '+' button once more to retry!",
      suggestedScores: fallbackScores,
      recommendedItems: [
        { "title": "Dynamic Fallback Choice 1", "genre": "Balanced Blend", "reason": "A wonderful choice suited to your current configuration adjustments.", "score": "90%" },
        { "title": "Dynamic Fallback Choice 2", "genre": "High Value Option", "reason": "Perfect selection matching your top-priority values.", "score": "85%" }
      ]
    });
  }
});

app.get('/', (req, res) => {
  res.send("PickWise Multi-Genre Matrix Backend Layer Active!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PickWise active on port ${PORT}`);
});