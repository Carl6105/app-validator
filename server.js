import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const LM_STUDIO_API = 'http://localhost:1234/v1/chat/completions';

const systemPrompt = `You are an expert web developer. Generate a complete website based on the user's prompt.
Return the response in the following JSON format:
{
  "pages": [
    {
      "name": "string (page name)",
      "route": "string (URL path)",
      "content": "string (complete HTML content)"
    }
  ],
  "styles": "string (complete CSS styles)",
  "components": ["string (reusable component code)"]
}

Requirements:
- Use modern HTML5 and CSS3
- Make the design responsive
- Include proper semantic HTML
- Add comments to explain the code
- Ensure cross-browser compatibility
- Follow accessibility best practices
- Use only vanilla HTML, CSS, and JavaScript (no frameworks)`;

// Route to generate website
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await axios.post(LM_STUDIO_API, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    if (!response.data || !response.data.choices || !response.data.choices[0]?.message?.content) {
      throw new Error('Invalid response from LLM');
    }

    let generatedCode;
    try {
      generatedCode = JSON.parse(response.data.choices[0].message.content);
    } catch (jsonError) {
      throw new Error('Failed to parse LLM response');
    }

    res.json(generatedCode);
  } catch (error) {
    console.error('Error:', error.message || error);
    res.status(500).json({ error: error.message || 'Failed to generate website' });
  }
});

// Start server
app.listen(PORT, async () => {
  try {
    // Check if LM Studio is running with a POST request
    await axios.post(LM_STUDIO_API, {
      messages: [{ role: "system", content: "Test connection" }],
      temperature: 0.1,
      max_tokens: 5
    });

    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Connected to LM Studio at ${LM_STUDIO_API}`);
  } catch (error) {
    console.warn(`⚠️ Warning: Unable to reach LM Studio at ${LM_STUDIO_API}. Ensure it's running.`);
  }
});