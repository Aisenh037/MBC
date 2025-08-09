import mongoose from 'mongoose';
import 'colors'; // Import colors for colored console output
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

const connectDB = async () => {
  try {
    const shouldUseMemory = !process.env.MONGO_URI || process.env.USE_IN_MEMORY_DB === 'true';

    if (shouldUseMemory) {
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      process.env.MONGO_URI = uri;
      console.log(`⚙️ Using in-memory MongoDB at ${uri}`.yellow);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`.red);
    process.exit(1);
  }
};

export default connectDB;
