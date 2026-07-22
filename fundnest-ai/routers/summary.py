from fastapi import APIRouter, HTTPException
from models.schemas import SummaryRequest, SummaryResponse
from services.analysis_service import AnalysisService

router = APIRouter()

@router.post("/generate-summary", response_model=SummaryResponse)
async def generate_summary(request: SummaryRequest):
    """
    Generate executive summary for a startup
    """
    try:
        startup_dict = request.startup.model_dump()
        result = AnalysisService.generate_summary(startup_dict)
        return SummaryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
