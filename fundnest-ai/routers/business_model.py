from fastapi import APIRouter, HTTPException
from models.schemas import BusinessModelAnalysisRequest, BusinessModelAnalysisResponse
from services.analysis_service import AnalysisService

router = APIRouter()

@router.post("/business-model-analysis", response_model=BusinessModelAnalysisResponse)
async def business_model_analysis(request: BusinessModelAnalysisRequest):
    """
    Analyze business model of a startup
    """
    try:
        startup_dict = request.startup.model_dump()
        result = AnalysisService.analyze_business_model(startup_dict, request.business_plan)
        return BusinessModelAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
