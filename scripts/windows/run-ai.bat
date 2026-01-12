@echo off
cd ai-service
python -m uvicorn main:app --reload --host 0.0.0.0 --port 5001
