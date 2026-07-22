# FundNest AI Service

GenAI-powered investor-startup intelligence platform using FastAPI, LangChain, Sentence Transformers, and FAISS.

## Features

- **Pitch Analysis**: Analyze startup pitches and provide feedback
- **Executive Summary**: Generate comprehensive business summaries
- **SWOT Analysis**: Identify strengths, weaknesses, opportunities, and threats
- **Risk Scoring**: Calculate investment risk scores
- **Funding Readiness**: Assess startup readiness for funding
- **Business Model Analysis**: Analyze business models and revenue streams
- **Document Analysis**: Extract and analyze pitch decks, business plans, and financial statements
- **Investor Matching**: Match startups with compatible investors
- **Investment Recommendations**: Generate investment recommendations with confidence scores
- **RAG Chatbot**: AI-powered Q&A using retrieval-augmented generation

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **LangChain**: Framework for developing applications powered by language models
- **Sentence Transformers**: State-of-the-art sentence embeddings
- **FAISS**: Efficient similarity search and clustering of dense vectors
- **PyMuPDF**: PDF text extraction
- **PyTorch**: Deep learning framework
- **Scikit-learn**: Machine learning library
- **Pandas**: Data manipulation and analysis

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running the Service

Development mode:
```bash
python main.py
```

Production mode:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Pitch Analysis
- `POST /api/analyze-pitch` - Analyze startup pitch

### Summary
- `POST /api/generate-summary` - Generate executive summary

### SWOT Analysis
- `POST /api/swot-analysis` - Perform SWOT analysis

### Risk Score
- `POST /api/risk-score` - Calculate risk score

### Funding Readiness
- `POST /api/funding-readiness` - Assess funding readiness

### Business Model
- `POST /api/business-model-analysis` - Analyze business model

### Document Analysis
- `POST /api/document-analysis` - Analyze document
- `POST /api/upload-document` - Upload and extract text from document

### Investor Matching
- `POST /api/match-investors` - Match startup with investors

### Investment Recommendation
- `POST /api/investment-recommendation` - Get investment recommendation

### Chat
- `POST /api/chat` - RAG-powered chatbot

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Architecture

The service follows a clean architecture:

- **models/**: Pydantic schemas for request/response validation
- **services/**: Business logic (embedding, vector store, analysis)
- **routers/**: API route handlers
- **main.py**: Application entry point

## Integration

The AI service is designed to be called by the backend service. The frontend should never communicate directly with the AI service.

Flow:
```
Frontend → Backend → AI Service → Backend → Frontend
```

## Configuration

Environment variables in `.env`:

- `PORT`: Service port (default: 8000)
- `HOST`: Service host (default: 0.0.0.0)
- `EMBEDDING_MODEL`: Sentence transformer model (default: all-MiniLM-L6-v2)
- `VECTOR_DB_PATH`: Path to vector store (default: ./vector_store)
- `BACKEND_URL`: Backend URL for CORS (default: http://localhost:5000)
