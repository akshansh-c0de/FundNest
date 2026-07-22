from typing import List, Dict, Any
import re

class AnalysisService:
    @staticmethod
    def analyze_pitch(startup_data: dict, pitch_text: str = None) -> dict:
        """Analyze startup pitch and provide feedback"""
        description = startup_data.get('description', '')
        combined_text = f"{description} {pitch_text or ''}"
        
        # Calculate clarity based on description length and structure
        clarity_score = min(10, len(description) / 50)
        
        # Calculate persuasiveness based on key elements
        key_elements = ['revenue', 'growth', 'market', 'solution', 'problem']
        persuasiveness_score = sum(1 for elem in key_elements if elem.lower() in combined_text.lower())
        persuasiveness_score = min(10, persuasiveness_score * 2)
        
        # Overall score
        overall_score = (clarity_score + persuasiveness_score) / 2
        
        # Generate strengths and weaknesses
        strengths = []
        weaknesses = []
        
        if startup_data.get('target_amount', 0) > 0:
            strengths.append("Clear funding target specified")
        else:
            weaknesses.append("Funding target not clearly defined")
        
        if startup_data.get('sector'):
            strengths.append(f"Well-defined sector: {startup_data['sector']}")
        
        if len(description) < 100:
            weaknesses.append("Description could be more detailed")
        
        if startup_data.get('team_size', 0) > 1:
            strengths.append("Team size indicates organizational structure")
        
        recommendations = [
            "Include specific metrics and traction data",
            "Highlight unique value proposition",
            "Provide competitive analysis",
            "Include go-to-market strategy"
        ]
        
        return {
            "summary": description[:200] + "..." if len(description) > 200 else description,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "clarity_score": round(clarity_score, 1),
            "persuasiveness_score": round(persuasiveness_score, 1),
            "overall_score": round(overall_score, 1),
            "recommendations": recommendations
        }
    
    @staticmethod
    def generate_summary(startup_data: dict) -> dict:
        """Generate executive summary for a startup"""
        name = startup_data.get('name', 'Unknown Startup')
        sector = startup_data.get('sector', 'Technology')
        stage = startup_data.get('stage', 'Early Stage')
        description = startup_data.get('description', '')
        target_amount = startup_data.get('target_amount', 0)
        raised_amount = startup_data.get('raised_amount', 0)
        
        progress = (raised_amount / target_amount * 100) if target_amount > 0 else 0
        
        executive_summary = f"{name} is a {stage.lower()} company in the {sector} sector. "
        executive_summary += f"They are seeking ${target_amount:,.0f} in funding and have raised ${raised_amount:,.0f} so far ({progress:.1f}%). "
        executive_summary += description
        
        key_highlights = [
            f"Sector: {sector}",
            f"Stage: {stage}",
            f"Funding Target: ${target_amount:,.0f}",
            f"Progress: {progress:.1f}%"
        ]
        
        if startup_data.get('team_size'):
            key_highlights.append(f"Team Size: {startup_data['team_size']}")
        
        market_opportunity = f"The {sector} sector presents significant opportunities for innovation and growth. "
        market_opportunity += f"{name} aims to capitalize on this through their unique approach."
        
        business_overview = f"{name} operates in the {sector} space at the {stage} stage. "
        business_overview += f"With a target of ${target_amount:,.0f}, the company is positioned to scale operations "
        business_overview += f"and expand market reach."
        
        return {
            "executive_summary": executive_summary,
            "key_highlights": key_highlights,
            "market_opportunity": market_opportunity,
            "business_overview": business_overview
        }
    
    @staticmethod
    def swot_analysis(startup_data: dict, pitch_text: str = None) -> dict:
        """Perform SWOT analysis"""
        description = startup_data.get('description', '').lower()
        sector = startup_data.get('sector', '')
        stage = startup_data.get('stage', '')
        
        strengths = []
        weaknesses = []
        opportunities = []
        threats = []
        
        # Analyze based on sector and stage
        if stage in ['Seed', 'Pre-Seed']:
            strengths.append("Early-stage advantage with room for growth")
            weaknesses.append("Limited track record and traction")
            opportunities.append("First-mover advantage in market")
            threats.append("High competition from established players")
        
        if stage in ['Series A', 'Series B']:
            strengths.append("Proven business model with traction")
            opportunities.append("Scaling opportunities in growing market")
            threats.append("Increased pressure to maintain growth rates")
        
        # Sector-specific analysis
        if 'ai' in sector.lower() or 'ml' in sector.lower():
            strengths.append("High-growth sector with increasing demand")
            opportunities.append("Multiple application domains")
            threats.append("Rapid technological changes")
        
        if 'fintech' in sector.lower():
            strengths.append("Disruptive potential in financial services")
            opportunities.append("Digital transformation trends")
            threats.append("Regulatory challenges")
        
        # Description-based analysis
        if 'revenue' in description:
            strengths.append("Revenue generation capability")
        
        if 'growth' in description:
            strengths.append("Growth-oriented strategy")
        
        if len(description) < 100:
            weaknesses.append("Limited business information available")
        
        analysis = f"{startup_data.get('name', 'The startup')} operates in the {sector} sector at the {stage} stage. "
        analysis += f"The company shows {len(strengths)} key strengths and faces {len(threats)} potential threats. "
        analysis += "Strategic focus should leverage capitalizing on opportunities while addressing identified weaknesses."
        
        return {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "opportunities": opportunities,
            "threats": threats,
            "analysis": analysis
        }
    
    @staticmethod
    def calculate_risk_score(startup_data: dict, financial_data: dict = None) -> dict:
        """Calculate risk score for investment"""
        risk_score = 50  # Base score
        risk_factors = []
        mitigation_strategies = []
        
        stage = startup_data.get('stage', '')
        target_amount = startup_data.get('target_amount', 0)
        raised_amount = startup_data.get('raised_amount', 0)
        team_size = startup_data.get('team_size', 0)
        
        # Stage-based risk
        if stage in ['Pre-Seed', 'Seed']:
            risk_score += 20
            risk_factors.append({"factor": "Early Stage", "impact": "High", "description": "Early-stage companies have higher failure rates"})
            mitigation_strategies.append("Diversify investment across multiple early-stage deals")
        
        if stage in ['Series A', 'Series B']:
            risk_score -= 10
            risk_factors.append({"factor": "Growth Stage", "impact": "Medium", "description": "Company has proven some traction"})
        
        # Funding progress
        if target_amount > 0:
            progress = (raised_amount / target_amount) * 100
            if progress > 50:
                risk_score -= 15
                mitigation_strategies.append("Strong funding progress indicates market validation")
            elif progress < 20:
                risk_score += 10
                risk_factors.append({"factor": "Low Funding Progress", "impact": "Medium", "description": "Limited investor interest so far"})
        
        # Team size
        if team_size < 3:
            risk_score += 10
            risk_factors.append({"factor": "Small Team", "impact": "Medium", "description": "Limited team resources may impact execution"})
        else:
            risk_score -= 5
        
        # Financial data analysis
        if financial_data:
            revenue = financial_data.get('annual_revenue', 0)
            if revenue > 0:
                risk_score -= 10
                mitigation_strategies.append("Revenue generation reduces investment risk")
        
        # Normalize score
        risk_score = max(0, min(100, risk_score))
        
        # Determine category
        if risk_score < 25:
            category = "Low"
        elif risk_score < 50:
            category = "Medium"
        elif risk_score < 75:
            category = "High"
        else:
            category = "Very High"
        
        return {
            "overall_risk_score": round(risk_score, 1),
            "risk_category": category,
            "risk_factors": risk_factors,
            "mitigation_strategies": mitigation_strategies,
            "confidence_score": 0.85
        }
    
    @staticmethod
    def assess_funding_readiness(startup_data: dict) -> dict:
        """Assess startup's readiness for funding"""
        readiness_score = 0
        gaps = []
        strengths = []
        recommendations = []
        
        # Check key elements
        if startup_data.get('description'):
            readiness_score += 20
            strengths.append("Clear business description provided")
        else:
            gaps.append("Missing detailed business description")
            recommendations.append("Develop comprehensive business description")
        
        if startup_data.get('target_amount', 0) > 0:
            readiness_score += 15
            strengths.append("Funding target clearly defined")
        else:
            gaps.append("Funding target not specified")
            recommendations.append("Define clear funding requirements")
        
        if startup_data.get('team_size', 0) >= 2:
            readiness_score += 15
            strengths.append("Adequate team size")
        else:
            gaps.append("Team size may be insufficient")
            recommendations.append("Build out core team")
        
        if startup_data.get('sector'):
            readiness_score += 10
            strengths.append("Sector clearly identified")
        
        if startup_data.get('stage'):
            readiness_score += 10
            strengths.append("Funding stage defined")
        
        if startup_data.get('raised_amount', 0) > 0:
            readiness_score += 10
            strengths.append("Previous funding secured")
        
        if startup_data.get('tags'):
            readiness_score += 10
            strengths.append("Relevant tags provided for discovery")
        
        if startup_data.get('location'):
            readiness_score += 10
            strengths.append("Location specified")
        
        # Determine readiness level
        if readiness_score >= 80:
            level = "High"
            timeline = "Ready for immediate funding"
        elif readiness_score >= 60:
            level = "Medium"
            timeline = "Ready in 1-2 months with improvements"
        elif readiness_score >= 40:
            level = "Low"
            timeline = "3-6 months to reach readiness"
        else:
            level = "Very Low"
            timeline = "6+ months needed"
        
        return {
            "readiness_score": readiness_score,
            "readiness_level": level,
            "gaps": gaps,
            "strengths": strengths,
            "recommendations": recommendations,
            "estimated_timeline": timeline
        }
    
    @staticmethod
    def analyze_business_model(startup_data: dict, business_plan: str = None) -> dict:
        """Analyze business model"""
        sector = startup_data.get('sector', '')
        description = startup_data.get('description', '').lower()
        
        # Determine business model type based on sector
        if 'saas' in sector.lower() or 'software' in sector.lower():
            model_type = "SaaS (Software as a Service)"
            revenue_streams = ["Subscription fees", "Tiered pricing", "Enterprise licenses"]
            cost_structure = ["R&D", "Server infrastructure", "Customer support", "Sales & marketing"]
        elif 'marketplace' in sector.lower():
            model_type = "Marketplace / Platform"
            revenue_streams = ["Transaction fees", "Premium listings", "Advertising"]
            cost_structure = ["Platform development", "User acquisition", "Payment processing"]
        elif 'ecommerce' in sector.lower():
            model_type = "E-commerce"
            revenue_streams = ["Product sales", "Marketplace fees", "Subscription"]
            cost_structure = ["Inventory", "Logistics", "Marketing", "Platform"]
        else:
            model_type = "Traditional Business Model"
            revenue_streams = ["Product sales", "Service fees", "Licensing"]
            cost_structure = ["Operations", "Marketing", "R&D", "Administration"]
        
        value_proposition = f"{startup_data.get('name', 'The company')} provides innovative solutions in the {sector} sector, "
        value_proposition += "addressing key market needs through differentiated offerings."
        
        competitive_advantage = "Key advantages include market positioning, innovative approach, and growth potential in the sector."
        
        scalability_assessment = f"The business model shows {'high' if 'saaS' in model_type or 'platform' in model_type else 'moderate'} scalability potential "
        scalability_assessment += "given the sector and operational structure."
        
        sustainability_score = 7.5
        
        return {
            "business_model_type": model_type,
            "revenue_streams": revenue_streams,
            "cost_structure": cost_structure,
            "value_proposition": value_proposition,
            "competitive_advantage": competitive_advantage,
            "scalability_assessment": scalability_assessment,
            "sustainability_score": sustainability_score
        }
