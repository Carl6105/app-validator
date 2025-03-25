import express from 'express';
import FileHistory from '../models/FileHistory.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get file history for authenticated user
router.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const history = await FileHistory.find({ userId: req.user._id })
      .sort({ analyzedAt: -1 })
      .limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save file analysis result
router.post('/api/history', authenticateToken, async (req, res) => {
  try {
    const { fileName, filePath, analysisResult } = req.body;
    const fileHistory = new FileHistory({
      userId: req.user._id,
      fileName,
      filePath,
      analysisResult
    });
    const savedHistory = await fileHistory.save();
    res.status(201).json(savedHistory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;