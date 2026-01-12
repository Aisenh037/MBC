# MBC Department Management System - Local Development Guide

This guide will help you set up and run the MBC Department Management System locally for development and testing.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **Docker** (v20 or higher) - [Download](https://www.docker.com/get-started)
- **Docker Compose** (v2 or higher) - Usually included with Docker Desktop

### Automated Setup

Run the automated setup script:

```bash
# Linux/Mac
node scripts/setup-local-dev.js

# Windows
node scripts\setup-local-dev.js
```

This script will:
- Check prerequisites
- Set up environment files
- Install dependencies
- Configure database
- Create startup scripts

### Manual Setup

If you prefer manual setup:

1. **Clone and Install Dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd mbc-backend && npm install && cd ..
   
   # Install frontend dependencies
   cd mbc-frontend && npm install && cd ..
   ```

2. **Set Up Environment Files**
   
   Create `mbc-backend/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # Database
   DATABASE_URL=postgresql://mbc_user:mbc_password@localhost:5432/mbc_db
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_KEY=your_supabase_service_key_here
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=redis_password
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-secure
   JWT_REFRESH_SECRET=your-refresh-secret-key-here
   
   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Notification Services
   RESEND_API_KEY=your_resend_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   TWILIO_WHATSAPP_NUMBER=+1234567890
   
   # Frontend
   FRONTEND_URL=http://localhost:5173
   CORS_ORIGIN=http://localhost:5173
   ```

   Create `mbc-frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_AI_SERVICE_URL=http://localhost:5001
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   ```

3. **Start Database Services**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Run Database Migrations**
   ```bash
   cd mbc-backend
   npm run db:migrate
   npm run db:seed
   cd ..
   ```

## 🏃‍♂️ Running the Application

### Option 1: Using Startup Scripts (Recommended)

**Linux/Mac:**
```bash
./start-dev.sh
```

**Windows:**
```cmd
start-dev.bat
```

### Option 2: Manual Start

Start each service in separate terminals:

**Terminal 1 - Database Services:**
```bash
docker-compose up postgres redis
```

**Terminal 2 - Backend:**
```bash
cd mbc-backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd mbc-frontend
npm run dev
```

**Terminal 4 - AI Service (Optional):**
```bash
cd ai-service
python main.py
```

## 🌐 Access Points

Once running, you can access:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **AI Service**: http://localhost:5001
- **Database**: localhost:5432 (PostgreSQL)
- **Cache**: localhost:6379 (Redis)

## 🧪 Testing

### Run All Tests
```bash
# Automated comprehensive testing
node scripts/test-all-features.js

# Backend tests only
cd mbc-backend && npm test

# Frontend tests only
cd mbc-frontend && npm test
```

### Manual Testing Checklist

1. **User Authentication**
   - [ ] Register new user
   - [ ] Login with credentials
   - [ ] Password reset functionality
   - [ ] Role-based access control

2. **Assignment Management**
   - [ ] Create assignment (Professor)
   - [ ] Upload assignment files (Student)
   - [ ] Submit assignment (Student)
   - [ ] Grade assignment (Professor)

3. **Notifications**
   - [ ] Email notifications (configure Resend)
   - [ ] SMS notifications (configure Twilio)
   - [ ] WhatsApp notifications (configure Twilio)
   - [ ] Real-time notifications (WebSocket)

4. **File Management**
   - [ ] File upload to Cloudinary
   - [ ] File download
   - [ ] File permissions

5. **Performance**
   - [ ] Redis caching
   - [ ] Database queries
   - [ ] API response times

## 🔧 Configuration

### Required External Services

1. **Supabase** (Database & Auth)
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Get URL and API keys from project settings

2. **Cloudinary** (File Storage)
   - Create account at [cloudinary.com](https://cloudinary.com)
   - Get cloud name, API key, and secret from dashboard

3. **Resend** (Email Notifications)
   - Create account at [resend.com](https://resend.com)
   - Get API key from dashboard
   - Verify your domain for production

4. **Twilio** (SMS/WhatsApp)
   - Create account at [twilio.com](https://twilio.com)
   - Get Account SID and Auth Token
   - Purchase phone number for SMS
   - Set up WhatsApp sandbox for testing

### Optional Services

- **Monitoring**: Prometheus + Grafana (included in Docker Compose)
- **Logging**: Winston (configured in backend)
- **Analytics**: Custom analytics service

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :5000  # Mac/Linux
   netstat -ano | findstr :5000  # Windows
   
   # Kill process or change port in .env
   ```

2. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Restart database
   docker-compose restart postgres
   
   # Check logs
   docker-compose logs postgres
   ```

3. **Redis Connection Failed**
   ```bash
   # Check if Redis is running
   docker-compose ps redis
   
   # Restart Redis
   docker-compose restart redis
   ```

4. **TypeScript Compilation Errors**
   ```bash
   # Clean and rebuild
   cd mbc-backend
   rm -rf dist node_modules
   npm install
   npm run build
   ```

5. **Frontend Build Issues**
   ```bash
   # Clear cache and rebuild
   cd mbc-frontend
   rm -rf dist node_modules .vite
   npm install
   npm run build
   ```

### Debug Mode

Enable debug logging:

```bash
# Backend
DEBUG=mbc:* npm run dev

# Frontend
VITE_DEBUG=true npm run dev
```

### Health Checks

Check service health:

```bash
# Backend health
curl http://localhost:5000/api/v1/health

# Frontend health
curl http://localhost:5173/health

# AI service health
curl http://localhost:5001/health
```

## 📝 Development Workflow

### Code Changes

1. **Backend Changes**
   - TypeScript files auto-compile with `npm run dev`
   - Server restarts automatically with nodemon
   - Database changes require migration: `npm run db:migrate`

2. **Frontend Changes**
   - Vite provides hot module replacement
   - Changes reflect immediately in browser
   - TypeScript compilation happens in real-time

3. **Database Schema Changes**
   ```bash
   cd mbc-backend
   # Edit prisma/schema.prisma
   npm run db:generate  # Generate Prisma client
   npm run db:migrate   # Create and run migration
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### Testing New Features

1. Write tests first (TDD approach)
2. Implement feature
3. Run automated tests: `node scripts/test-all-features.js`
4. Manual testing
5. Update documentation

## 📚 Additional Resources

- [API Documentation](http://localhost:5000/api-docs) (when server is running)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Docker Documentation](https://docs.docker.com/)

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review application logs
3. Check GitHub issues
4. Create new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Relevant logs

## 🚀 Ready for Production?

When ready to deploy:

1. Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Run production build: `npm run build`
3. Test with production Docker: `docker-compose -f docker-compose.prod.yml up`
4. Deploy using: `./scripts/deploy-production.sh`

Happy coding! 🎉