from fastapi import APIRouter, HTTPException
from models.schemas import InvestorMatchingRequest, InvestorMatchingResponse
from services.embedding_service import get_embedding_service
import numpy as np

router = APIRouter()

@router.post("/match-investors", response_model=InvestorMatchingResponse)
async def match_investors(request: InvestorMatchingRequest):
    """
    Match startup with suitable investors based on profile compatibility
    """
    try:
        startup_dict = request.startup.model_dump()
        matches = []
        
        embedding_service = get_embedding_service()
        
        # Create startup profile text for embedding
        startup_profile = f"{startup_dict.get('name', '')} {startup_dict.get('sector', '')} {startup_dict.get('stage', '')} {startup_dict.get('description', '')} {' '.join(startup_dict.get('tags', []))}"
        startup_embedding = embedding_service.get_embedding(startup_profile)
        
        for investor in request.investor_profiles:
            # Create investor profile text
            investor_profile = f"{' '.join(investor.sectors)} {' '.join(investor.stages)} {' '.join(investor.focus_areas)}"
            investor_embedding = embedding_service.get_embedding(investor_profile)
            
            # Calculate similarity
            similarity = np.dot(startup_embedding, investor_embedding) / (
                np.linalg.norm(startup_embedding) * np.linalg.norm(investor_embedding)
            )
            
            # Check sector match
            sector_match = any(s.lower() in startup_dict.get('sector', '').lower() for s in investor.sectors)
            
            # Check stage match
            stage_match = any(s.lower() in startup_dict.get('stage', '').lower() for s in investor.stages)
            
            # Check investment range
            target_amount = startup_dict.get('target_amount', 0)
            range_match = investor.investment_range[0] <= target_amount <= investor.investment_range[1]
            
            # Calculate overall match score
            match_score = (similarity * 0.4) + (0.3 if sector_match else 0) + (0.2 if stage_match else 0) + (0.1 if range_match else 0)
            
            if match_score > 0.3:  # Only include reasonable matches
                matches.append({
                    "investor_name": investor.name,
                    "match_score": round(match_score * 100, 1),
                    "sector_match": sector_match,
                    "stage_match": stage_match,
                    "range_match": range_match,
                    "similarity_score": round(similarity * 100, 1)
                })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Get top recommendations
        top_recommendations = [m['investor_name'] for m in matches[:5]]
        
        return InvestorMatchingResponse(
            matches=matches[:20],  # Return top 20
            match_count=len(matches),
            top_recommendations=top_recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
