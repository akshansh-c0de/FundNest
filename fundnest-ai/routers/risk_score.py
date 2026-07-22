from fastapi import APIRouter, HTTPException
from models.schemas import RiskScoreRequest, RiskScoreResponse
from services.analysis_service import AnalysisService

router = APIRouter()

@router.post("/risk-score", response_model=RiskScoreResponse)
async def risk_score(request: RiskScoreRequest):
    """
    Calculate risk score for investment decision
    """
    try:
        startup_dict = request.startup.model_dump()
        result = AnalysisService.calculate_risk_score(startup_dict, request.financial_data)
        return RiskScoreResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
