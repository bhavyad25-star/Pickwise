import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
  res.send('PickWise Engine Backend Service is active and listening.');
});

app.post('/ask-ai', async (req, res) => {
  try {
    const { optionName, domainContext, criteriaList } = req.body;

    if (!optionName || !domainContext || !criteriaList || !Array.isArray(criteriaList)) {
      return res.status(400).json({ error: 'Missing mandatory request body parameters.' });
    }

    // Explicitly mapping full descriptions to keys for strict JSON generation
    const matrixEvaluationPrompt = `
      You are an expert analytical choice validator engine for the app PickWise.
      Evaluate the option: "${optionName}" within the specific domain context of: "${domainContext}".
      
      Evaluate this option individually across each of these specific criteria factors:
      ${criteriaList.map((c) => `- ${c.id}: ${c.name}`).join('\n')}
      
      Provide a comprehensive, crisp, paragraph-style written evaluation analysis (around 3 sentences max) explaining how well "${optionName}" fits this context.
      
      Additionally, assign an integer percentage score (0 to 100) for each factor.
      
      CRITICAL: You must return your response ONLY as a valid, raw JSON object. Do not include markdown code block formatting (like \`\`\`json).
      The keys inside "suggestedScores" MUST exactly match the IDs provided below.
      
      Expected Scheme:
      {
        "analysis": "Your detailed written analysis paragraph goes here.",
        "suggestedScores": {
          ${criteriaList.map((c) => `"${c.id}": [integer score between 0 and 100]`).join(',\n          ')}
        }
      }
    `;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: matrixEvaluationPrompt,
    });

    const responseTextClean = aiResponse.text.trim();
    
    const cleanedJsonString = responseTextClean
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    const parsedMatrixPayload = JSON.parse(cleanedJsonString);
    return res.json(parsedMatrixPayload);

  } catch (error) {
    console.error('Gemini Analytical Matrix Processing Fault: ', error);
    return res.status(500).json({ 
      error: 'Neural pipeline connection fault.',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server successfully initialized active on port ${PORT}`);
});