from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class StartupData(BaseModel):
    name: str
    sector: str
    stage: str
    description: str
    target_amount: float
    raised_amount: float = 0
    location: Optional[str] = None
    team_size: Optional[int] = None
    annual_revenue: Optional[float] = 0
    equity: Optional[float] = None
    tags: Optional[List[str]] = []

class PitchAnalysisRequest(BaseModel):
    startup: StartupData
    pitch_text: Optional[str] = None

class PitchAnalysisResponse(BaseModel):
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    clarity_score: float = Field(..., ge=0, le=10)
    persuasiveness_score: float = Field(..., ge=0, le=10)
    overall_score: float = Field(..., ge=0, le=10)
    recommendations: List[str]

class SummaryRequest(BaseModel):
    startup: StartupData
    documents: Optional[List[str]] = None

class SummaryResponse(BaseModel):
    executive_summary: str
    key_highlights: List[str]
    market_opportunity: str
    business_overview: str

class SWOTAnalysisRequest(BaseModel):
    startup: StartupData
    pitch_text: Optional[str] = None

class SWOTAnalysisResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]
    analysis: str

class RiskScoreRequest(BaseModel):
    startup: StartupData
    financial_data: Optional[Dict[str, Any]] = None

class RiskScoreResponse(BaseModel):
    overall_risk_score: float = Field(..., ge=0, le=100)
    risk_category: str = Field(..., description="Low, Medium, High, or Very High")
    risk_factors: List[Dict[str, Any]]
    mitigation_strategies: List[str]
    confidence_score: float = Field(..., ge=0, le=1)

class FundingReadinessRequest(BaseModel):
    startup: StartupData
    documents: Optional[List[str]] = None

class FundingReadinessResponse(BaseModel):
    readiness_score: float = Field(..., ge=0, le=100)
    readiness_level: str
    gaps: List[str]
    strengths: List[str]
    recommendations: List[str]
    estimated_timeline: str

class BusinessModelAnalysisRequest(BaseModel):
    startup: StartupData
    business_plan: Optional[str] = None

class BusinessModelAnalysisResponse(BaseModel):
    business_model_type: str
    revenue_streams: List[str]
    cost_structure: List[str]
    value_proposition: str
    competitive_advantage: str
    scalability_assessment: str
    sustainability_score: float = Field(..., ge=0, le=10)

class DocumentAnalysisRequest(BaseModel):
    document_type: str = Field(..., description="pitch_deck, business_plan, financial_statement")
    file_path: Optional[str] = None
    text_content: Optional[str] = None

class DocumentAnalysisResponse(BaseModel):
    document_type: str
    key_findings: List[str]
    completeness_score: float = Field(..., ge=0, le=100)
    quality_score: float = Field(..., ge=0, le=100)
    recommendations: List[str]
    extracted_data: Dict[str, Any]

class InvestorProfile(BaseModel):
    name: str
    sectors: List[str]
    stages: List[str]
    investment_range: tuple
    focus_areas: List[str]
    ticket_size: tuple

class InvestorMatchingRequest(BaseModel):
    startup: StartupData
    investor_profiles: List[InvestorProfile]

class InvestorMatchingResponse(BaseModel):
    matches: List[Dict[str, Any]]
    match_count: int
    top_recommendations: List[str]

class InvestmentRecommendationRequest(BaseModel):
    startup: StartupData
    investor_profile: InvestorProfile
    market_data: Optional[Dict[str, Any]] = None

class InvestmentRecommendationResponse(BaseModel):
    recommendation: str = Field(..., description="Strong Buy, Buy, Hold, or Pass")
    confidence_score: float = Field(..., ge=0, le=1)
    reasoning: str
    key_factors: List[str]
    potential_roi: Optional[float] = None
    risk_assessment: str

class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str

class ChatRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[ChatMessage]] = None

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None
    confidence: float = Field(..., ge=0, le=1)
    follow_up_questions: Optional[List[str]] = None
