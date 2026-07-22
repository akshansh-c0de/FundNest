# FundNest – GenAI Powered Investor–Startup Intelligence Platform

An enterprise-level B.Tech Final Year Project that connects investors with startups using AI-powered intelligence and analytics.

## 🏗️ Project Structure

```
FundNest/
├── fundnest-frontend/      # React.js + TypeScript frontend
├── fundnest-backend/       # Node.js + Express backend
├── fundnest-ai/           # Python + FastAPI AI service
└── README.md
```

## 🚀 Technology Stack

### Frontend (fundnest-frontend)
- **React.js** with TypeScript
- **Vite** for build tooling
- **TanStack Router** for routing
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Axios** for API calls
- **React Hook Form** + **Zod** for forms
- **Socket.IO Client** for real-time updates

### Backend (fundnest-backend)
- **Node.js** + **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Socket.IO** for real-time messaging
- **Nodemailer** for emails

### AI Service (fundnest-ai)
- **Python** + **FastAPI**
- **LangChain** for AI orchestration
- **Sentence Transformers** for embeddings
- **FAISS** for vector search
- **PyTorch** for deep learning
- **Scikit-learn** for ML algorithms
- **PyMuPDF** for document processing

## 📋 Features

### For Founders
- Create and manage startup campaigns
- Upload pitch decks, business plans, and financial statements
- Track funding progress and milestones
- AI-powered pitch analysis and feedback
- Funding readiness assessment
- Business model analysis
- SWOT analysis
- Risk assessment

### For Investors
- Browse and discover startups
- AI-powered startup recommendations
- Investment risk scoring
- Portfolio management
- Watchlist/bookmark functionality
- Compare startups
- Real-time notifications
- AI chatbot for Q&A

### For Admins
- User management and verification
- Startup approval workflow
- KYC verification
- Platform analytics
- Audit logs
- Activity monitoring

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (running locally or MongoDB Atlas)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FundNest
```

### 2. Backend Setup (fundnest-backend)
```bash
cd fundnest-backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. AI Service Setup (fundnest-ai)
```bash
cd fundnest-ai
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python main.py
```

AI Service runs on `http://localhost:8000`

### 4. Frontend Setup (fundnest-frontend)
```bash
cd fundnest-frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Frontend runs on `http://localhost:5173`

## 🔐 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/fundnest
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=support@fundnest.com
```

### AI Service (.env)
```
PORT=8000
HOST=0.0.0.0
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHUNK_SIZE=500
CHUNK_OVERLAP=50
VECTOR_DB_PATH=./vector_store
BACKEND_URL=http://localhost:5000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## 🌐 API Documentation

### Backend APIs
- **Authentication**: `/api/users/*`
- **Startups**: `/api/startups/*`
- **Transactions**: `/api/transactions/*`
- **Admin**: `/api/admin/*`
- **Investor**: `/api/investor/*`
- **Notifications**: `/api/notifications/*`
- **AI Integration**: `/api/ai/*`
- **Bookmarks**: `/api/bookmarks/*`
- **Documents**: `/api/documents/*`

### AI Service APIs
- `POST /api/analyze-pitch` - Analyze startup pitch
- `POST /api/generate-summary` - Generate executive summary
- `POST /api/swot-analysis` - Perform SWOT analysis
- `POST /api/risk-score` - Calculate risk score
- `POST /api/funding-readiness` - Assess funding readiness
- `POST /api/business-model-analysis` - Analyze business model
- `POST /api/document-analysis` - Analyze documents
- `POST /api/match-investors` - Match investors with startups
- `POST /api/investment-recommendation` - Get investment recommendations
- `POST /api/chat` - AI-powered chatbot

## 🔄 Integration Flow

```
User → Frontend (React) → Backend (Express) → AI Service (FastAPI) → Backend → Frontend → User
```

The frontend never communicates directly with the AI service. All AI requests go through the backend.

## 🗄️ Database Collections

- **Users** - User accounts and authentication
- **FounderProfiles** - Founder-specific information
- **InvestorProfiles** - Investor-specific information
- **Startups** - Startup campaigns
- **StartupDocuments** - Uploaded documents
- **Investments** - Investment transactions
- **Milestones** - Startup milestones
- **Transactions** - Financial transactions
- **RiskReports** - AI-generated risk reports
- **AIReports** - AI-generated analysis reports
- **Notifications** - User notifications
- **Messages** - User messages
- **Meetings** - Scheduled meetings
- **Bookmarks** - User bookmarks/watchlist
- **Reviews** - Startup reviews
- **ActivityLogs** - User activity tracking
- **AuditLogs** - System audit logs

## 👥 User Roles

- **Admin** - Full platform management
- **Founder** - Create and manage startups
- **Investor** - Browse and invest in startups

## 🧪 Testing

### Backend Tests
```bash
cd fundnest-backend
npm test
```

### AI Service Tests
```bash
cd fundnest-ai
pytest
```

### Frontend Tests
```bash
cd fundnest-frontend
npm test
```

## 📊 AI Features

### Pitch Analysis
- Clarity scoring
- Persuasiveness evaluation
- Strengths and weaknesses identification
- Recommendations for improvement

### SWOT Analysis
- Strengths, Weaknesses, Opportunities, Threats
- Strategic insights
- Competitive positioning

### Risk Assessment
- Overall risk scoring (0-100)
- Risk category classification
- Risk factor identification
- Mitigation strategies

### Funding Readiness
- Readiness score calculation
- Gap analysis
- Improvement recommendations
- Timeline estimation

### Business Model Analysis
- Business model type identification
- Revenue stream analysis
- Cost structure evaluation
- Scalability assessment

### Document Analysis
- PDF/Word/PowerPoint processing
- Key information extraction
- Completeness scoring
- Quality assessment

### Investor Matching
- Semantic similarity matching
- Sector and stage alignment
- Investment range compatibility
- Match scoring

### Investment Recommendations
- Buy/Hold/Pass recommendations
- Confidence scoring
- ROI estimation
- Risk assessment

### AI Chatbot
- RAG-powered Q&A
- Context-aware responses
- Source attribution
- Follow-up suggestions

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet for security headers
- Two-factor authentication (2FA)
- Email verification
- Session management
- Audit logging

## 🚀 Deployment

### Backend Deployment
1. Deploy to Node.js hosting (Heroku, Railway, AWS)
2. Set environment variables
3. Configure MongoDB connection
4. Build and start

### AI Service Deployment
1. Deploy to Python hosting (Heroku, Railway, AWS)
2. Set environment variables
3. Install dependencies
4. Start with uvicorn

### Frontend Deployment
1. Build with `npm run build`
2. Deploy to Vercel, Netlify, or AWS S3
3. Set environment variables
4. Configure routing

## 📝 Development Guidelines

- Follow SOLID principles
- Write modular, reusable code
- Implement proper error handling
- Add input validation
- Write tests for new features
- Follow existing code style
- Document complex logic
- Use TypeScript where applicable

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📄 License

This project is created as a B.Tech Final Year Project.

## 👨‍💻 Authors

B.Tech Final Year Project Team

## 🙏 Acknowledgments

- Open-source community for the amazing tools and libraries
- University guidance and support
- All contributors and testers

---

**Note**: This is an enterprise-grade application suitable for a final-year B.Tech major project and future startup MVP.
