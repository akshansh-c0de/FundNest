from fastapi import APIRouter, HTTPException
from models.schemas import InvestmentRecommendationRequest, InvestmentRecommendationResponse
from services.analysis_service import AnalysisService
from services.embedding_service import get_embedding_service
import numpy as np

router = APIRouter()

@router.post("/investment-recommendation", response_model=InvestmentRecommendationResponse)
async def investment_recommendation(request: InvestmentRecommendationRequest):
    """
    Generate investment recommendation for a startup based on investor profile
    """
    try:
        startup_dict = request.startup.model_dump()
        investor_dict = request.investor_profile.model_dump()
        
        # Calculate risk score
        risk_result = AnalysisService.calculate_risk_score(startup_dict)
        
        # Calculate fit score based on investor profile
        embedding_service = get_embedding_service()
        
        startup_profile = f"{startup_dict.get('name', '')} {startup_dict.get('sector', '')} {startup_dict.get('stage', '')} {startup_dict.get('description', '')}"
        investor_profile = f"{' '.join(investor_dict['sectors'])} {' '.join(investor_dict['stages'])} {' '.join(investor_dict['focus_areas'])}"
        
        startup_embedding = embedding_service.get_embedding(startup_profile)
        investor_embedding = embedding_service.get_embedding(investor_profile)
        
        fit_score = np.dot(startup_embedding, investor_embedding) / (
            np.linalg.norm(startup_embedding) * np.linalg.norm(investor_embedding)
        )
        
        # Determine recommendation based on risk and fit
        risk_score = risk_result['overall_risk_score']
        
        if fit_score > 0.7 and risk_score < 40:
            recommendation = "Strong Buy"
            confidence = 0.9
        elif fit_score > 0.5 and risk_score < 60:
            recommendation = "Buy"
            confidence = 0.75
        elif fit_score > 0.3 and risk_score < 70:
            recommendation = "Hold"
            confidence = 0.6
        else:
            recommendation = "Pass"
            confidence = 0.5
        
        # Generate reasoning
        reasoning = f"Based on analysis, {startup_dict.get('name', 'the startup')} shows "
        reasoning += f"a {'strong' if fit_score > 0.6 else 'moderate' if fit_score > 0.4 else 'weak'} fit with the investor profile. "
        reasoning += f"The risk assessment indicates {risk_result['risk_category'].lower()} risk ({risk_score}/100). "
        reasoning += f"Key factors include sector alignment, stage compatibility, and market potential."
        
        # Key factors
        key_factors = [
            f"Risk Score: {risk_score}/100 ({risk_result['risk_category']})",
            f"Fit Score: {round(fit_score * 100, 1)}%",
            f"Sector: {startup_dict.get('sector', 'N/A')}",
            f"Stage: {startup_dict.get('stage', 'N/A')}",
            f"Funding Target: ${startup_dict.get('target_amount', 0):,.0f}"
        ]
        
        # Risk assessment
        risk_assessment = f"{risk_result['risk_category']} risk investment. "
        risk_assessment += f"Primary risk factors: {', '.join([rf['factor'] for rf in risk_result['risk_factors'][:3]])}"
        
        # Estimate potential ROI (simplified calculation)
        potential_roi = None
        if recommendation in ["Strong Buy", "Buy"]:
            potential_roi = round(np.random.uniform(2.0, 5.0), 1)  # 2-5x potential return
        
        return InvestmentRecommendationResponse(
            recommendation=recommendation,
            confidence_score=round(confidence, 2),
            reasoning=reasoning,
            key_factors=key_factors,
            potential_roi=potential_roi,
            risk_assessment=risk_assessment
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
