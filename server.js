import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Judge0 API Configuration
const JUDGE0_API = "https://judge0-ce.p.rapidapi.com/submissions";
const RAPIDAPI_HEADERS = {
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": "f93374fe4fmsh608d5d902c40414p1d8441jsn39d1a5ee6e8e", // Replace with your API Key
  "Content-Type": "application/json",
};

// LM Studio API Configuration
const LM_STUDIO_API = "http://localhost:1234/v1/chat/completions";
const systemPrompt = `You are an expert code analyzer. Analyze the provided code for errors, improvements, and best practices.
Provide detailed feedback and suggestions for improvement.

Requirements:
- Check for syntax errors
- Identify potential bugs
- Suggest performance improvements
- Recommend best practices
- Consider code readability
- Look for security issues
- Evaluate code organization

Include a score from 0-100 in the format <SCORE:XX> based on overall code quality.`;

// Route to run code execution via Judge0
app.post("/run", async (req, res) => {
  try {
    const { source_code, language_id } = req.body;

    const submissionResponse = await axios.post(
      `${JUDGE0_API}?base64_encoded=false&wait=true`,
      { source_code, language_id, stdin: "" },
      { headers: RAPIDAPI_HEADERS }
    );

    const output =
      submissionResponse.data.stdout ||
      submissionResponse.data.stderr ||
      "No output";

    res.json({ output });
  } catch (error) {
    console.error("Execution Error:", error.message || error);
    res.status(500).json({ error: "Execution failed" });
  }
});

// Route to analyze code using LM Studio
app.post("/analyze", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages are required" });
    }

    const response = await axios.post(LM_STUDIO_API, {
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    if (!response.data || !response.data.choices || !response.data.choices[0]?.message?.content) {
      throw new Error("Invalid response from LLM");
    }

    res.json({
      choices: [
        {
          message: {
            content: response.data.choices[0].message.content,
          },
        },
      ],
    });
  } catch (error) {
    console.error("Analysis Error:", error.message || error);
    res.status(500).json({ error: error.message || "Failed to analyze code" });
  }
});

// Start server
app.listen(PORT, async () => {
  try {
    // Check if LM Studio is running
    await axios.post(LM_STUDIO_API, {
      messages: [{ role: "system", content: "Test connection" }],
      temperature: 0.1,
      max_tokens: 5,
    });

    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Connected to LM Studio at ${LM_STUDIO_API}`);
  } catch (error) {
    console.warn(`⚠️ Warning: Unable to reach LM Studio at ${LM_STUDIO_API}. Ensure it's running.`);
  }
});
