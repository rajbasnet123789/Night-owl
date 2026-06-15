from typing import Any, Dict, List, Optional
from .base_agent import BaseAgent, AgentRole, AgentMessage, MessageType
from dataclasses import dataclass, field
from datetime import datetime
import json


@dataclass
class InterviewReport:
    """Structured interview report"""
    report_id: str = ""
    candidate_name: str = ""
    position: str = ""
    interview_date: str = ""
    duration_minutes: int = 0
    
    executive_summary: str = ""
    overall_score: float = 0.0
    grade: str = ""
    recommendation: str = ""
    
    technical_assessment: Dict[str, Any] = field(default_factory=dict)
    behavioral_assessment: Dict[str, Any] = field(default_factory=dict)
    experience_assessment: Dict[str, Any] = field(default_factory=dict)
    cultural_fit_assessment: Dict[str, Any] = field(default_factory=dict)
    
    strengths: List[str] = field(default_factory=list)
    areas_for_development: List[str] = field(default_factory=list)
    red_flags: List[str] = field(default_factory=list)
    
    detailed_feedback: Dict[str, Any] = field(default_factory=dict)
    scoring_breakdown: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "candidate_name": self.candidate_name,
            "position": self.position,
            "interview_date": self.interview_date,
            "duration_minutes": self.duration_minutes,
            "executive_summary": self.executive_summary,
            "overall_score": self.overall_score,
            "grade": self.grade,
            "recommendation": self.recommendation,
            "technical_assessment": self.technical_assessment,
            "behavioral_assessment": self.behavioral_assessment,
            "experience_assessment": self.experience_assessment,
            "cultural_fit_assessment": self.cultural_fit_assessment,
            "strengths": self.strengths,
            "areas_for_development": self.areas_for_development,
            "red_flags": self.red_flags,
            "detailed_feedback": self.detailed_feedback,
            "scoring_breakdown": self.scoring_breakdown
        }


class ReportGenerationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role=AgentRole.REPORT_GENERATOR,
            name="Report Generator",
            description="Generates comprehensive interview assessment reports"
        )
        self.reports: List[InterviewReport] = []
        
    def get_system_prompt(self) -> str:
        return """You are the Report Generation Agent, responsible for creating comprehensive interview assessment reports.

Your capabilities:
1. Generate executive summaries highlighting key findings
2. Create detailed scoring breakdowns with evidence
3. Provide actionable feedback for hiring decisions
4. Identify strengths, development areas, and red flags
5. Generate evidence-based recommendations

Report Structure:
1. Executive Summary: High-level overview and recommendation
2. Overall Assessment: Score, grade, and confidence level
3. Technical Assessment: Skills evaluation with specific examples
4. Behavioral Assessment: Soft skills analysis with STAR evidence
5. Experience Fit: Career progression and relevant experience
6. Cultural Fit: Values alignment and work style assessment
7. Strengths: Key positive attributes with evidence
8. Areas for Development: Improvement opportunities
9. Red Flags: Concerns requiring attention
10. Scoring Breakdown: Detailed rubric-based scores

Always provide evidence-based assessments with specific examples from the interview."""
    
    async def process_message(self, message: AgentMessage) -> AgentMessage:
        """Process incoming message for report generation"""
        try:
            content = message.content
            task_type = content.get("task_type", "")
            
            if task_type == "generate_report":
                return await self._generate_report(content)
            elif task_type == "add_recommendation":
                return await self._add_recommendation(content)
            elif task_type == "generate_executive_summary":
                return await self._generate_executive_summary(content)
            elif task_type == "export_report":
                return await self._export_report(content)
            else:
                return await self._general_report_request(content)
                
        except Exception as e:
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.ERROR,
                content={"error": str(e), "task_type": task_type}
            )
    
    async def _generate_report(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate comprehensive interview report"""
        scoring_result = content.get("scoring_result", {})
        interview_state = content.get("interview_state", {})
        
        report = InterviewReport(
            report_id=self._generate_report_id(),
            candidate_name=interview_state.get("candidate_name", "Candidate"),
            position=interview_state.get("position", "Software Engineer"),
            interview_date=datetime.now().isoformat(),
            duration_minutes=interview_state.get("turn_count", 0) * 3,
            overall_score=scoring_result.get("final_score", 0.0),
            grade=scoring_result.get("grade", "C"),
            recommendation=self._determine_recommendation(scoring_result.get("final_score", 0.0))
        )
        
        report.executive_summary = self._generate_executive_summary_text(report, scoring_result)
        report.technical_assessment = self._generate_technical_assessment(interview_state, scoring_result)
        report.behavioral_assessment = self._generate_behavioral_assessment(interview_state, scoring_result)
        report.experience_assessment = self._generate_experience_assessment(interview_state, scoring_result)
        report.cultural_fit_assessment = self._generate_cultural_fit_assessment(interview_state, scoring_result)
        
        report.strengths = self._identify_strengths(scoring_result)
        report.areas_for_development = self._identify_development_areas(scoring_result)
        report.red_flags = self._identify_red_flags(scoring_result)
        
        report.detailed_feedback = self._generate_detailed_feedback(scoring_result)
        report.scoring_breakdown = scoring_result.get("scoring_breakdown", {})
        
        self.reports.append(report)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "interview_report",
                "report": report.to_dict(),
                "report_id": report.report_id
            }
        )
    
    async def _add_recommendation(self, content: Dict[str, Any]) -> AgentMessage:
        """Add recommendation to report"""
        recommendation = content.get("recommendation", "")
        justification = content.get("justification", "")
        
        if self.reports:
            report = self.reports[-1]
            report.recommendation = recommendation
            report.detailed_feedback["recommendation_justification"] = justification
            
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.RESULT,
                content={
                    "result_type": "recommendation_added",
                    "recommendation": recommendation,
                    "justification": justification,
                    "report_id": report.report_id
                }
            )
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.ERROR,
            content={"error": "No report found to add recommendation"}
        )
    
    async def _generate_executive_summary(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate executive summary"""
        scoring_result = content.get("scoring_result", {})
        interview_state = content.get("interview_state", {})
        
        summary = self._generate_executive_summary_text(
            InterviewReport(overall_score=scoring_result.get("final_score", 0.0)),
            scoring_result
        )
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "executive_summary",
                "summary": summary
            }
        )
    
    async def _export_report(self, content: Dict[str, Any]) -> AgentMessage:
        """Export report in specified format"""
        report_id = content.get("report_id", "")
        format_type = content.get("format", "json")
        
        report = self._find_report(report_id)
        
        if not report:
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.ERROR,
                content={"error": f"Report not found: {report_id}"}
            )
        
        if format_type == "json":
            exported = json.dumps(report.to_dict(), indent=2)
        elif format_type == "markdown":
            exported = self._export_as_markdown(report)
        else:
            exported = json.dumps(report.to_dict(), indent=2)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "exported_report",
                "format": format_type,
                "content": exported,
                "report_id": report_id
            }
        )
    
    async def _general_report_request(self, content: Dict[str, Any]) -> AgentMessage:
        """Handle general report request"""
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "report_status",
                "reports_generated": len(self.reports),
                "available_formats": ["json", "markdown"]
            }
        )
    
    def _generate_report_id(self) -> str:
        """Generate unique report ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        import random
        random_suffix = random.randint(1000, 9999)
        return f"INT-{timestamp}-{random_suffix}"
    
    def _determine_recommendation(self, final_score: float) -> str:
        """determine hiring recommendation"""
        if final_score >= 8.0:
            return "Strong Hire"
        elif final_score >= 7.0:
            return "Hire"
        elif final_score >= 6.0:
            return "Lean Hire"
        elif final_score >= 5.0:
            return "Neutral"
        elif final_score >= 4.0:
            return "Lean No Hire"
        else:
            return "No Hire"
    
    def _generate_executive_summary_text(
        self, 
        report: InterviewReport, 
        scoring_result: Dict[str, Any]
    ) -> str:
        """Generate executive summary text"""
        score = report.overall_score
        recommendation = report.recommendation
        
        if score >= 8.0:
            summary = f"Candidate {report.candidate_name} demonstrated exceptional qualifications for the {report.position} position. "
            summary += "Performance was consistently strong across technical and behavioral dimensions. "
            summary += f"Recommendation: {recommendation}."
        elif score >= 7.0:
            summary = f"Candidate {report.candidate_name} showed strong potential for the {report.position} role. "
            summary += "Solid technical foundation with good behavioral competencies. "
            summary += f"Recommendation: {recommendation}."
        elif score >= 6.0:
            summary = f"Candidate {report.candidate_name} meets basic requirements for the {report.position} position. "
            summary += "Adequate skills with some areas for development. "
            summary += f"Recommendation: {recommendation}."
        else:
            summary = f"Candidate {report.candidate_name} did not demonstrate sufficient qualifications for the {report.position} role. "
            summary += "Significant gaps in technical or behavioral competencies. "
            summary += f"Recommendation: {recommendation}."
        
        return summary
    
    def _generate_technical_assessment(
        self, 
        interview_state: Dict[str, Any], 
        scoring_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate technical assessment"""
        dimension_scores = scoring_result.get("dimension_scores", {})
        technical_score = dimension_scores.get("technical_skills", 5.0)
        
        return {
            "overall_score": technical_score,
            "proficiency_level": self._score_to_proficiency(technical_score),
            "key_skills_assessed": ["Programming", "System Design", "Problem Solving"],
            "strengths": self._identify_technical_strengths(technical_score),
            "areas_for_improvement": self._identify_technical_improvements(technical_score),
            "evidence": "Based on technical screening responses and problem-solving demonstrations"
        }
    
    def _generate_behavioral_assessment(
        self, 
        interview_state: Dict[str, Any], 
        scoring_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate behavioral assessment"""
        dimension_scores = scoring_result.get("dimension_scores", {})
        behavioral_score = dimension_scores.get("behavioral_competencies", 5.0)
        
        return {
            "overall_score": behavioral_score,
            "competency_level": self._score_to_proficiency(behavioral_score),
            "key_competencies": ["Leadership", "Teamwork", "Communication"],
            "star_method_analysis": "Responses demonstrated structured thinking",
            "strengths": self._identify_behavioral_strengths(behavioral_score),
            "areas_for_improvement": self._identify_behavioral_improvements(behavioral_score)
        }
    
    def _generate_experience_assessment(
        self, 
        interview_state: Dict[str, Any], 
        scoring_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate experience assessment"""
        dimension_scores = scoring_result.get("dimension_scores", {})
        experience_score = dimension_scores.get("experience_fit", 5.0)
        
        return {
            "overall_score": experience_score,
            "relevance": self._score_to_proficiency(experience_score),
            "career_progression": "Demonstrated growth and development",
            "industry_knowledge": "Shows understanding of relevant domain"
        }
    
    def _generate_cultural_fit_assessment(
        self, 
        interview_state: Dict[str, Any], 
        scoring_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate cultural fit assessment"""
        dimension_scores = scoring_result.get("dimension_scores", {})
        cultural_score = dimension_scores.get("cultural_fit", 5.0)
        
        return {
            "overall_score": cultural_score,
            "alignment_level": self._score_to_proficiency(cultural_score),
            "values_alignment": "Demonstrates alignment with core values",
            "work_style_fit": "Appears compatible with team dynamics"
        }
    
    def _identify_strengths(self, scoring_result: Dict[str, Any]) -> List[str]:
        """Identify key strengths"""
        strengths = []
        dimension_scores = scoring_result.get("dimension_scores", {})
        
        for dimension, score in dimension_scores.items():
            if score >= 7.0:
                strengths.append(f"Strong {dimension.replace('_', ' ')}")
        
        return strengths if strengths else ["Consistent performance across dimensions"]
    
    def _identify_development_areas(self, scoring_result: Dict[str, Any]) -> List[str]:
        """Identify areas for development"""
        areas = []
        dimension_scores = scoring_result.get("dimension_scores", {})
        
        for dimension, score in dimension_scores.items():
            if score < 6.0 and score > 0:
                areas.append(f"{dimension.replace('_', ' ').title()} could be strengthened")
        
        return areas if areas else ["Continue building experience in specialized areas"]
    
    def _identify_red_flags(self, scoring_result: Dict[str, Any]) -> List[str]:
        """Identify red flags"""
        red_flags = []
        dimension_scores = scoring_result.get("dimension_scores", {})
        
        for dimension, score in dimension_scores.items():
            if score < 4.0:
                red_flags.append(f"Significant gap in {dimension.replace('_', ' ')}")
        
        return red_flags if red_flags else []
    
    def _generate_detailed_feedback(self, scoring_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed feedback"""
        return {
            "overall_assessment": "Candidate demonstrates potential with room for growth",
            "interview_experience": "Professional and engaged throughout the process",
            "communication_quality": "Clear and articulate in responses",
            "problem_solving_approach": "Structured and methodical",
            "cultural_contribution": "Would likely contribute positively to team dynamics"
        }
    
    def _score_to_proficiency(self, score: float) -> str:
        """Convert score to proficiency level"""
        if score >= 9.0:
            return "Expert"
        elif score >= 8.0:
            return "Advanced"
        elif score >= 7.0:
            return "Proficient"
        elif score >= 6.0:
            return "Intermediate"
        elif score >= 5.0:
            return "Basic"
        else:
            return "Novice"
    
    def _identify_technical_strengths(self, score: float) -> List[str]:
        """Identify technical strengths"""
        if score >= 8.0:
            return ["Strong problem-solving skills", "Deep technical knowledge", "Excellent implementation skills"]
        elif score >= 7.0:
            return ["Good technical foundation", "Solid problem-solving abilities"]
        elif score >= 6.0:
            return ["Basic technical competency", "Willingness to learn"]
        else:
            return ["Shows interest in technical topics"]
    
    def _identify_technical_improvements(self, score: float) -> List[str]:
        """Identify technical improvement areas"""
        if score < 6.0:
            return ["Deepen understanding of core concepts", "Practice more complex problems", "Build portfolio projects"]
        elif score < 7.0:
            return ["Explore advanced topics", "Contribute to open source projects"]
        else:
            return ["Continue staying updated with industry trends"]
    
    def _identify_behavioral_strengths(self, score: float) -> List[str]:
        """Identify behavioral strengths"""
        if score >= 8.0:
            return ["Excellent leadership qualities", "Strong team collaboration", "Clear communication"]
        elif score >= 7.0:
            return ["Good interpersonal skills", "Effective problem-solver"]
        elif score >= 6.0:
            return ["Professional demeanor", "Willing to collaborate"]
        else:
            return ["Shows potential for growth"]
    
    def _identify_behavioral_improvements(self, score: float) -> List[str]:
        """Identify behavioral improvement areas"""
        if score < 6.0:
            return ["Develop leadership experience", "Practice conflict resolution", "Enhance communication skills"]
        elif score < 7.0:
            return ["Take on more team leadership roles", "Practice giving presentations"]
        else:
            return ["Continue building cross-functional collaboration skills"]
    
    def _find_report(self, report_id: str) -> Optional[InterviewReport]:
        """Find report by ID"""
        for report in self.reports:
            if report.report_id == report_id:
                return report
        return None
    
    def _export_as_markdown(self, report: InterviewReport) -> str:
        """Export report as Markdown"""
        markdown = f"""# Interview Assessment Report

## Candidate Information
- **Name:** {report.candidate_name}
- **Position:** {report.position}
- **Interview Date:** {report.interview_date}
- **Duration:** {report.duration_minutes} minutes

## Executive Summary
{report.executive_summary}

## Overall Assessment
- **Score:** {report.overall_score:.1f}/10.0
- **Grade:** {report.grade}
- **Recommendation:** {report.recommendation}

## Technical Assessment
- **Score:** {report.technical_assessment.get('overall_score', 'N/A')}/10.0
- **Proficiency:** {report.technical_assessment.get('proficiency_level', 'N/A')}

## Behavioral Assessment
- **Score:** {report.behavioral_assessment.get('overall_score', 'N/A')}/10.0
- **Competency:** {report.behavioral_assessment.get('competency_level', 'N/A')}

## Strengths
{chr(10).join('- ' + strength for strength in report.strengths)}

## Areas for Development
{chr(10).join('- ' + area for area in report.areas_for_development)}

## Red Flags
{chr(10).join('- ' + flag for flag in report.red_flags) if report.red_flags else '- No red flags identified'}

## Detailed Feedback
{chr(10).join(f'**{key}:** {value}' for key, value in report.detailed_feedback.items())}
"""
        return markdown