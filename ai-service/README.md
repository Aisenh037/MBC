# MBC AI Analytics Service

A FastAPI-based AI service for the MBC Department Management System, providing advanced analytics, predictions, and sentiment analysis.

## 🚀 Features

- **Performance Analytics**: Comprehensive student performance analysis with trends and insights
- **Predictive Modeling**: ML-powered grade predictions and resource forecasting
- **Sentiment Analysis**: Feedback analysis using VADER and TextBlob
- **Department Analytics**: Branch-wise and department-wide statistics
- **Real-time Processing**: FastAPI for high-performance API responses

## 🛠️ Tech Stack

- **Framework**: FastAPI (Python)
- **ML Libraries**: scikit-learn, pandas, numpy
- **NLP**: NLTK, TextBlob, VADER Sentiment
- **Database**: MongoDB (via Motor)
- **Deployment**: Docker, Render-ready

## 📋 Prerequisites

- Python 3.11+
- MongoDB
- Main MBC Backend running

## 🔧 Installation

1. **Clone and navigate to ai-service:**
   ```bash
   cd ai-service
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Download NLTK data:**
   ```bash
   python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
   ```

## 🚀 Running the Service

### Development Mode
```bash
python main.py
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 5001
```

### Docker
```bash
docker build -t mbc-ai-service .
docker run -p 5001:5001 mbc-ai-service
```

## 📚 API Documentation

Once running, visit: `http://localhost:5001/docs` for interactive API documentation.

## 🔗 API Endpoints

### Analytics
- `GET /api/v1/analytics/performance` - Student performance analytics
- `GET /api/v1/analytics/department` - Department-wide analytics

### Predictions
- `POST /api/v1/prediction/performance` - Performance predictions
- `POST /api/v1/prediction/grade` - Grade predictions

### Sentiment Analysis
- `POST /api/v1/sentiment/feedback` - Analyze feedback sentiment
- `GET /api/v1/sentiment/report` - Sentiment analysis report

### Health Check
- `GET /health` - Service health status

## 🔧 Configuration

### Environment Variables (.env)

```env
# Service Configuration
AI_PORT=5001
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/mbc_ai

# Main Backend URL
BACKEND_URL=http://localhost:5000

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info

# AI/ML Configuration
MAX_TOKENS=1000
TEMPERATURE=0.7

# Security
JWT_SECRET=ai_service_jwt_secret_key_here
API_KEY=your_api_key_here
```

## 🔗 Integration with Main Backend

The AI service communicates with the main Node.js backend via HTTP requests:

1. **Authentication**: Uses JWT tokens from main backend
2. **Data Fetching**: Retrieves student data, marks, and analytics
3. **CORS**: Configured for cross-origin requests
4. **Error Handling**: Comprehensive error handling and logging

## 📊 ML Models

### Performance Prediction
- **Linear Regression**: Trend analysis and score prediction
- **Grade Prediction**: Classification-based grade forecasting
- **Time Series Analysis**: Performance trend identification

### Sentiment Analysis
- **VADER**: Rule-based sentiment analysis
- **TextBlob**: Lexicon-based sentiment scoring
- **Combined Approach**: Hybrid sentiment classification

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=main --cov-report=html
```

## 🚀 Deployment

### Render Deployment
1. Connect your GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python main.py`
4. Configure environment variables
5. Deploy!

### Docker Deployment
```bash
# Build image
docker build -t mbc-ai-service .

# Run container
docker run -p 5001:5001 -e MONGO_URI=your_mongo_uri mbc-ai-service
```

## 📈 Monitoring

- **Health Checks**: `/health` endpoint for service monitoring
- **Logging**: Comprehensive logging with Loguru
- **Metrics**: Performance metrics and error tracking
- **Database**: MongoDB connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the logs for error details
- Ensure all environment variables are set correctly
- Verify MongoDB connection
