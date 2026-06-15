from typing import Any, Dict, List, Optional
from .base_agent import BaseAgent, AgentRole, AgentMessage, MessageType
from dataclasses import dataclass
import json


@dataclass
class EvaluationCriteria:
    """Defines evaluation criteria for responses"""
    completeness: float = 0.0
    accuracy: float = 0.0
    depth: float = 0.0
    clarity: float = 0.0
    relevance: float = 0.0
    overall_score: float = 0.0
    feedback: str = ""
    strengths: List[str] = None
    weaknesses: List[str] = None
    
    def __post_init__(self):
        if self.strengths is None:
            self.strengths = []
        if self.weaknesses is None:
            self.weaknesses = []
    
    def calculate_overall(self):
        """Calculate overall score from individual criteria"""
        weights = {
            "completeness": 0.25,
            "accuracy": 0.25,
            "depth": 0.20,
            "clarity": 0.15,
            "relevance": 0.15
        }
        
        self.overall_score = (
            self.completeness * weights["completeness"] +
            self.accuracy * weights["accuracy"] +
            self.depth * weights["depth"] +
            self.clarity * weights["clarity"] +
            self.relevance * weights["relevance"]
        )
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "completeness": self.completeness,
            "accuracy": self.accuracy,
            "depth": self.depth,
            "clarity": self.clarity,
            "relevance": self.relevance,
            "overall_score": self.overall_score,
            "feedback": self.feedback,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses
        }


class ResponseEvaluationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role=AgentRole.RESPONSE_EVALUATOR,
            name="Response Evaluator",
            description="Evaluates candidate responses for quality and completeness"
        )
        self.evaluation_history: List[EvaluationCriteria] = []
        
    def get_system_prompt(self) -> str:
        return """You are the Response Evaluation Agent, responsible for assessing candidate interview responses.

Your capabilities:
1. Evaluate response completeness and accuracy
2. Assess depth of knowledge demonstrated
3. Evaluate clarity of communication
4. Provide constructive feedback
5. Identify strengths and areas for improvement

Evaluation Criteria:
- Completeness: Did the candidate fully address the question?
- Accuracy: Is the information provided correct?
- Depth: Does the response demonstrate deep understanding?
- Clarity: Is the response well-organized and easy to follow?
- Relevance: Does the response directly address the question?

Scoring Scale:
- 0.0-0.3: Poor/Insufficient
- 0.3-0.5: Below Average
- 0.5-0.7: Average/Acceptable
- 0.7-0.85: Good/Strong
- 0.85-1.0: Excellent/Outstanding

Always provide specific, actionable feedback with concrete examples."""
    
    async def process_message(self, message: AgentMessage) -> AgentMessage:
        """Process incoming message and evaluate responses"""
        try:
            content = message.content
            task_type = content.get("task_type", "")
            
            if task_type == "evaluate_response":
                return await self._evaluate_response(content)
            elif task_type == "evaluate_technical":
                return await self._evaluate_technical_response(content)
            elif task_type == "evaluate_behavioral":
                return await self._evaluate_behavioral_response(content)
            else:
                return await self._general_evaluation(content)
                
        except Exception as e:
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.ERROR,
                content={"error": str(e), "task_type": task_type}
            )
    
    async def _evaluate_response(self, content: Dict[str, Any]) -> AgentMessage:
        """Evaluate candidate's response"""
        candidate_input = content.get("candidate_input", "")
        phase = content.get("phase", "technical_screening")
        context = content.get("context", {})
        
        evaluation = self._perform_evaluation(candidate_input, phase, context)
        self.evaluation_history.append(evaluation)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "evaluation",
                "evaluation": evaluation.to_dict(),
                "candidate_input": candidate_input,
                "phase": phase
            }
        )
    
    async def _evaluate_technical_response(self, content: Dict[str, Any]) -> AgentMessage:
        """Evaluate technical response specifically"""
        candidate_input = content.get("candidate_input", "")
        technical_context = content.get("technical_context", {})
        
        evaluation = self._evaluate_technical_depth(candidate_input, technical_context)
        self.evaluation_history.append(evaluation)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "technical_evaluation",
                "evaluation": evaluation.to_dict(),
                "candidate_input": candidate_input
            }
        )
    
    async def _evaluate_behavioral_response(self, content: Dict[str, Any]) -> AgentMessage:
        """Evaluate behavioral response specifically"""
        candidate_input = content.get("candidate_input", "")
        behavioral_context = content.get("behavioral_context", {})
        
        evaluation = self._evaluate_behavioral_aspects(candidate_input, behavioral_context)
        self.evaluation_history.append(evaluation)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "behavioral_evaluation",
                "evaluation": evaluation.to_dict(),
                "candidate_input": candidate_input
            }
        )
    
    async def _general_evaluation(self, content: Dict[str, Any]) -> AgentMessage:
        """Perform general evaluation"""
        candidate_input = content.get("candidate_input", "")
        
        evaluation = EvaluationCriteria(
            completeness=0.7,
            accuracy=0.7,
            depth=0.6,
            clarity=0.8,
            relevance=0.9,
            feedback="Response provided. More detail would strengthen the answer.",
            strengths=["Clear communication", "Relevant response"],
            weaknesses=["Could provide more specific examples"]
        )
        evaluation.calculate_overall()
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "general_evaluation",
                "evaluation": evaluation.to_dict()
            }
        )
    
    def _perform_evaluation(
        self, 
        candidate_input: str, 
        phase: str, 
        context: Dict[str, Any]
    ) -> EvaluationCriteria:
        """Perform comprehensive evaluation of candidate response"""
        words = candidate_input.split()
        word_count = len(words)
        
        completeness = min(1.0, word_count / 100)
        
        technical_keywords = ["algorithm", "implementation", "design", "architecture", "optimize", "test"]
        accuracy = sum(1 for word in words if word.lower() in technical_keywords) / max(1, len(words)) * 5
        accuracy = min(1.0, accuracy)
        
        depth = self._assess_depth(candidate_input)
        clarity = self._assess_clarity(candidate_input)
        relevance = self._assess_relevance(candidate_input, phase)
        
        strengths, weaknesses = self._identify_strengths_weaknesses(candidate_input)
        
        feedback = self._generate_feedback(completeness, accuracy, depth, clarity, relevance)
        
        evaluation = EvaluationCriteria(
            completeness=completeness,
            accuracy=accuracy,
            depth=depth,
            clarity=clarity,
            relevance=relevance,
            feedback=feedback,
            strengths=strengths,
            weaknesses=weaknesses
        )
        evaluation.calculate_overall()
        
        return evaluation
    
    def _evaluate_technical_depth(
        self, 
        candidate_input: str, 
        technical_context: Dict[str, Any]
    ) -> EvaluationCriteria:
        """Evaluate technical depth of response"""
        depth_indicators = [
            "because", "therefore", "however", "additionally",
            "specifically", "for example", "in contrast", "similarly"
        ]
        
        depth_score = sum(1 for indicator in depth_indicators if indicator in candidate_input.lower())
        depth_score = min(1.0, depth_score / 5)
        
        evaluation = EvaluationCriteria(
            completeness=0.8,
            accuracy=0.8,
            depth=depth_score,
            clarity=0.7,
            relevance=0.9,
            feedback="Technical response demonstrates understanding. Consider adding more implementation details.",
            strengths=["Technical knowledge demonstrated", "Relevant to question"],
            weaknesses=["Could include more specific examples"]
        )
        evaluation.calculate_overall()
        
        return evaluation
    
    def _evaluate_behavioral_aspects(
        self, 
        candidate_input: str, 
        behavioral_context: Dict[str, Any]
    ) -> EvaluationCriteria:
        """Evaluate behavioral aspects of response"""
        star_indicators = [
            "when", "situation", "task", "action", "result",
            "challenge", "team", "conflict", "resolved", "outcome"
        ]
        
        star_score = sum(1 for indicator in star_indicators if indicator in candidate_input.lower())
        star_score = min(1.0, star_score / 6)
        
        evaluation = EvaluationCriteria(
            completeness=0.8,
            accuracy=0.9,
            depth=star_score,
            clarity=0.8,
            relevance=0.9,
            feedback="Good use of STAR method. Consider quantifying results where possible.",
            strengths=["Structured response", "Relevant experience shared"],
            weaknesses=["Could include more measurable outcomes"]
        )
        evaluation.calculate_overall()
        
        return evaluation
    
    def _assess_depth(self, candidate_input: str) -> float:
        """Assess depth of response"""
        depth_score = 0.5
        
        if len(candidate_input) > 200:
            depth_score += 0.2
        if "because" in candidate_input.lower():
            depth_score += 0.1
        if "for example" in candidate_input.lower():
            depth_score += 0.1
        if any(word in candidate_input.lower() for word in ["first", "second", "finally"]):
            depth_score += 0.1
            
        return min(1.0, depth_score)
    
    def _assess_clarity(self, candidate_input: str) -> float:
        """Assess clarity of response"""
        clarity_score = 0.7
        
        sentences = candidate_input.split('.')
        avg_sentence_length = len(candidate_input.split()) / max(1, len(sentences))
        
        if avg_sentence_length < 20:
            clarity_score += 0.2
        elif avg_sentence_length < 30:
            clarity_score += 0.1
            
        return min(1.0, clarity_score)
    
    def _assess_relevance(self, candidate_input: str, phase: str) -> float:
        """Assess relevance to interview phase"""
        phase_keywords = {
            "technical_screening": ["code", "algorithm", "system", "design", "implementation"],
            "behavioral_assessment": ["team", "challenge", "conflict", "leadership", "growth"],
            "deep_dive": ["specifically", "detail", "example", "experience", "approach"]
        }
        
        keywords = phase_keywords.get(phase, [])
        relevance_score = sum(1 for keyword in keywords if keyword in candidate_input.lower())
        relevance_score = min(1.0, 0.5 + relevance_score * 0.15)
        
        return relevance_score
    
    def _identify_strengths_weaknesses(self, candidate_input: str) -> tuple:
        """Identify strengths and weaknesses in response"""
        strengths = []
        weaknesses = []
        
        if len(candidate_input) > 100:
            strengths.append("Comprehensive response")
        else:
            weaknesses.append("Could be more detailed")
            
        if "example" in candidate_input.lower():
            strengths.append("Provided specific examples")
        else:
            weaknesses.append("Could include more examples")
            
        if any(word in candidate_input.lower() for word in ["result", "outcome", "achieved"]):
            strengths.append("Focused on outcomes")
            
        if not strengths:
            strengths.append("Clear communication")
            
        return strengths, weaknesses
    
    def _generate_feedback(
        self, 
        completeness: float, 
        accuracy: float, 
        depth: float, 
        clarity: float, 
        relevance: float
    ) -> str:
        """Generate constructive feedback"""
        feedback_parts = []
        
        if completeness < 0.5:
            feedback_parts.append("The response could be more complete.")
        if accuracy < 0.5:
            feedback_parts.append("Consider verifying technical details.")
        if depth < 0.5:
            feedback_parts.append("Adding more depth would strengthen the answer.")
        if clarity < 0.5:
            feedback_parts.append("Organizing thoughts more clearly would help.")
        if relevance < 0.5:
            feedback_parts.append("Ensure the response directly addresses the question.")
            
        if not feedback_parts:
            feedback_parts.append("Good response overall. Consider adding more specific examples.")
            
        return " ".join(feedback_parts)