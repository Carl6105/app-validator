import mongoose from 'mongoose';

const fileHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  filePath: { 
    type: String, 
    required: true 
  },
  analysisResult: {
    score: { 
      type: Number, 
      required: true 
    },
    feedback: { 
      type: String, 
      required: true 
    },
    correctedCode: String
  },
  analyzedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const FileHistory = mongoose.model('FileHistory', fileHistorySchema);
export default FileHistory;