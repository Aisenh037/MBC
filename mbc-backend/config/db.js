import mongoose from 'mongoose';
import 'colors'; // Import colors for colored console output

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`.red);
    process.exit(1);
  }
};

export default connectDB;
