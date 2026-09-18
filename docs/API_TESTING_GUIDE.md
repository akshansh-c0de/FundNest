# FundNest — API Testing & Viva Defense Guide

This guide provides end-to-end Postman and cURL test cases for every required feature on FundNest, along with defense talking points for viva evaluators.

---

## 🚀 Quick Start: Running the Servers

1. **Backend (Node.js/Express)**:
   ```bash
   cd fundnest-backend
   npm run dev
   # Runs on http://localhost:5000
   ```
2. **Frontend (React + Vite)**:
   ```bash
   cd fundnest-frontend
   npm run dev
   # Runs on http://localhost:5173
   ```
3. **Automated Logic Verification**:
   ```bash
   cd fundnest-backend
   node test_platform_e2e.js
   # Validates Risk Engine, 1536-dim Vector Math, and OpenAI Fallbacks
   ```

---

## 🔑 1. Authentication Endpoints

### 1.1 Register User (Investor or Founder)
- **POST** `/api/users/register`
```json
{
  "name": "Alex Mercer",
  "email": "investor@fundnest.com",
  "password": "Password123!",
  "role": "investor"
}
```
- **Success Response (201)**:
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "user": {
    "id": "664fa1...",
    "name": "Alex Mercer",
    "email": "investor@fundnest.com",
    "role": "investor"
  }
}
```

### 1.2 Login User
- **POST** `/api/users/login`
```json
{
  "email": "investor@fundnest.com",
  "password": "Password123!"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "664fa1...",
    "name": "Alex Mercer",
    "role": "investor"
  }
}
```
*(Store `accessToken` and pass as header: `Authorization: Bearer <token>` in subsequent calls)*.

---

## 🧠 2. GenAI Pitch Analysis & Hybrid Risk Scoring

### 2.1 Structured SWOT Analysis (OpenAI JSON Mode)
- **POST** `/api/ai/swot-analysis`
- **Headers**: `Authorization: Bearer <token>`
```json
{
  "startupId": "<STARTUP_ID>",
  "pitchText": "We have 3 enterprise LOIs and 40% month-over-month ARR growth in biometric neurotech."
}
```
- **Response (200)**:
```json
{
  "success": true,
  "swot": {
    "strengths": [
      "Positioned in expanding Healthcare sector",
      "Demonstrated commercial traction with $450,000 annual revenue",
      "Clear Series A milestone roadmaps"
    ],
    "weaknesses": [
      "Capital intensive clinical trial timelines",
      "High dependency on specialized biomedical R&D hires"
    ],
    "opportunities": [
      "Fast-track FDA breakthrough device designation",
      "Partnership pipelines with university neurology clinics"
    ],
    "threats": [
      "Incumbent medical device conglomerates",
      "Regulatory policy revisions for biometric data storage"
    ],
    "analysis": "NeuroFlow Health showcases defensible IP in neurotech diagnostics. Strategic capital injection will de-risk regulatory hurdles."
  },
  "reportId": "..."
}
```

### 2.2 Hybrid Risk Scoring (Deterministic Formula + OpenAI Qualitative Narrative)
- **POST** `/api/ai/risk-score`
- **Headers**: `Authorization: Bearer <token>`
```json
{
  "startupId": "<STARTUP_ID>"
}
```
- **Response (200)**:
```json
{
  "success": true,
  "risk": {
    "overall_risk_score": 48.5,
    "risk_category": "Medium",
    "confidence_score": 0.94,
    "metrics_breakdown": {
      "stageRisk": { "score": 40, "weight": "25%", "factor": "Series A", "description": "Demonstrated product-market fit" },
      "tractionRisk": { "score": 45, "weight": "30%", "factor": "50% Target Raised", "description": "Steady funding momentum" },
      "teamRisk": { "score": 20, "weight": "25%", "factor": "Established Organization (12)", "description": "Balanced cross-functional team" },
      "financialRisk": { "score": 30, "weight": "20%", "factor": "Commercialized ($450k+)", "description": "Active revenue stream established" }
    },
    "risk_narrative": "NeuroFlow Health achieves a balanced 48.5/100 risk profile (Medium). While early-stage clinical risks exist, its $450,000 commercial ARR and 12-person specialized team provide substantial downside protection. Deploying capital via milestone escrow tranches guarantees deliverable accountability.",
    "risk_factors": [
      { "factor": "Clinical Validation", "impact": "High", "description": "Requires completion of 100-patient pilot cohort." }
    ],
    "mitigation_strategies": [
      "Condition tranche disbursement on FDA clearance filing",
      "Maintain board observer seat for quarterly clinical updates"
    ]
  },
  "reportId": "..."
}
```

### 2.3 Founder Automated Pitch Feedback
- **POST** `/api/ai/analyze-pitch`
- **Headers**: `Authorization: Bearer <token>`
```json
{
  "startupId": "<STARTUP_ID>",
  "pitchText": "We are raising $2.5M to scale our sales team and expand across 5 hospitals."
}
```

---

## 🎯 3. Semantic Investor–Startup Matching (OpenAI Embeddings)

### 3.1 Get Ranked Matches for Investor
- **GET** `/api/matches/:investorId` or `/api/startups/matches`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200)**:
```json
{
  "success": true,
  "count": 3,
  "embeddingModel": "text-embedding-3-small (1536-dim)",
  "matches": [
    {
      "startup": {
        "_id": "...",
        "name": "FinPulse Core",
        "sector": "FinTech",
        "stage": "Seed",
        "targetAmount": 1200000,
        "raisedAmount": 720000
      },
      "similarityScore": 0.8942,
      "matchPercentage": 89,
      "matchReasons": [
        "Direct sector match in FinTech",
        "Stage alignment for Seed",
        "Commercial traction validated ($120,000 revenue)"
      ]
    }
  ]
}
```

---

## 🛡️ 4. Milestone-Based Investment & Escrow Workflow

### 4.1 Create Investment (Pending)
- **POST** `/api/transactions`
- **Headers**: `Authorization: Bearer <token>` (Investor role)
```json
{
  "startupId": "<STARTUP_ID>",
  "amount": 5000,
  "paymentMethod": "Bank Transfer",
  "notes": "Tranche 1 seed contribution"
}
```

### 4.2 Complete Payment (Atomic MongoDB Transaction -> InEscrow)
- **PUT** `/api/transactions/<TRANSACTION_ID>/complete`
- **Headers**: `Authorization: Bearer <token>`
```json
{
  "paymentId": "ch_simulated_948271"
}
```
- **State Transition**: `Pending` → `InEscrow`. Funds are held in `startup.escrowBalance`.

### 4.3 Founder Submits Milestone Completion Deliverable
- **POST** `/api/startups/<STARTUP_ID>/milestones/<MILESTONE_ID>/submit`
- **Headers**: `Authorization: Bearer <token>` (Founder role)
```json
{
  "deliverableDescription": "Completed 100-patient pilot cohort with 94.2% diagnostic accuracy across 3 clinical sites.",
  "proofUrl": "https://storage.fundnest.com/proofs/pilot_cohort_report_2026.pdf",
  "submissionNotes": "Data verified by lead clinical investigator."
}
```
- **State Transition**: Milestone status: `Pending` → `Submitted`.

### 4.4 Admin Verifies Milestone & Releases Escrow Funds
- **PUT** `/api/startups/<STARTUP_ID>/milestones/<MILESTONE_ID>/verify`
- **Headers**: `Authorization: Bearer <token>` (Admin role)
```json
{
  "verificationNotes": "Independent audit confirmed clinical report authenticity and compliance."
}
```
- **State Transition**: Milestone: `Submitted` → `Verified`.
- **Fund Release**: Proportional funds atomically move from `startup.escrowBalance` to `startup.releasedFunds`. Active transactions ledger updated to `Released`.

### 4.5 Inspect Escrow Ledger
- **GET** `/api/transactions/escrow-ledger/<STARTUP_ID>`
- **Headers**: `Authorization: Bearer <token>`
- **Returns**: Transparent breakdown of total raised, held in escrow, released funds, and transaction release history.

---

## 💬 5. Context-Aware AI Assistant (RAG)

### 5.1 Query Platform Intelligence
- **POST** `/api/ai/chat`
- **Headers**: `Authorization: Bearer <token>`
```json
{
  "query": "Which startups in FinTech have the lowest risk and active milestone progress?"
}
```
- **Response (200)**:
```json
{
  "success": true,
  "response": {
    "answer": "Based on verified FundNest platform records, **FinPulse Core** is an approved FinTech startup at the Seed stage that demonstrates strong execution. They have raised $720,000 (60% of their $1,200,000 target) with an active annual revenue of $120,000. Their current milestones include SWIFT & FedNow API connectivity and SOC 2 Type II certification, with funds secured in milestone-contingent escrow.",
    "sources": [
      "FinPulse Core (FinTech, Seed)",
      "NeuroFlow Health (Healthcare, Series A)"
    ],
    "confidence": 0.94,
    "follow_up_questions": [
      "Which startups have reached over 50% of their funding goal?",
      "What are the risk factors for early-stage seed startups?",
      "How does FundNest milestone escrow protect my capital?"
    ]
  }
}
```

---

## 🎓 6. Viva Defense FAQs & Model Answers

### Q1: "Where does the risk score number come from? Is it hallucinated by the LLM?"
> **Answer**: *"No. The numerical risk score is computed deterministically in `utils/riskEngine.js` using a weighted formula across four empirical startup metrics: Stage Risk (25%), Traction & Funding Progress (30%), Team Execution Capacity (25%), and Revenue Sustainability (20%). The OpenAI LLM (`gpt-4o-mini`) is only used for the qualitative narrative half—it receives the exact computed breakdown and writes an investor-grade memorandum explaining why that specific score was reached. This hybrid architecture prevents LLM hallucinations and gives evaluators full mathematical transparency."*

### Q2: "How does semantic investor-startup matching work?"
> **Answer**: *"Rather than relying on basic keyword searches, we use OpenAI's `text-embedding-3-small` model to project startup pitch narratives, traction metrics, and tags into a 1536-dimensional vector space. Similarly, investor preferences (sectors, stages, risk appetite) are embedded into preference vectors. We perform write-time caching on MongoDB documents so embeddings are generated only when profiles are created or modified. At query time, our `utils/vectorMath.js` engine computes cosine similarity $\frac{A \cdot B}{\|A\| \|B\|}$ in memory, instantly returning ranked matches with similarity percentages (e.g. 89% match)."*

### Q3: "Why did you implement milestone escrow?"
> **Answer**: *"In early-stage venture funding, a major investor risk is the misuse of funds after lump-sum disbursement. We designed a state machine (`Pending` → `InEscrow` → `MilestoneSubmitted` → `Verified` → `Released`) where investment capital is locked in an escrow account. The founder must submit verifiable deliverable proofs (e.g., pilot trial completion, regulatory filing) before the platform administrator authorizes proportional fund releases."*

### Q4: "Why call OpenAI from Node.js rather than through the Python service?"
> **Answer**: *"We adopted an API Gateway architecture. Node.js natively handles client sessions, MongoDB Mongoose transactions, and real-time Socket.IO events. Calling OpenAI directly from Node via the official SDK eliminates inter-service HTTP serialization bottlenecks and latency. Furthermore, our context-aware RAG assistant requires pulling user-scoped database records (investor portfolios and founder milestones) immediately before prompting OpenAI; performing this within Node ensures zero data duplication and strict role-based access control."*
