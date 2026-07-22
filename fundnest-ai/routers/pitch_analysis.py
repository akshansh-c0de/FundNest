from fastapi import APIRouter, HTTPException
from models.schemas import PitchAnalysisRequest, PitchAnalysisResponse
from services.analysis_service import AnalysisService

router = APIRouter()

@router.post("/analyze-pitch", response_model=PitchAnalysisResponse)
async def analyze_pitch(request: PitchAnalysisRequest):
    """
    Analyze startup pitch and provide detailed feedback
    """
    try:
        startup_dict = request.startup.model_dump()
        result = AnalysisService.analyze_pitch(startup_dict, request.pitch_text)
        return PitchAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
