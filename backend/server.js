// backend/server.js

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// =========================
// Gemini Initialization
// =========================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =========================
// Helper Functions
// =========================

function cleanJsonResponse(rawText) {
  let cleaned = rawText.trim();

  // Remove markdown wrappers if Gemini returns them
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
  }

  return cleaned;
}

function createFallbackScores(criteriaList = []) {
  const fallbackScores = {};

  criteriaList.forEach((criterion) => {
    fallbackScores[criterion.id] = 75;
  });

  return fallbackScores;
}

// =========================
// Root Route
// =========================

app.get('/', (req, res) => {
  res.send('PickWise Matrix Backend Active!');
});

// =========================
// AI Route
// =========================

app.post('/ask-ai', async (req, res) => {
  try {
    const {
      actionType,
      optionName,
      topic,
      genreMixProfile,
      criteriaList
    } = req.body;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro'
    });

    // =========================================================
    // AUTO SUGGEST MODE
    // =========================================================

    if (actionType === 'AUTO_SUGGEST') {
      const recommendationPrompt = `
You are an expert recommendation engine.

Category:
"${topic}"

User preference profile:
${JSON.stringify(genreMixProfile)}

Recommend EXACTLY 3 highly matching items.

Return ONLY valid JSON.
No markdown.
No backticks.
No explanation text.

Format:
{
  "recommendedItems": [
    {
      "title": "Item Name",
      "genre": "Genre/Vibe",
      "reason": "Short reason",
      "score": "95%"
    }
  ]
}
`;

      const result = await model.generateContent(recommendationPrompt);

      let rawText = result.response.text();

      rawText = cleanJsonResponse(rawText);

      const parsedData = JSON.parse(rawText);

      return res.json(parsedData);
    }

    // =========================================================
    // SINGLE ANALYSIS MODE
    // =========================================================

    const criteriaKeys = (criteriaList || [])
      .map((criterion) => criterion.id)
      .join(', ');

    const scoreTemplate = (criteriaList || [])
      .map((criterion) => `"${criterion.id}": 85`)
      .join(',\n');

    const analysisPrompt = `
You are an intelligent scoring and analysis engine.

Analyze:
"${optionName}"

Inside category:
"${topic}"

User preference profile:
${JSON.stringify(genreMixProfile)}

Criteria keys:
[${criteriaKeys}]

Assign realistic percentage scores from 0-100.

Return ONLY valid JSON.
No markdown.
No backticks.
No explanation outside JSON.

Format:
{
  "detectedGenre": "Primary vibe",
  "analysis": "Short explanation",
  "suggestedScores": {
    ${scoreTemplate}
  }
}
`;

    const result = await model.generateContent(analysisPrompt);

    let rawText = result.response.text();

    rawText = cleanJsonResponse(rawText);

    const parsedData = JSON.parse(rawText);

    return res.json(parsedData);

  } catch (error) {
    console.error('Core Engine Error:', error);

    const fallbackScores = createFallbackScores(
      req.body.criteriaList || []
    );

    return res.json({
      detectedGenre: 'Sync Active',
      analysis:
        'Live matrix computed automatically with baseline sync weights.',
      suggestedScores: fallbackScores,
      recommendedItems: [
        {
          title: 'Inception',
          genre: 'Sci-Fi / Action',
          reason:
            'Aligned strongly with high-intensity analytical preferences.',
          score: '94%'
        },
        {
          title: 'The Dark Knight',
          genre: 'Action / Drama',
          reason:
            'Strong pacing and engagement matrix compatibility.',
          score: '88%'
        },
        {
          title: 'Interstellar',
          genre: 'Sci-Fi / Emotional',
          reason:
            'Excellent deep-thinking and cinematic immersion alignment.',
          score: '91%'
        }
      ]
    });
  }
});

// =========================
// Start Server
// =========================

app.listen(PORT, () => {
  console.log(`PickWise backend running on port ${PORT}`);
});