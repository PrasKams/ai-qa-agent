import os
from fastapi  import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, validator
import time
from collections import defaultdict
import json

from monitoring import Metrics
from cost_tracking import CostTracker

from performance import rate_limiter, ai_cache


load_dotenv()

app = FastAPI(title="Production QA AI API")

metrics = Metrics()
cost_tracker = CostTracker()


origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
print(origins)


app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)

request_counts = defaultdict(list)

async def check_rate_limit(request: Request, max_requests: int = 10, window: int = 60):
    client_ip = request.client.host
    current_time = time()

    request_counts[client_ip] = [
        t for t in request_counts[client_ip]
        if current_time - t < window
    ]

    if len(request_counts[client_ip]) >= max_requests:
        raise HTTPException(status_code=429, detail= "Rate limit exceeded")
    
    request_counts[client_ip].append(current_time)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)

class TestRequest(BaseModel):
    feature: str = Field(..., min_length=1, max_length=500)



@app.post('/api/chat-cached')
async def chat_cached(request: ChatRequest, req: Request):

    cached = ai_cache.get(request.message)

    if cached:
        return {
            'reponse': cached,
            'cached': True,
            'cost_saved': 0
        }

    model = "gpt-4" if len(request.message) > 200 else "gpt-3.5-turbo"


    user_id = req.client.host

    if not rate_limiter.check_limits(user_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    llm = ChatOpenAI(model=model)
    response = llm.invoke(request.message)

    ai_cache.set(request.message, response.content, model)

    cost = 0.001 if model == "gpt-3.5-turbo" else 0.01
    cost_tracker.track_usage(model, len(request.message)//4, len(response.content)//4)

    return {
        'response': response.content,
        'cached': False,
        'model_used': model,
        'cost_saved': cost
    }

@app.get('/api/cache-stats')
async def get_cache_stats():
    return ai_cache.get_stats()




@app.get('/')
async def root():
    return {
        "status": "healthy",
        "message": "QA AI Backend is running!",
        "endpoints": [
            "/docs",
            "/api/stream-chat",
            "/api/stream-test-cases"
        ]
    }

@app.get('/api/health')
async def health_check():
    return { 'status' : 'healthy', 'timestamp': time.time() }

@app.post('/api/chat')
async def chat(request_data: ChatRequest, request:Request):
    await check_rate_limit(request)

    response = llm.invoke(request_data.message)

    return { 'response': response.content, 'timestamp': time.time()}


@app.post('/api/generate-test-cases')
async def generate_test_cases(request_data: TestRequest, request: Request):
    await check_rate_limit(request)

    prompt = f"""Generate test cases as JSON array for: {request_data.feature}"""
    response = llm.invoke(prompt)

    print("RAW LLM RESPONSE:", response.content)

    try:
        test_cases = json.loads(response.content)
    except Exception as e:
        print("JSON ERROR:", e)
        raise HTTPException(status_code=500, detail="Invalid JSON from LLM")

    return { 'testCases': test_cases, 'count': len(test_cases)}





if __name__ == '__main__':
    import uvicorn
    print("Streaming AI Backend on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
