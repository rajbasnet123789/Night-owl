from typing import Any, Dict, List, Optional
from .base_agent import BaseAgent, AgentRole, AgentMessage, MessageType
from dataclasses import dataclass
import json


@dataclass
class BehavioralTrait:
    """Represents a behavioral trait assessment"""
    trait_name: str
    score: float  # 0.0 to 1.0
    evidence: List[str] = None
    questions_asked: int = 0
    last_assessed: str = ""
    
    def __post_init__(self):
        if self.evidence is None:
            self.evidence = []


class BehavioralAnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role=AgentRole.BEHAVIORAL_ANALYST,
            name="Behavioral Analyst",
            description="Evaluates soft skills, cultural fit, and behavioral competencies"
        )
        self.behavioral_traits: Dict[str, BehavioralTrait] = {
            "leadership": BehavioralTrait(trait_name="leadership", score=0.0),
            "teamwork": BehavioralTrait(trait_name="teamwork", score=0.0),
            "communication": BehavioralTrait(trait_name="communication", score=0.0),
            "problem_solving": BehavioralTrait(trait_name="problem_solving", score=0.0),
            "adaptability": BehavioralTrait(trait_name="adaptability", score=0.0),
            "conflict_resolution": BehavioralTrait(trait_name="conflict_resolution", score=0.0),
            "time_management": BehavioralTrait(trait_name="time_management", score=0.0),
            "creativity": BehavioralTrait(trait_name="creativity", score=0.0)
        }
        self.star_method_evaluator = STARMethodEvaluator()
        
    def get_system_prompt(self) -> str:
        return """You are the Behavioral Analysis Agent, responsible for evaluating candidates' soft skills and cultural fit.

Your capabilities:
1. Assess leadership and teamwork abilities
2. Evaluate communication and interpersonal skills
3. Analyze problem-solving and conflict resolution approaches
4. Measure adaptability and learning agility
5. Evaluate cultural fit and values alignment

Behavioral Traits Assessed:
- Leadership: Initiative, decision-making, inspiring others
- Teamwork: Collaboration, supporting team members, shared success
- Communication: Clarity, active listening, giving/receiving feedback
- Problem-solving: Analytical thinking, creativity, persistence
- Adaptability: Flexibility, learning from change, resilience
- Conflict resolution: Handling disagreements, finding common ground
- Time management: Prioritization, meeting deadlines, organization
- Creativity: Innovation, thinking outside the box, new ideas

Assessment Framework (STAR Method):
- Situation: Context and background
- Task: Specific responsibility or challenge
- Action: Steps taken to address the situation
- Result: Outcome and lessons learned

Always look for specific examples and measurable outcomes."""
    
    async def process_message(self, message: AgentMessage) -> AgentMessage:
        """Process incoming message for behavioral analysis"""
        try:
            content = message.content
            task_type = content.get("task_type", "")
            
            if task_type == "start_behavioral_assessment":
                return await self._start_behavioral_assessment(content)
            elif task_type == "evaluate_behavioral_response":
                return await self._evaluate_behavioral_response(content)
            elif task_type == "assess_trait":
                return await self._assess_trait(content)
            elif task_type == "analyze_conflict_resolution":
                return await self._analyze_conflict_resolution(content)
            else:
                return await self._general_behavioral_assessment(content)
                
        except Exception as e:
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.ERROR,
                content={"error": str(e), "task_type": task_type}
            )
    
    async def _start_behavioral_assessment(self, content: Dict[str, Any]) -> AgentMessage:
        """Start behavioral assessment phase"""
        position = content.get("position", "Software Engineer")
        context = content.get("context", {})
        
        first_question = self._select_initial_behavioral_question(position)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "behavioral_assessment_start",
                "question": first_question["question"],
                "trait_focus": first_question["trait"],
                "position": position,
                "traits_to_assess": list(self.behavioral_traits.keys())
            }
        )
    
    async def _evaluate_behavioral_response(self, content: Dict[str, Any]) -> AgentMessage:
        """Evaluate behavioral response using STAR method"""
        candidate_input = content.get("candidate_input", "")
        current_trait = content.get("current_trait", "teamwork")
        
        star_evaluation = self.star_method_evaluator.evaluate(candidate_input)
        
        trait_score = self._calculate_trait_score(star_evaluation, candidate_input)
        
        if current_trait in self.behavioral_traits:
            trait = self.behavioral_traits[current_trait]
            trait.score = max(trait.score, trait_score)
            trait.evidence.append(candidate_input[:200])
            trait.questions_asked += 1
        
        next_question = self._select_next_behavioral_question(candidate_input, current_trait)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "behavioral_evaluation",
                "star_evaluation": star_evaluation,
                "trait_score": trait_score,
                "current_trait": current_trait,
                "next_question": next_question["question"] if next_question else None,
                "next_trait": next_question["trait"] if next_question else current_trait,
                "traits_assessment": {k: v.score for k, v in self.behavioral_traits.items()}
            }
        )
    
    async def _assess_trait(self, content: Dict[str, Any]) -> AgentMessage:
        """Assess specific behavioral trait"""
        trait_name = content.get("trait_name", "")
        evidence = content.get("evidence", "")
        
        if trait_name not in self.behavioral_traits:
            self.behavioral_traits[trait_name] = BehavioralTrait(
                trait_name=trait_name,
                score=0.0
            )
        
        trait = self.behavioral_traits[trait_name]
        
        score = self._calculate_trait_score_from_evidence(evidence)
        trait.score = max(trait.score, score)
        trait.evidence.append(evidence[:200])
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "trait_assessment",
                "trait": trait_name,
                "score": trait.score,
                "evidence_count": len(trait.evidence)
            }
        )
    
    async def _analyze_conflict_resolution(self, content: Dict[str, Any]) -> AgentMessage:
        """Analyze conflict resolution skills"""
        candidate_input = content.get("candidate_input", "")
        
        conflict_indicators = {
            "collaborative": ["together", "collaborate", "find solution", "compromise"],
            "assertive": ["stand firm", "principles", "important", "necessary"],
            "accommodating": ["understand", "flexible", "adapt", "adjust"],
            "avoiding": ["avoid", "ignore", "later", "postpone"]
        }
        
        detected_styles = []
        for style, keywords in conflict_indicators.items():
            if any(keyword in candidate_input.lower() for keyword in keywords):
                detected_styles.append(style)
        
        effectiveness_score = self._calculate_conflict_resolution_effectiveness(detected_styles)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "conflict_resolution_analysis",
                "detected_styles": detected_styles,
                "effectiveness_score": effectiveness_score,
                "feedback": self._generate_conflict_resolution_feedback(detected_styles, effectiveness_score)
            }
        )
    
    async def _general_behavioral_assessment(self, content: Dict[str, Any]) -> AgentMessage:
        """General behavioral assessment"""
        overall_score = self._calculate_overall_behavioral_score()
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "general_behavioral_assessment",
                "traits_assessment": {k: v.score for k, v in self.behavioral_traits.items()},
                "overall_behavioral_score": overall_score,
                "strengths": self._identify_behavioral_strengths(),
                "areas_for_development": self._identify_behavioral_development_areas()
            }
        )
    
    def _select_initial_behavioral_question(self, position: str) -> Dict[str, Any]:
        """Select initial behavioral question"""
        questions = [
            {
                "question": "Tell me about a time when you had to work closely with a difficult team member. How did you handle the situation?",
                "trait": "teamwork"
            },
            {
                "question": "Describe a situation where you had to lead a project or initiative. What was your approach?",
                "trait": "leadership"
            },
            {
                "question": "Tell me about a time when you had to explain a complex concept to someone without technical background.",
                "trait": "communication"
            },
            {
                "question": "Describe a challenging problem you faced at work. How did you approach solving it?",
                "trait": "problem_solving"
            }
        ]
        
        import random
        return random.choice(questions)
    
    def _select_next_behavioral_question(self, candidate_input: str, current_trait: str) -> Optional[Dict[str, Any]]:
        """Select next behavioral question"""
        questions = {
            "leadership": [
                {"question": "Describe a time when you had to make a difficult decision with limited information.", "trait": "leadership"},
                {"question": "Tell me about a time when you had to motivate a team through a challenging period.", "trait": "leadership"}
            ],
            "teamwork": [
                {"question": "Describe a situation where you had to collaborate with multiple stakeholders.", "trait": "teamwork"},
                {"question": "Tell me about a time when you helped a colleague improve their performance.", "trait": "teamwork"}
            ],
            "communication": [
                {"question": "Describe a time when you had to present complex information to senior leadership.", "trait": "communication"},
                {"question": "Tell me about a time when you received difficult feedback. How did you respond?", "trait": "communication"}
            ],
            "problem_solving": [
                {"question": "Describe a time when you had to think creatively to solve a problem.", "trait": "creativity"},
                {"question": "Tell me about a time when you had to balance multiple priorities.", "trait": "time_management"}
            ]
        }
        
        trait_questions = questions.get(current_trait, questions["teamwork"])
        import random
        return random.choice(trait_questions)
    
    def _calculate_trait_score(self, star_evaluation: Dict[str, Any], candidate_input: str) -> float:
        """Calculate trait score based on STAR evaluation"""
        star_score = star_evaluation.get("overall_score", 0.5)
        
        length_score = min(1.0, len(candidate_input) / 200)
        
        specificity_indicators = ["specifically", "exactly", "particular", "instance"]
        specificity_score = sum(1 for indicator in specificity_indicators if indicator in candidate_input.lower())
        specificity_score = min(1.0, specificity_score / 3)
        
        outcome_indicators = ["result", "outcome", "achieved", "improved", "increased"]
        outcome_score = sum(1 for indicator in outcome_indicators if indicator in candidate_input.lower())
        outcome_score = min(1.0, outcome_score / 3)
        
        overall_score = (star_score * 0.4 + length_score * 0.2 + specificity_score * 0.2 + outcome_score * 0.2)
        
        return min(1.0, overall_score)
    
    def _calculate_trait_score_from_evidence(self, evidence: str) -> float:
        """Calculate trait score from evidence"""
        evidence_lower = evidence.lower()
        
        positive_indicators = ["led", "managed", "improved", "achieved", "resolved", "collaborated"]
        score = sum(1 for indicator in positive_indicators if indicator in evidence_lower)
        score = min(1.0, 0.3 + score * 0.15)
        
        return score
    
    def _calculate_conflict_resolution_effectiveness(self, detected_styles: List[str]) -> float:
        """Calculate conflict resolution effectiveness"""
        if not detected_styles:
            return 0.3
        
        style_scores = {
            "collaborative": 0.9,
            "assertive": 0.7,
            "accommodating": 0.6,
            "avoiding": 0.3
        }
        
        scores = [style_scores.get(style, 0.5) for style in detected_styles]
        return sum(scores) / len(scores) if scores else 0.5
    
    def _calculate_overall_behavioral_score(self) -> float:
        """Calculate overall behavioral score"""
        if not self.behavioral_traits:
            return 0.0
        
        total_score = sum(trait.score for trait in self.behavioral_traits.values())
        return total_score / len(self.behavioral_traits)
    
    def _identify_behavioral_strengths(self) -> List[str]:
        """Identify behavioral strengths"""
        strengths = []
        
        for trait_name, trait in self.behavioral_traits.items():
            if trait.score >= 0.7:
                strengths.append(f"Strong {trait_name.replace('_', ' ')}")
        
        return strengths if strengths else ["Good communication skills"]
    
    def _identify_behavioral_development_areas(self) -> List[str]:
        """Identify areas for development"""
        areas = []
        
        for trait_name, trait in self.behavioral_traits.items():
            if trait.score < 0.5 and trait.score > 0:
                areas.append(f"{trait_name.replace('_', ' ').title()} could be strengthened")
        
        return areas if areas else ["Continue building leadership experience"]
    
    def _generate_conflict_resolution_feedback(self, detected_styles: List[str], effectiveness_score: float) -> str:
        """Generate conflict resolution feedback"""
        if effectiveness_score >= 0.8:
            return "Excellent conflict resolution approach. Demonstrates collaborative problem-solving."
        elif effectiveness_score >= 0.6:
            return "Good conflict resolution skills. Consider adding more collaborative strategies."
        elif effectiveness_score >= 0.4:
            return "Adequate conflict resolution. Could benefit from more diverse approaches."
        else:
            return "Conflict resolution needs development. Focus on collaborative and assertive styles."


class STARMethodEvaluator:
    """Evaluates responses using the STAR method"""
    
    def evaluate(self, candidate_input: str) -> Dict[str, Any]:
        """Evaluate response using STAR method"""
        situation_score = self._evaluate_situation(candidate_input)
        task_score = self._evaluate_task(candidate_input)
        action_score = self._evaluate_action(candidate_input)
        result_score = self._evaluate_result(candidate_input)
        
        overall_score = (situation_score + task_score + action_score + result_score) / 4
        
        return {
            "situation_score": situation_score,
            "task_score": task_score,
            "action_score": action_score,
            "result_score": result_score,
            "overall_score": overall_score,
            "completeness": self._assess_completeness(situation_score, task_score, action_score, result_score)
        }
    
    def _evaluate_situation(self, candidate_input: str) -> float:
        """Evaluate situation description"""
        situation_indicators = ["when", "while", "during", "at", "situation", "context", "background"]
        score = sum(1 for indicator in situation_indicators if indicator in candidate_input.lower())
        return min(1.0, 0.3 + score * 0.15)
    
    def _evaluate_task(self, candidate_input: str) -> float:
        """Evaluate task description"""
        task_indicators = ["task", "responsible", "needed", "required", "challenge", "problem", "goal"]
        score = sum(1 for indicator in task_indicators if indicator in candidate_input.lower())
        return min(1.0, 0.3 + score * 0.15)
    
    def _evaluate_action(self, candidate_input: str) -> float:
        """Evaluate action description"""
        action_indicators = ["action", "step", "approach", "implement", "executed", "did", "took"]
        score = sum(1 for indicator in action_indicators if indicator in candidate_input.lower())
        return min(1.0, 0.3 + score * 0.15)
    
    def _evaluate_result(self, candidate_input: str) -> float:
        """Evaluate result description"""
        result_indicators = ["result", "outcome", "achieved", "improved", "increased", "success", "learned"]
        score = sum(1 for indicator in result_indicators if indicator in candidate_input.lower())
        return min(1.0, 0.3 + score * 0.15)
    
    def _assess_completeness(
        self, 
        situation_score: float, 
        task_score: float, 
        action_score: float, 
        result_score: float
    ) -> str:
        """Assess STAR completeness"""
        scores = [situation_score, task_score, action_score, result_score]
        avg_score = sum(scores) / len(scores)
        
        if avg_score >= 0.8:
            return "Complete STAR response"
        elif avg_score >= 0.6:
            return "Mostly complete STAR response"
        elif avg_score >= 0.4:
            return "Partial STAR response"
        else:
            return "Incomplete STAR response"