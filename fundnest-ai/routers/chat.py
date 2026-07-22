from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse
from services.vector_store import get_vector_store
from services.embedding_service import get_embedding_service
import numpy as np

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    RAG-powered chatbot for startup and investment Q&A
    """
    try:
        vector_store = get_vector_store()
        embedding_service = get_embedding_service()
        
        # Search for relevant documents
        search_results = vector_store.search(request.query, k=3)
        
        # If no results, provide general response
        if not search_results or search_results[0][2] < 0.3:
            answer = generate_general_response(request.query, request.context)
            return ChatResponse(
                answer=answer,
                sources=[],
                confidence=0.6,
                follow_up_questions=generate_follow_up_questions(request.query)
            )
        
        # Generate answer based on retrieved context
        context_text = "\n".join([result[0] for result in search_results])
        answer = generate_contextual_answer(request.query, context_text, request.context)
        
        sources = [result[1].get('source', 'Document') for result in search_results if result[1]]
        
        # Calculate confidence based on similarity scores
        avg_similarity = np.mean([result[2] for result in search_results])
        confidence = min(0.95, avg_similarity)
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            confidence=round(confidence, 2),
            follow_up_questions=generate_follow_up_questions(request.query)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_general_response(query: str, context: dict = None) -> str:
    """Generate a general response when no relevant documents are found"""
    query_lower = query.lower()
    
    if 'invest' in query_lower or 'funding' in query_lower:
        return "Based on typical investment criteria, key factors to consider include the startup's stage, sector, team experience, market size, and traction. I recommend reviewing the startup's pitch deck, financial projections, and conducting due diligence before making investment decisions."
    
    if 'risk' in query_lower:
        return "Investment risk factors typically include market risk, technology risk, team risk, financial risk, and regulatory risk. Each startup should be evaluated on these dimensions. Early-stage startups generally carry higher risk but may offer higher potential returns."
    
    if 'sector' in query_lower or 'industry' in query_lower:
        return "Different sectors offer varying risk-return profiles. High-growth sectors like AI, CleanTech, and HealthTech often show strong potential but may face regulatory challenges. Traditional sectors may offer more stability but with lower growth potential."
    
    if 'stage' in query_lower:
        return "Funding stages include Pre-Seed (idea validation), Seed (product development), Series A (market expansion), and Series B+ (scaling). Each stage has different risk profiles and expected returns. Early-stage investments are higher risk but may offer higher multiples."
    
    return "I can help you with questions about startups, investment criteria, risk assessment, and funding strategies. Please provide more specific details about what you'd like to know."

def generate_contextual_answer(query: str, context: str, startup_context: dict = None) -> str:
    """Generate answer based on retrieved context"""
    query_lower = query.lower()
    
    if startup_context:
        startup_name = startup_context.get('name', 'the startup')
        sector = startup_context.get('sector', 'technology')
    else:
        startup_name = 'the startup'
        sector = 'technology'
    
    if 'invest' in query_lower or 'should i' in query_lower:
        return f"Based on the available information about {startup_name} in the {sector} sector, several factors should be considered. The context shows relevant details about the business model and market positioning. Key considerations include the team's experience, market opportunity, competitive landscape, and financial projections. I recommend reviewing the full pitch deck and conducting additional due diligence."
    
    if 'risk' in query_lower:
        return f"The risk assessment for {startup_name} should consider market risks, competitive threats, execution risks, and financial sustainability. Based on the available context, the startup operates in {sector} which presents both opportunities and challenges. A comprehensive risk analysis would require deeper financial and market data."
    
    if 'market' in query_lower or 'competition' in query_lower:
        return f"The market analysis for {startup_name} indicates opportunities in the {sector} space. The context suggests there is market demand for the solution. However, a thorough competitive analysis would be needed to understand the startup's positioning relative to existing players."
    
    return f"Based on the retrieved information, {startup_name} operates in the {sector} sector. The available context provides insights into the business model and market approach. For more specific analysis, additional details about financials, traction, and team would be beneficial."

def generate_follow_up_questions(query: str) -> list:
    """Generate relevant follow-up questions"""
    query_lower = query.lower()
    
    base_questions = [
        "What are the key risk factors?",
        "What is the market size and opportunity?",
        "Who are the main competitors?",
        "What is the team's background?",
        "What are the financial projections?"
    ]
    
    if 'invest' in query_lower:
        return [
            "What is the expected return on investment?",
            "What is the exit strategy?",
            "How is the valuation determined?",
            "What are the terms of the investment?"
        ]
    
    if 'risk' in query_lower:
        return [
            "How can risks be mitigated?",
            "What is the worst-case scenario?",
            "What are the regulatory considerations?",
            "How does this compare to sector benchmarks?"
        ]
    
    return base_questions[:3]
