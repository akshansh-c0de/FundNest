from fastapi import APIRouter, HTTPException
from models.schemas import FundingReadinessRequest, FundingReadinessResponse
from services.analysis_service import AnalysisService

router = APIRouter()

@router.post("/funding-readiness", response_model=FundingReadinessResponse)
async def funding_readiness(request: FundingReadinessRequest):
    """
    Assess startup's readiness for funding
    """
    try:
        startup_dict = request.startup.model_dump()
        result = AnalysisService.assess_funding_readiness(startup_dict)
        return FundingReadinessResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
