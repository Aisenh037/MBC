# MBC Department Management System - Modern TypeScript Implementation

A comprehensive, production-ready department management system built with modern TypeScript, PostgreSQL, Redis, and enhanced AI capabilities.

## 🚀 Features

- **Modern TypeScript Stack**: Full-stack TypeScript with strict type checking
- **PostgreSQL Database**: Robust relational database with Prisma ORM
- **Redis Caching**: High-performance caching and session management
- **Supabase Integration**: Authentication, real-time features, and file storage
- **AI-Powered Analytics**: Advanced analytics and predictive insights
- **Real-time Updates**: WebSocket-based live notifications
- **Comprehensive Testing**: Unit tests, integration tests, and property-based testing
- **Production Ready**: Docker containerization, monitoring, and CI/CD

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React + TS    │    │  Express + TS   │    │  FastAPI + AI   │
│   Frontend      │◄──►│    Backend      │◄──►│   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  PostgreSQL     │              │
         └──────────────┤  + Supabase     │◄─────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Redis       │
                        │    Cache        │
                        └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Material-UI v5** for components
- **TanStack Query** for data fetching
- **Zustand** for state management
- **Vitest** for testing

### Backend
- **Node.js 18+** with Express
- **TypeScript** with strict mode
- **Prisma ORM** for database operations
- **Supabase** for auth and real-time features
- **Redis** for caching and sessions
- **Socket.io** for WebSocket connections
- **Jest** with property-based testing

### AI Service
- **Python 3.11** with FastAPI
- **Scikit-learn** for ML models
- **Pandas/NumPy** for data processing
- **NLTK** for natural language processing

### Infrastructure
- **Docker & Docker Compose**
- **PostgreSQL 15**
- **Redis 7**
- **Nginx** reverse proxy
- **GitHub Actions** CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mbc-department-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npm run setup
   ```
   This will copy `.env.example` files and provide setup guidance.

4. **Configure environment variables**
   - Update `.env` files with your actual configuration
   - Set up Supabase project and update `SUPABASE_*` variables
   - Configure email service (`SMTP_*` variables)

5. **Start services with Docker**
   ```bash
   npm run docker:up
   ```

6. **Run database migrations**
   ```bash
   npm run migrate
   ```

7. **Seed initial data**
   ```bash
   npm run seed
   ```

8. **Start development servers**
   ```bash
   npm run dev
   ```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **AI Service**: http://localhost:5001
- **API Documentation**: http://localhost:5000/api/v1/docs

## 📝 Development

### Available Scripts

```bash
# Development
npm run dev              # Start all services in development mode
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run dev:ai           # Start AI service only

# Building
npm run build            # Build all services
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only

# Testing
npm run test             # Run all tests
npm run test:backend     # Run backend tests
npm run test:frontend    # Run frontend tests
npm run test:coverage    # Run tests with coverage

# Linting and Type Checking
npm run lint             # Lint all code
npm run type-check       # Type check all TypeScript

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed database with initial data

# Docker
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:build     # Build Docker images
```

### Project Structure

```
├── mbc-backend/         # TypeScript Express backend
│   ├── src/            # Source code
│   ├── prisma/         # Database schema and migrations
│   ├── tests/          # Test files
│   └── Dockerfile      # Backend container
├── mbc-frontend/        # React TypeScript frontend
│   ├── src/            # Source code
│   ├── public/         # Static assets
│   └── Dockerfile      # Frontend container
├── ai-service/          # Python FastAPI AI service
├── docs/               # Project documentation
├── nginx/              # Nginx configuration
├── scripts/            # Setup and utility scripts
└── docker-compose.yml  # Multi-service orchestration
```

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test API endpoints and database operations
- **Property-Based Tests**: Test universal properties with randomized inputs
- **End-to-End Tests**: Test complete user workflows

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:backend
npm run test:frontend

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

For comprehensive deployment instructions, please refer to the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md).

### Production Build

```bash
# Build all services
npm run build

# Build Docker images
npm run docker:build
```

### Environment Configuration

For production deployment:

1. Update environment variables in `.env` files
2. Configure SSL certificates in `nginx/ssl/`
3. Set up monitoring and logging
4. Configure backup strategies

### Docker Deployment

```bash
# Production deployment
docker-compose --profile production up -d
```

## 📊 Monitoring and Logging

- **Application Logs**: Winston-based structured logging
- **Health Checks**: Built-in health check endpoints
- **Performance Monitoring**: APM integration ready
- **Error Tracking**: Comprehensive error handling and reporting

## 🔒 Security

- **Authentication**: JWT-based with Supabase Auth
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Row Level Security (RLS) with Supabase
- **Input Validation**: Zod schema validation
- **Rate Limiting**: API rate limiting with Redis
- **Security Headers**: Comprehensive security headers via Nginx

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Use conventional commit messages
- Ensure all linting passes
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation at `/api/v1/docs`

## 🎯 Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced AI features (ML model training)
- [ ] Multi-tenant architecture
- [ ] Advanced analytics dashboard
- [ ] Integration with external systems
- [ ] Performance optimizations
- [ ] Enhanced security features

---

**Built with ❤️ for modern academic institutions**