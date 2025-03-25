import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, config } from './src/config/db.js';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Ensure MongoDB URI is set
if (!process.env.MONGO_URI) {
  console.error("❌ MongoDB URI is missing! Set MONGO_URI in the .env file.");
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// User Registration Route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Judge0 API Configuration
const JUDGE0_API = "https://judge0-ce.p.rapidapi.com/submissions";
const RAPIDAPI_HEADERS = {
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "", // Load from .env
  "Content-Type": "application/json",
};

// LM Studio API Configuration
const LM_STUDIO_API = process.env.LM_STUDIO_API || "http://localhost:1234/v1/chat/completions";
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
    console.error("❌ Execution Error:", error.message || error);
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
    console.error("❌ Analysis Error:", error.message || error);
    res.status(500).json({ error: error.message || "Failed to analyze code" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
