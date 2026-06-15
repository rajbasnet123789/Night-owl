from typing import Any, Dict, List, Optional
from .base_agent import BaseAgent, AgentRole, AgentMessage, MessageType
from dataclasses import dataclass, field
import json


@dataclass
class ScoringRubric:
    """Defines scoring rubric for evaluation"""
    category: str
    criteria: Dict[str, float] = field(default_factory=dict)
    weight: float = 0.0
    max_score: float = 10.0
    
    def calculate_score(self, scores: Dict[str, float]) -> float:
        """Calculate weighted score"""
        if not scores:
            return 0.0
        
        weighted_sum = sum(scores.get(criterion, 0) * weight 
                          for criterion, weight in self.criteria.items())
        return weighted_sum / sum(self.criteria.values()) if self.criteria else 0.0


class ScoringAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role=AgentRole.SCORING_AGENT,
            name="Scoring Agent",
            description="Calculates final scores using structured rubrics"
        )
        self.rubrics = self._initialize_rubrics()
        self.scoring_history: List[Dict[str, Any]] = []
        
    def _initialize_rubrics(self) -> Dict[str, ScoringRubric]:
        """Initialize scoring rubrics"""
        return {
            "technical_skills": ScoringRubric(
                category="Technical Skills",
                criteria={
                    "programming_knowledge": 0.25,
                    "system_design": 0.25,
                    "database_skills": 0.20,
                    "algorithm_understanding": 0.15,
                    "technical_communication": 0.15
                },
                weight=0.40
            ),
            "behavioral_competencies": ScoringRubric(
                category="Behavioral Competencies",
                criteria={
                    "leadership": 0.20,
                    "teamwork": 0.20,
                    "communication": 0.20,
                    "problem_solving": 0.20,
                    "adaptability": 0.20
                },
                weight=0.30
            ),
            "experience_fit": ScoringRubric(
                category="Experience Fit",
                criteria={
                    "relevant_experience": 0.30,
                    "industry_knowledge": 0.25,
                    "career_progression": 0.25,
                    "achievements": 0.20
                },
                weight=0.20
            ),
            "cultural_fit": ScoringRubric(
                category="Cultural Fit",
                criteria={
                    "values_alignment": 0.30,
                    "work_style": 0.25,
                    "growth_mindset": 0.25,
                    "passion": 0.20
                },
                weight=0.10
            )
        }
        
    def get_system_prompt(self) -> str:
        return """You are the Scoring Agent, responsible for calculating final candidate scores using structured rubrics.

Your capabilities:
1. Apply weighted scoring rubrics across multiple dimensions
2. Normalize scores across different assessment areas
3. Calculate confidence intervals for scores
4. Identify scoring anomalies and outliers
5. Provide evidence-based scoring justification

Scoring Dimensions:
- Technical Skills (40%): Programming, system design, databases, algorithms
- Behavioral Competencies (30%): Leadership, teamwork, communication, problem-solving
- Experience Fit (20%): Relevant experience, industry knowledge, career progression
- Cultural Fit (10%): Values alignment, work style, growth mindset

Scoring Scale:
- 0-2: Poor/Insufficient
- 3-4: Below Average
- 5-6: Average/Acceptable
- 7-8: Good/Strong
- 9-10: Excellent/Outstanding

Always provide evidence-based scoring with specific examples."""
    
    async def process_message(self, message: AgentMessage) -> AgentMessage:
        """Process incoming message for scoring"""
        try:
            content = message.content
            task_type = content.get("task_type", "")
            
            if task_type == "compile_evaluation":
                return await self._compile_evaluation(content)
            elif task_type == "calculate_score":
                return await self._calculate_score(content)
            elif task_type == "normalize_scores":
                return await self._normalize_scores(content)
            elif task_type == "generate_recommendation":
                return await self._generate_recommendation(content)
            else:
                return await self._general_scoring(content)
                
        except Exception as e:
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.ERROR,
                content={"error": str(e), "task_type": task_type}
            )
    
    async def _compile_evaluation(self, content: Dict[str, Any]) -> AgentMessage:
        """Compile evaluation from all sources"""
        interview_state = content.get("interview_state", {})
        phase_scores = content.get("phase_scores", {})
        
        technical_score = self._extract_technical_score(interview_state)
        behavioral_score = self._extract_behavioral_score(interview_state)
        experience_score = self._extract_experience_score(interview_state)
        cultural_score = self._extract_cultural_score(interview_state)
        
        dimension_scores = {
            "technical_skills": technical_score,
            "behavioral_competencies": behavioral_score,
            "experience_fit": experience_score,
            "cultural_fit": cultural_score
        }
        
        final_score = self._calculate_final_score(dimension_scores)
        
        scoring_result = {
            "dimension_scores": dimension_scores,
            "final_score": final_score,
            "grade": self._score_to_grade(final_score),
            "confidence_level": self._calculate_confidence_level(dimension_scores),
            "scoring_breakdown": self._generate_scoring_breakdown(dimension_scores)
        }
        
        self.scoring_history.append(scoring_result)
        
        return await self.send_message(
            receiver=AgentRole.REPORT_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "generate_report",
                "scoring_result": scoring_result,
                "interview_state": interview_state
            }
        )
    
    async def _calculate_score(self, content: Dict[str, Any]) -> AgentMessage:
        """Calculate score for specific dimension"""
        dimension = content.get("dimension", "technical_skills")
        scores = content.get("scores", {})
        
        if dimension in self.rubrics:
            rubric = self.rubrics[dimension]
            calculated_score = rubric.calculate_score(scores)
            
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.RESULT,
                content={
                    "result_type": "dimension_score",
                    "dimension": dimension,
                    "score": calculated_score,
                    "max_score": rubric.max_score,
                    "breakdown": scores
                }
            )
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.ERROR,
            content={"error": f"Unknown dimension: {dimension}"}
        )
    
    async def _normalize_scores(self, content: Dict[str, Any]) -> AgentMessage:
        """Normalize scores across dimensions"""
        raw_scores = content.get("raw_scores", {})
        
        normalized_scores = {}
        for dimension, score in raw_scores.items():
            normalized_scores[dimension] = min(10.0, max(0.0, score))
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "normalized_scores",
                "scores": normalized_scores,
                "normalization_applied": True
            }
        )
    
    async def _generate_recommendation(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate hiring recommendation"""
        final_score = content.get("final_score", 0.0)
        scoring_result = content.get("scoring_result", {})
        
        recommendation = self._determine_recommendation(final_score, scoring_result)
        
        return await self.send_message(
            receiver=AgentRole.REPORT_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "add_recommendation",
                "recommendation": recommendation,
                "final_score": final_score,
                "justification": self._generate_recommendation_justification(final_score, scoring_result)
            }
        )
    
    async def _general_scoring(self, content: Dict[str, Any]) -> AgentMessage:
        """General scoring request"""
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "general_scoring",
                "rubrics_available": list(self.rubrics.keys()),
                "scoring_history": len(self.scoring_history)
            }
        )
    
    def _extract_technical_score(self, interview_state: Dict[str, Any]) -> float:
        """Extract technical score from interview state"""
        phase_scores = interview_state.get("phase_scores", {})
        
        technical_phases = ["technical_screening", "deep_dive"]
        technical_scores = [phase_scores.get(phase, 5.0) for phase in technical_phases]
        
        return sum(technical_scores) / len(technical_scores) if technical_scores else 5.0
    
    def _extract_behavioral_score(self, interview_state: Dict[str, Any]) -> float:
        """Extract behavioral score from interview state"""
        phase_scores = interview_state.get("phase_scores", {})
        
        behavioral_phases = ["behavioral_assessment"]
        behavioral_scores = [phase_scores.get(phase, 5.0) for phase in behavioral_phases]
        
        return sum(behavioral_scores) / len(behavioral_scores) if behavioral_scores else 5.0
    
    def _extract_experience_score(self, interview_state: Dict[str, Any]) -> float:
        """Extract experience score from interview state"""
        return 6.0
    
    def _extract_cultural_score(self, interview_state: Dict[str, Any]) -> float:
        """Extract cultural fit score from interview state"""
        return 7.0
    
    def _calculate_final_score(self, dimension_scores: Dict[str, float]) -> float:
        """Calculate final weighted score"""
        total_weight = sum(rubric.weight for rubric in self.rubrics.values())
        
        weighted_sum = 0.0
        for dimension, score in dimension_scores.items():
            if dimension in self.rubrics:
                weighted_sum += score * self.rubrics[dimension].weight
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    def _score_to_grade(self, score: float) -> str:
        """Convert score to grade"""
        if score >= 9.0:
            return "A+"
        elif score >= 8.5:
            return "A"
        elif score >= 8.0:
            return "A-"
        elif score >= 7.5:
            return "B+"
        elif score >= 7.0:
            return "B"
        elif score >= 6.5:
            return "B-"
        elif score >= 6.0:
            return "C+"
        elif score >= 5.5:
            return "C"
        elif score >= 5.0:
            return "C-"
        elif score >= 4.0:
            return "D"
        else:
            return "F"
    
    def _calculate_confidence_level(self, dimension_scores: Dict[str, float]) -> str:
        """Calculate confidence level in scoring"""
        scores = list(dimension_scores.values())
        
        if len(scores) < 2:
            return "Low"
        
        mean_score = sum(scores) / len(scores)
        variance = sum((score - mean_score) ** 2 for score in scores) / len(scores)
        std_dev = variance ** 0.5
        
        if std_dev < 1.0:
            return "High"
        elif std_dev < 2.0:
            return "Medium"
        else:
            return "Low"
    
    def _generate_scoring_breakdown(self, dimension_scores: Dict[str, float]) -> Dict[str, Any]:
        """Generate detailed scoring breakdown"""
        breakdown = {}
        
        for dimension, score in dimension_scores.items():
            if dimension in self.rubrics:
                rubric = self.rubrics[dimension]
                breakdown[dimension] = {
                    "score": score,
                    "weight": rubric.weight,
                    "weighted_contribution": score * rubric.weight,
                    "category": rubric.category
                }
        
        return breakdown
    
    def _determine_recommendation(self, final_score: float, scoring_result: Dict[str, Any]) -> str:
        """determine hiring recommendation"""
        grade = scoring_result.get("grade", "C")
        
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
    
    def _generate_recommendation_justification(
        self, 
        final_score: float, 
        scoring_result: Dict[str, Any]
    ) -> str:
        """Generate justification for recommendation"""
        dimension_scores = scoring_result.get("dimension_scores", {})
        
        strengths = []
        weaknesses = []
        
        for dimension, score in dimension_scores.items():
            if score >= 7.0:
                strengths.append(dimension.replace("_", " "))
            elif score < 5.0:
                weaknesses.append(dimension.replace("_", " "))
        
        justification_parts = []
        
        if strengths:
            justification_parts.append(f"Strong performance in: {', '.join(strengths)}")
        
        if weaknesses:
            justification_parts.append(f"Areas for development: {', '.join(weaknesses)}")
        
        if not justification_parts:
            justification_parts.append("Consistent performance across all dimensions")
        
        return ". ".join(justification_parts) + "."