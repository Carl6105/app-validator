import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MongoDB URI is missing! Set MONGO_URI in your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected...');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '1h'
  }
};

export { connectDB, config };
