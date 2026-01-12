@echo off
cd mbc-backend
set MONGO_URI=mongodb+srv://aisenh037:karan@mbc-cluster0.g7qrq8z.mongodb.net/MBC?retryWrites=true&w=majority&appName=MBC-Cluster0
set JWT_SECRET=your_jwt_secret_key_here
set FRONTEND_URL=http://localhost:5173
npm run dev
