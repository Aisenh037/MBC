// index.js
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import seedAdmin from "./config/seedAdmin.js";
import app from "./app.js";
import logger from "./utils/logger.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();