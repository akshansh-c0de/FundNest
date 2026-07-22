from fastapi import APIRouter, HTTPException, UploadFile, File
from models.schemas import DocumentAnalysisRequest, DocumentAnalysisResponse
import fitz  # PyMuPDF
import os

router = APIRouter()

@router.post("/document-analysis", response_model=DocumentAnalysisResponse)
async def document_analysis(request: DocumentAnalysisRequest):
    """
    Analyze uploaded document (pitch deck, business plan, financial statement)
    """
    try:
        text_content = request.text_content
        
        if not text_content and request.file_path:
            # Read from file if provided
            if os.path.exists(request.file_path):
                with open(request.file_path, 'r', encoding='utf-8') as f:
                    text_content = f.read()
        
        if not text_content:
            raise HTTPException(status_code=400, detail="No text content provided")
        
        # Analyze document
        key_findings = []
        completeness_score = 0
        quality_score = 0
        recommendations = []
        extracted_data = {}
        
        # Check for key sections
        sections = {
            'executive summary': ['executive', 'summary', 'overview'],
            'market analysis': ['market', 'industry', 'competition'],
            'business model': ['business model', 'revenue', 'monetization'],
            'financials': ['financial', 'revenue', 'profit', 'cost'],
            'team': ['team', 'founders', 'management'],
            'milestones': ['milestone', 'timeline', 'roadmap']
        }
        
        text_lower = text_content.lower()
        for section, keywords in sections.items():
            if any(keyword in text_lower for keyword in keywords):
                key_findings.append(f"{section.capitalize()} section detected")
                completeness_score += 16.67  # 100 / 6 sections
        
        completeness_score = min(100, completeness_score)
        
        # Quality assessment based on length and structure
        word_count = len(text_content.split())
        if word_count > 500:
            quality_score += 40
        if word_count > 1000:
            quality_score += 30
        if any(keyword in text_lower for keyword in ['data', 'metrics', 'traction']):
            quality_score += 15
        if any(keyword in text_lower for keyword in ['growth', 'revenue', 'customers']):
            quality_score += 15
        
        quality_score = min(100, quality_score)
        
        # Extract key data
        if '$' in text_content:
            extracted_data['currency_mentions'] = True
        if any(num in text_content for num in ['2024', '2025', '2026']):
            extracted_data['timeline_mentioned'] = True
        if any(word in text_lower for word in ['million', 'billion', 'thousand']):
            extracted_data['financial_scale_mentioned'] = True
        
        # Generate recommendations
        if completeness_score < 70:
            recommendations.append("Add missing sections for completeness")
        if quality_score < 70:
            recommendations.append("Include more detailed metrics and data")
        if 'team' not in text_lower:
            recommendations.append("Add team section with founder details")
        if 'financial' not in text_lower:
            recommendations.append("Include financial projections and metrics")
        
        return DocumentAnalysisResponse(
            document_type=request.document_type,
            key_findings=key_findings,
            completeness_score=round(completeness_score, 1),
            quality_score=round(quality_score, 1),
            recommendations=recommendations,
            extracted_data=extracted_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and extract text from a document (PDF)
    """
    try:
        # Save uploaded file
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract text if PDF
        text_content = ""
        if file.filename.endswith('.pdf'):
            doc = fitz.open(file_path)
            for page in doc:
                text_content += page.get_text()
            doc.close()
        else:
            # Try to read as text
            with open(file_path, 'r', encoding='utf-8') as f:
                text_content = f.read()
        
        return {
            "success": True,
            "file_path": file_path,
            "text_content": text_content[:5000],  # Return first 5000 chars
            "total_length": len(text_content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
