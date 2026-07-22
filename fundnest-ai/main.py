from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from routers import (
    pitch_analysis,
    summary,
    swot,
    risk_score,
    funding_readiness,
    business_model,
    document_analysis,
    investor_matching,
    investment_recommendation,
    chat
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize models and vector store
    print("Initializing AI Service...")
    print("AI Service started successfully")
    yield
    # Shutdown: Cleanup
    print("AI Service shutting down...")

app = FastAPI(
    title="FundNest AI Service",
    description="AI-powered investor-startup intelligence platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:5000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FundNest AI"}

# Include Routers
app.include_router(pitch_analysis.router, prefix="/api", tags=["Pitch Analysis"])
app.include_router(summary.router, prefix="/api", tags=["Summary"])
app.include_router(swot.router, prefix="/api", tags=["SWOT Analysis"])
app.include_router(risk_score.router, prefix="/api", tags=["Risk Score"])
app.include_router(funding_readiness.router, prefix="/api", tags=["Funding Readiness"])
app.include_router(business_model.router, prefix="/api", tags=["Business Model"])
app.include_router(document_analysis.router, prefix="/api", tags=["Document Analysis"])
app.include_router(investor_matching.router, prefix="/api", tags=["Investor Matching"])
app.include_router(investment_recommendation.router, prefix="/api", tags=["Investment Recommendation"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
