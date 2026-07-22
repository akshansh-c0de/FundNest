from fastapi import APIRouter, HTTPException
from models.schemas import SWOTAnalysisRequest, SWOTAnalysisResponse
from services.analysis_service import AnalysisService

router = APIRouter()

@router.post("/swot-analysis", response_model=SWOTAnalysisResponse)
async def swot_analysis(request: SWOTAnalysisRequest):
    """
    Perform SWOT analysis for a startup
    """
    try:
        startup_dict = request.startup.model_dump()
        result = AnalysisService.swot_analysis(startup_dict, request.pitch_text)
        return SWOTAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
