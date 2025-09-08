from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv
from loguru import logger
import motor.motor_asyncio
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import nltk
import httpx

# Download NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('tokenizers/stopwords')
except LookupError:
    nltk.download('stopwords')

# Load environment variables
load_dotenv()

app = FastAPI(
    title="MBC AI Analytics Service",
    description="AI-powered analytics and prediction service for MBC Department Management",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/mbc_ai"))
db = client.mbc_ai

# Sentiment analyzer
sentiment_analyzer = SentimentIntensityAnalyzer()

# Pydantic models
class StudentData(BaseModel):
    studentId: str
    marks: List[Dict[str, Any]]
    gpa: Optional[float] = None
    branch: Optional[str] = None

class FeedbackData(BaseModel):
    text: str
    source: Optional[str] = "unknown"
    category: Optional[str] = "general"

class PredictionRequest(BaseModel):
    studentId: str
    subjectId: Optional[str] = None
    predictionType: str = "linear_regression"

class AnalyticsResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None

# Dependency for backend communication
async def get_backend_client():
    backend_url = os.getenv("BACKEND_URL", "http://localhost:5000")
    return httpx.AsyncClient(base_url=backend_url)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Analytics Service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# Analytics endpoints
@app.get("/api/v1/analytics/performance", response_model=AnalyticsResponse)
async def get_student_performance(
    studentId: str,
    request: Request,
    backend_client: httpx.AsyncClient = Depends(get_backend_client)
):
    try:
        # Get auth token from request
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise HTTPException(status_code=401, detail="Authorization required")

        # Fetch student marks from main backend
        response = await backend_client.get(
            f"/api/v1/students/{studentId}/marks",
            headers={"Authorization": auth_header}
        )

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch student data")

        marks_data = response.json()
        marks = marks_data.get("data", [])

        if not marks:
            return AnalyticsResponse(
                success=True,
                data={"message": "No marks data available for analysis"}
            )

        # Calculate analytics
        analytics = await calculate_performance_analytics(marks)

        return AnalyticsResponse(success=True, data=analytics)

    except Exception as e:
        logger.error(f"Error calculating performance analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate performance analytics")

@app.get("/api/v1/analytics/department", response_model=AnalyticsResponse)
async def get_department_analytics(
    request: Request,
    backend_client: httpx.AsyncClient = Depends(get_backend_client)
):
    try:
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise HTTPException(status_code=401, detail="Authorization required")

        # Fetch all students data
        response = await backend_client.get(
            "/api/v1/students",
            headers={"Authorization": auth_header}
        )

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch department data")

        students_data = response.json()
        students = students_data.get("data", [])

        # Calculate department analytics
        analytics = await calculate_department_analytics(students)

        return AnalyticsResponse(success=True, data=analytics)

    except Exception as e:
        logger.error(f"Error calculating department analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate department analytics")

# Prediction endpoints
@app.post("/api/v1/prediction/performance", response_model=AnalyticsResponse)
async def predict_performance(
    prediction_request: PredictionRequest,
    request: Request,
    backend_client: httpx.AsyncClient = Depends(get_backend_client)
):
    try:
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise HTTPException(status_code=401, detail="Authorization required")

        # Fetch student marks
        response = await backend_client.get(
            f"/api/v1/students/{prediction_request.studentId}/marks",
            headers={"Authorization": auth_header}
        )

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch student data")

        marks_data = response.json()
        marks = marks_data.get("data", [])

        if len(marks) < 3:
            return AnalyticsResponse(
                success=False,
                data={"error": "Insufficient data for prediction. Need at least 3 marks."}
            )

        # Generate prediction based on type
        if prediction_request.predictionType == "linear_regression":
            prediction = await predict_with_linear_regression(marks, prediction_request.subjectId)
        elif prediction_request.predictionType == "grade_prediction":
            prediction = await predict_grade(marks)
        else:
            prediction = await predict_with_linear_regression(marks, prediction_request.subjectId)

        return AnalyticsResponse(success=True, data=prediction)

    except Exception as e:
        logger.error(f"Error generating prediction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate prediction")

# Sentiment analysis endpoints
@app.post("/api/v1/sentiment/feedback", response_model=AnalyticsResponse)
async def analyze_feedback_sentiment(feedback: FeedbackData):
    try:
        # Perform sentiment analysis
        analysis = await analyze_sentiment(feedback.text)

        result = {
            "text": feedback.text,
            "source": feedback.source,
            "sentiment": analysis,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Store in database for future analysis
        await db.feedback_sentiment.insert_one(result)

        return AnalyticsResponse(success=True, data=result)

    except Exception as e:
        logger.error(f"Error analyzing feedback sentiment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze feedback sentiment")

@app.get("/api/v1/sentiment/report", response_model=AnalyticsResponse)
async def get_sentiment_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None
):
    try:
        # Build query
        query = {}
        if start_date:
            query["timestamp"] = {"$gte": start_date}
        if end_date:
            if "timestamp" not in query:
                query["timestamp"] = {}
            query["timestamp"]["$lte"] = end_date
        if category:
            query["source"] = category

        # Fetch sentiment data
        sentiments = await db.feedback_sentiment.find(query).to_list(length=None)

        if not sentiments:
            return AnalyticsResponse(
                success=True,
                data={"message": "No sentiment data available for the specified period"}
            )

        # Generate report
        report = await generate_sentiment_report(sentiments)

        return AnalyticsResponse(success=True, data=report)

    except Exception as e:
        logger.error(f"Error generating sentiment report: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate sentiment report")

# Helper functions
async def calculate_performance_analytics(marks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate comprehensive performance analytics"""
    if not marks:
        return {"message": "No marks data available"}

    # Convert to DataFrame for easier analysis
    df = pd.DataFrame(marks)

    # Basic statistics
    analytics = {
        "total_subjects": len(df),
        "average_score": round(df['score'].mean(), 2),
        "highest_score": df['score'].max(),
        "lowest_score": df['score'].min(),
        "score_range": df['score'].max() - df['score'].min(),
        "standard_deviation": round(df['score'].std(), 2)
    }

    # Subject-wise analysis
    if 'subject' in df.columns:
        subject_analysis = df.groupby('subject')['score'].agg(['mean', 'count', 'std']).round(2)
        analytics['subject_wise'] = subject_analysis.to_dict('index')

    # Grade distribution
    def get_grade(score):
        if score >= 90: return 'A'
        elif score >= 80: return 'B'
        elif score >= 70: return 'C'
        elif score >= 60: return 'D'
        else: return 'F'

    df['grade'] = df['score'].apply(get_grade)
    grade_dist = df['grade'].value_counts().to_dict()
    analytics['grade_distribution'] = grade_dist

    # Trend analysis
    if len(df) > 1:
        df = df.sort_values('date' if 'date' in df.columns else df.index)
        scores = df['score'].values
        trend = "improving" if scores[-1] > scores[0] else "declining" if scores[-1] < scores[0] else "stable"
        analytics['trend'] = trend

    return analytics

async def calculate_department_analytics(students: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate department-wide analytics"""
    if not students:
        return {"message": "No student data available"}

    df = pd.DataFrame(students)

    analytics = {
        "total_students": len(df),
        "active_students": len(df[df.get('isActive', True) == True]) if 'isActive' in df.columns else len(df)
    }

    # Branch-wise analysis
    if 'branch' in df.columns:
        branch_stats = df.groupby('branch').agg({
            'gpa': ['mean', 'count', 'std'] if 'gpa' in df.columns else ['count']
        }).round(2)
        analytics['branch_wise'] = branch_stats.to_dict()

    # GPA analysis
    if 'gpa' in df.columns:
        gpa_data = df['gpa'].dropna()
        if len(gpa_data) > 0:
            analytics['gpa_stats'] = {
                "average_gpa": round(gpa_data.mean(), 2),
                "highest_gpa": gpa_data.max(),
                "lowest_gpa": gpa_data.min(),
                "gpa_distribution": pd.cut(gpa_data, bins=[0, 6, 7, 8, 9, 10], labels=['<6', '6-7', '7-8', '8-9', '9-10']).value_counts().to_dict()
            }

    return analytics

async def predict_with_linear_regression(marks: List[Dict[str, Any]], subject_id: Optional[str] = None) -> Dict[str, Any]:
    """Predict performance using linear regression"""
    # Filter by subject if specified
    if subject_id:
        marks = [m for m in marks if m.get('subjectId') == subject_id]

    if len(marks) < 3:
        return {"error": "Insufficient data for linear regression"}

    # Prepare data
    df = pd.DataFrame(marks)
    df['time_index'] = range(len(df))

    X = df[['time_index']].values
    y = df['score'].values

    # Train model
    model = LinearRegression()
    model.fit(X, y)

    # Predict next score
    next_x = np.array([[len(df)]])
    predicted_score = model.predict(next_x)[0]

    # Calculate confidence interval (simplified)
    residuals = y - model.predict(X)
    std_error = np.std(residuals)
    confidence_interval = 1.96 * std_error

    return {
        "method": "linear_regression",
        "current_average": round(np.mean(y), 2),
        "predicted_next_score": round(max(0, min(100, predicted_score)), 2),
        "confidence_interval": {
            "lower": round(max(0, predicted_score - confidence_interval), 2),
            "upper": round(min(100, predicted_score + confidence_interval), 2)
        },
        "slope": round(model.coef_[0], 4),
        "intercept": round(model.intercept_, 4),
        "r_squared": round(model.score(X, y), 4),
        "trend": "improving" if model.coef_[0] > 0 else "declining" if model.coef_[0] < 0 else "stable"
    }

async def predict_grade(marks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Predict final grade based on current performance"""
    if not marks:
        return {"error": "No marks data available"}

    scores = [m['score'] for m in marks]
    average = np.mean(scores)

    def get_predicted_grade(score):
        if score >= 90: return 'A'
        elif score >= 80: return 'B'
        elif score >= 70: return 'C'
        elif score >= 60: return 'D'
        else: return 'F'

    predicted_grade = get_predicted_grade(average)

    return {
        "method": "grade_prediction",
        "current_average": round(average, 2),
        "predicted_grade": predicted_grade,
        "grade_breakdown": {
            "A": average >= 90,
            "B": average >= 80 and average < 90,
            "C": average >= 70 and average < 80,
            "D": average >= 60 and average < 70,
            "F": average < 60
        },
        "confidence": "high" if len(scores) >= 5 else "medium" if len(scores) >= 3 else "low"
    }

async def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Analyze sentiment of text using multiple methods"""
    # VADER sentiment
    vader_scores = sentiment_analyzer.polarity_scores(text)

    # TextBlob sentiment
    blob = TextBlob(text)
    textblob_score = blob.sentiment.polarity

    # Combine results
    combined_score = (vader_scores['compound'] + textblob_score) / 2

    # Classify sentiment
    if combined_score > 0.1:
        sentiment_class = "positive"
    elif combined_score < -0.1:
        sentiment_class = "negative"
    else:
        sentiment_class = "neutral"

    # Calculate confidence
    confidence = min(abs(combined_score) * 2, 1.0)

    return {
        "vader": {
            "compound": round(vader_scores['compound'], 3),
            "positive": round(vader_scores['pos'], 3),
            "negative": round(vader_scores['neg'], 3),
            "neutral": round(vader_scores['neu'], 3)
        },
        "textblob": {
            "polarity": round(blob.sentiment.polarity, 3),
            "subjectivity": round(blob.sentiment.subjectivity, 3)
        },
        "combined": {
            "score": round(combined_score, 3),
            "classification": sentiment_class,
            "confidence": round(confidence, 3)
        }
    }

async def generate_sentiment_report(sentiments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate comprehensive sentiment report"""
    if not sentiments:
        return {"message": "No sentiment data available"}

    df = pd.DataFrame(sentiments)

    report = {
        "summary": {
            "total_feedbacks": len(df),
            "date_range": {
                "start": df['timestamp'].min() if 'timestamp' in df.columns else None,
                "end": df['timestamp'].max() if 'timestamp' in df.columns else None
            }
        },
        "sentiment_distribution": {},
        "average_scores": {},
        "trends": {}
    }

    # Sentiment distribution
    if 'sentiment' in df.columns:
        classifications = df['sentiment'].apply(lambda x: x.get('combined', {}).get('classification', 'unknown') if isinstance(x, dict) else 'unknown')
        report['sentiment_distribution'] = classifications.value_counts().to_dict()

        # Average scores
        scores = df['sentiment'].apply(lambda x: x.get('combined', {}).get('score', 0) if isinstance(x, dict) else 0)
        report['average_scores'] = {
            "overall": round(scores.mean(), 3),
            "positive": round(scores[scores > 0.1].mean(), 3) if len(scores[scores > 0.1]) > 0 else 0,
            "negative": round(scores[scores < -0.1].mean(), 3) if len(scores[scores < -0.1]) > 0 else 0
        }

    # Trends over time
    if 'timestamp' in df.columns:
        df['date'] = pd.to_datetime(df['timestamp']).dt.date
        daily_sentiment = df.groupby('date')['sentiment'].apply(
            lambda x: np.mean([s.get('combined', {}).get('score', 0) for s in x if isinstance(s, dict)])
        )
        report['trends'] = {
            "daily_average": daily_sentiment.to_dict(),
            "overall_trend": "improving" if daily_sentiment.iloc[-1] > daily_sentiment.iloc[0] else "declining" if daily_sentiment.iloc[-1] < daily_sentiment.iloc[0] else "stable"
        }

    return report

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"}
    )

if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", 5001))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
