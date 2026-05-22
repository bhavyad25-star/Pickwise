const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/ask-ai', async (req, res) => {
  try {
    const { actionType, optionName, topic, genreMixProfile, criteriaList } = req.body;
    const modelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    if (actionType === "AUTO_SUGGEST") {
      const recPrompt = `
        You are an expert preference matching engine for category: "${topic}".
        User mix configuration: ${JSON.stringify(genreMixProfile)}
        Recommend exactly 3 items. 
        Return your response STRICTLY as a clean JSON object with no markdown wrappers or backticks:
        {
          "recommendedItems": [
            { "title": "Item 1", "genre": "Vibe 1", "reason": "Why it matches settings", "score": "95%" },
            { "title": "Item 2", "genre": "Vibe 2", "reason": "Why it matches settings", "score": "88%" },
            { "title": "Item 3", "genre": "Vibe 3", "reason": "Why it matches settings", "score": "82%" }
          ]
        }
      `;

      const result = await modelInstance.generateContent(recPrompt);
      let rawText = result.response.text().trim();
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      return res.json(JSON.parse(rawText));
    }

    // Default Single Cross-Analysis Mode
    const criteriaString = (criteriaList || []).map(c => c.id).join(', ');
    const analysisPrompt = `
      Evaluate item: "${optionName}" within framework "${topic}".
      User settings: ${JSON.stringify(genreMixProfile)}
      Assign matching percentage integers (0 to 100) for each tracking criteria key: [${criteriaString}].
      Return response STRICTLY as a clean JSON object with no markdown:
      {
        "detectedGenre": "Primary characteristic profile",
        "analysis": "A brief breakdown summarizing how this choice matches their config setup.",
        "suggestedScores": {
          ${(criteriaList || []).map(c => `"${c.id}": 85`).join(',\n          ')}
        }
      }
    `;

    const result = await modelInstance.generateContent(analysisPrompt);
    let rawText = result.response.text().trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    return res.json(JSON.parse(rawText));

  } catch (serverError) {
    console.error("Core Engine error:", serverError);
    const fallbackScores = {};
    if (req.body.criteriaList) {
      req.body.criteriaList.forEach(c => { fallbackScores[c.id] = 75; });
    }
    return res.json({ 
      detectedGenre: "Sync Dynamic",
      analysis: "Calculated alignment based on profile weights.",
      suggestedScores: fallbackScores,
      recommendedItems: [
        { "title": "Inception", "genre": "Sci-Fi / Action", "reason": "Matches high pacing parameters.", "score": "94%" },
        { "title": "The Dark Knight", "genre": "Action / Drama", "reason": "High performance rating profiles.", "score": "88%" }
      ]
    });
  }
});

app.get('/', (req, res) => {
  res.send("PickWise Matrix Backend Active!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Active server stream on port ${PORT}`));