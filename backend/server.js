import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the Google Gen AI client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
  res.send('PickWise Engine Backend Service is active and listening.');
});

app.post('/ask-ai', async (req, res) => {
  try {
    const { optionName, domainContext, criteriaList } = req.body;

    if (!optionName || !domainContext || !criteriaList || !Array.isArray(criteriaList)) {
      return res.status(400).json({ error: 'Missing mandatory request body parameters parameters.' });
    }

    // Build a strict, structured prompt instructing Gemini to evaluate the specific criteria
    const matrixEvaluationPrompt = `
      You are an expert analytical choice validator engine for the app PickWise.
      Evaluate the option: "${optionName}" within the specific domain context of: "${domainContext}".
      
      You must evaluate this option individually across each of these specific criteria factors:
      ${criteriaList.map((c, idx) => `${idx + 1}. ${c}`).join('\n')}
      
      Provide a comprehensive, crisp, paragraph-style written evaluation analysis (around 3-4 sentences max) explaining how well "${optionName}" fits this context.
      
      Additionally, assign an integer percentage score (0 to 100) for each criteria factor. 
      Higher numbers mean a better fit for that specific criteria attribute.

      CRITICAL: You must return your response ONLY as a valid, raw JSON object. Do not include markdown code block formatting (like \`\`\`json).
      The JSON structure must match this scheme exactly:
      {
        "analysis": "Your detailed written analysis paragraph goes here.",
        "suggestedScores": {
          "criteria_short_lowercase_id_or_name": 85,
          "another_criteria_id": 70
        }
      }
      
      Ensure the keys inside "suggestedScores" map directly to the criteria labels provided in the request array, written as lowercased string tokens.
    `;

    // Make the standard call using the correct gemini-2.5-flash production model standard
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: matrixEvaluationPrompt,
    });

    const responseTextClean = aiResponse.text.trim();
    
    // Safety check to strip any unexpected markdown formatting that could cause JSON parse errors
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
  console.log(`Backend server successfully initialized. Hosting platform layer active on port ${PORT}`);
});