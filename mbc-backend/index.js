import dotenv from "dotenv";
import connectDB from "./config/db.js";
import seedAdmin from "./config/seedAdmin.js";
import app from "./app.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
