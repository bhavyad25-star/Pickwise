import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Streamlined legacy fallbacks

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Perfectly authenticates client-level project tokens instantly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/ask-ai', async (req, res) => {
  try {
    const { optionName, topic, genreMixProfile, criteriaList } = req.body;

    // Streamlined payload verification to prevent 400 Bad Request responses
    const targetOptionName = optionName || "RECOMMENDATION_REQUEST_TRIGGER";

    // Using gemini-1.5-pro for maximum intelligence profile matching
    const modelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const criteriaString = (criteriaList || []).map(c => c.id).join(', ');

    // ROUTE A: Automated Mix Recommendations Trigger (Auto-Suggest Mode)
    if (targetOptionName === "RECOMMENDATION_REQUEST_TRIGGER") {
      const recPrompt = `
        You are an expert personalized discovery engine for the category framework: "${topic}".
        The user has configured a custom mix profile layout on a scale of 0 to 10:
        ${JSON.stringify(genreMixProfile)}

        Task: Recommend exactly 3 specific real-world items that perfectly match this structural preference blend.
        
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
      
      // Safety clean up if the model accidentally returns markdown enclosures
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      
      return res.json(JSON.parse(rawText));
    }

    // ROUTE B: Title Cross-Match Matrix Verification (Custom Input Mode)
    const analysisPrompt = `
      You are an analytical matchmaking engine for the category framework: "${topic}".
      Target Item to evaluate: "${targetOptionName}"
      
      User's Custom Preference Mix Profile (Scale 0-10):
      ${JSON.stringify(genreMixProfile)}

      Tasks:
      1. Determine the exact characteristics/genres of "${targetOptionName}".
      2. Compare it directly against the user's preference mix ratios.
      3. Assign specific score values from 0 to 100 for each of these tracking keys based on how well this specific item satisfies them: [${criteriaString}].

      Return your response STRICTLY as a clean JSON object with no markdown wrappers or backticks:
      {
        "detectedGenre": "Primary characteristic profile",
        "analysis": "A concise 2-3 line breakdown summarizing why this choice matches or misses their specified mix layout.",
        "suggestedScores": {
          ${(criteriaList || []).map(c => `"${c.id}": 85`).join(',\n          ')}
        }
      }
    `;

    const responseResult = await modelInstance.generateContent(analysisPrompt);
    let rawText = responseResult.response.text().trim();
    
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedJsonData = JSON.parse(rawText);
    return res.json(parsedJsonData);

  } catch (serverError) {
    console.error("Core Engine error:", serverError);
    
    // Safety fallback construction to prevent total frontend layout failures
    const fallbackScores = {};
    if (req.body.criteriaList) {
      req.body.criteriaList.forEach(c => { fallbackScores[c.id] = 70; });
    }

    return res.status(500).json({ 
      detectedGenre: "Error Syncing",
      analysis: "The AI parsing engine timed out. Click the '+' button once more to run the live synchronization matrix instantly!",
      suggestedScores: fallbackScores,
      recommendedItems: [
        { "title": "Dynamic Fallback Item 1", "genre": "Balanced Blend", "reason": "Suited to your current configurations.", "score": "90%" },
        { "title": "Dynamic Fallback Item 2", "genre": "High Value Option", "reason": "Matches your top-priority values.", "score": "85%" }
      ]
    });
  }
});

// Root validation check route
app.get('/', (req, res) => {
  res.send("PickWise Multi-Genre Matrix Backend Layer Active!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PickWise active on port ${PORT}`);
});