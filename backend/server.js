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
    const { optionName, topic, subgenre, criteriaList } = req.body;

    if (!optionName) {
      return res.status(400).json({ error: "Missing optionName parameter" });
    }

    const engineeredPrompt = `
      You are PickWise AI, an expert analytical preference tracking engine.
      The user wants to evaluate the item: "${optionName}" inside the tracking category: "${topic}" ${subgenre ? `with subgenre focus context: "${subgenre}"` : ''}.
      
      Tasks:
      1. Explicitly state what specific genre, subgenre, or classification profile "${optionName}" belongs to.
      2. Write a clear, brief 2-3 sentence breakdown explaining *why* it matches that specific genre profile.
      3. Assign an intelligent match percentage score out of 100 for each evaluation metric: ${JSON.stringify(criteriaList)}.
      
      Return your response strictly as a JSON object matching this structure with NO markdown syntax codeblocks:
      {
        "analysis": "Genre: [Insert Detected Genre]. [Your 2-3 sentence explanation here detailing why it fits perfectly].",
        "suggestedScores": {
          "entertainment": 85,
          "pacing": 90,
          "critics": 75,
          "rewatch": 80
        }
      }
    `;

    const modelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const responseResult = await modelInstance.generateContent(engineeredPrompt);
    
    const cleanedTextOutput = responseResult.response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedJsonData = JSON.parse(cleanedTextOutput);
    res.json(parsedJsonData);

  } catch (serverError) {
    console.error("Backend error:", serverError);
    res.status(500).json({ 
      analysis: "The AI engine encountered a temporary processing delay. Please try resubmitting your option choice in a moment!",
      suggestedScores: {}
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PickWise API running on port ${PORT}`);
});