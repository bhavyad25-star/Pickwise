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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `Recommend 3 movies. Return ONLY JSON: {"recommendedItems": [{"title": "Inception", "reason": "Complex sci-fi"}, {"title": "The Dark Knight", "reason": "Action-drama"}, {"title": "Interstellar", "reason": "Sci-fi epic"}]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.listen(process.env.PORT || 5000, () => console.log("Server running"));