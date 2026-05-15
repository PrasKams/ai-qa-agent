import os
import logging
import time
from collections import defaultdict
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime

app = FastAPI()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

@app.middleware("https")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    logger.info(f"Incoming request: {request.method} {request.url.path}")

    response = await call_next(request)

    duration = time.time() - start_time
    logger.info(f"Response {response.status_code} - Duration: {duration:.2f} seconds")

    return response

class Metrics:
    def __init__(self):
        self.requests = defaultdict(int)
        self.errors = defaultdict(int)
        self.response_times = []
        self.ai_requests = 0
        self.ai_tokens = 0

    def record_requests(self, endpoint: str):
        self.requests[endpoint] += 1

    def record_errors(self, error_type: str):
        self.errors[error_type] += 1

    def record_response_time(self,duration: float):
        self.response_times.append(duration)
    
        if len(self.response_times) > 1000:
            self.response_times = self.response_times[-1000:]
    
    def record_ai_request(self, tokens: int):
        self.ai_requests += 1
        self.ai_tokens += tokens
    
    def get_stats(self):
        avg_response = (
            sum(self.response_times) / len(self.response_times)
            if self.response_times else 0
        )

        return {
            "total_requests" : sum(self.requests.values()),
            "requests_by_endpoint": dict(self.requests),
            "total_errors": sum(self.errors.values()),
            "errors_by_type": dict(self.errors),
            "avg_response_time": round(avg_response, 2),
            "ai_requests": self.ai_requests,
            "ai_tokens_used": self.ai_tokens
        }
metrics = Metrics()

@app.get('/api/metrics')
async def get_metrics():

    return metrics.get_stats()

@app.get('/api/health')
async def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'uptime': time.time(),
        'metrics': metrics.get_stats()
    }