import mongoose from 'mongoose';
import 'colors';
import { MongoMemoryServer } from 'mongodb-memory-server';
import logger from '@/utils/logger';

let memoryServer: MongoMemoryServer | null = null;

const connectDB = async (): Promise<void> => {
  try {
    const shouldUseMemory = !process.env.MONGO_URI || process.env.USE_IN_MEMORY_DB === 'true';

    if (shouldUseMemory) {
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      process.env.MONGO_URI = uri;
      logger.info(`Using in-memory MongoDB at ${uri}`);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI!);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`MongoDB Connection Error: ${errorMessage}`);
    process.exit(1);
  }
};

const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
      logger.info('In-memory MongoDB stopped.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`MongoDB Disconnection Error: ${errorMessage}`);
  }
};

export default connectDB;
export { disconnectDB };