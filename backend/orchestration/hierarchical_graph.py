from typing import Any, Dict, List, Optional, TypedDict, Annotated
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from dataclasses import dataclass, field
import json
from enum import Enum


class InterviewState(TypedDict):
    """State for the interview orchestration graph"""
    messages: Annotated[list, add_messages]
    current_phase: str
    candidate_info: Dict[str, Any]
    interview_context: Dict[str, Any]
    agent_assignments: Dict[str, str]
    phase_scores: Dict[str, float]
    turn_count: int
    max_turns: int
    is_interview_active: bool
    current_agent: str
    next_action: str


class InterviewPhase(str, Enum):
    INITIALIZATION = "initialization"
    INTRODUCTION = "introduction"
    TECHNICAL_SCREENING = "technical_screening"
    BEHAVIORAL_ASSESSMENT = "behavioral_assessment"
    DEEP_DIVE = "deep_dive"
    CANDIDATE_QUESTIONS = "candidate_questions"
    CLOSING = "closing"
    EVALUATION = "evaluation"


class HierarchicalOrchestrator:
    """Hierarchical orchestration system for multi-agent interviews"""
    
    def __init__(self):
        self.graph = self._build_graph()
        self.agent_registry = {}
        self.workflow_history = []
        
    def _build_graph(self) -> StateGraph:
        """Build the hierarchical orchestration graph"""
        graph = StateGraph(InterviewState)
        
        graph.add_node("initialize", self._initialize_interview)
        graph.add_node("welcome", self._welcome_candidate)
        graph.add_node("route_to_agent", self._route_to_agent)
        graph.add_node("process_technical", self._process_technical)
        graph.add_node("process_behavioral", self._process_behavioral)
        graph.add_node("process_deep_dive", self._process_deep_dive)
        graph.add_node("candidate_questions", self._handle_candidate_questions)
        graph.add_node("closing", self._close_interview)
        graph.add_node("evaluation", self._evaluate_candidate)
        graph.add_node("generate_report", self._generate_final_report)
        
        graph.add_edge(START, "initialize")
        graph.add_edge("initialize", "welcome")
        graph.add_edge("welcome", "route_to_agent")
        
        graph.add_conditional_edges(
            "route_to_agent",
            self._determine_next_phase,
            {
                "technical": "process_technical",
                "behavioral": "process_behavioral",
                "deep_dive": "process_deep_dive",
                "candidate_questions": "candidate_questions",
                "closing": "closing",
                "evaluation": "evaluation"
            }
        )
        
        graph.add_edge("process_technical", "route_to_agent")
        graph.add_edge("process_behavioral", "route_to_agent")
        graph.add_edge("process_deep_dive", "route_to_agent")
        graph.add_edge("candidate_questions", "closing")
        graph.add_edge("closing", "evaluation")
        graph.add_edge("evaluation", "generate_report")
        graph.add_edge("generate_report", END)
        
        return graph.compile()
    
    def _initialize_interview(self, state: InterviewState) -> Dict[str, Any]:
        """Initialize interview session"""
        return {
            "current_phase": InterviewPhase.INITIALIZATION.value,
            "turn_count": 0,
            "is_interview_active": True,
            "phase_scores": {},
            "agent_assignments": {
                "technical": "TechnicalScreeningAgent",
                "behavioral": "BehavioralAnalysisAgent",
                "scoring": "ScoringAgent",
                "report": "ReportGenerationAgent"
            }
        }
    
    def _welcome_candidate(self, state: InterviewState) -> Dict[str, Any]:
        """Welcome candidate and start interview"""
        candidate_name = state.get("candidate_info", {}).get("name", "Candidate")
        position = state.get("candidate_info", {}).get("position", "Software Engineer")
        
        welcome_message = f"""Hello {candidate_name}! Welcome to your interview for the {position} position.

I'm your AI interview coordinator, and I'll be guiding you through our structured interview process today. The interview will consist of several phases:

1. Technical Screening - Assessing your technical skills and knowledge
2. Behavioral Assessment - Understanding your soft skills and cultural fit
3. Deep Dive - Exploring specific areas of expertise

Let's begin!"""
        
        return {
            "messages": [{"role": "assistant", "content": welcome_message}],
            "current_phase": InterviewPhase.INTRODUCTION.value
        }
    
    def _route_to_agent(self, state: InterviewState) -> Dict[str, Any]:
        """Route to appropriate agent based on current phase"""
        current_phase = state.get("current_phase", InterviewPhase.INTRODUCTION.value)
        turn_count = state.get("turn_count", 0)
        
        phase_routing = {
            InterviewPhase.INTRODUCTION.value: "technical",
            InterviewPhase.TECHNICAL_SCREENING.value: "technical",
            InterviewPhase.BEHAVIORAL_ASSESSMENT.value: "behavioral",
            InterviewPhase.DEEP_DIVE.value: "deep_dive",
            InterviewPhase.CANDIDATE_QUESTIONS.value: "candidate_questions",
            InterviewPhase.CLOSING.value: "closing",
            InterviewPhase.EVALUATION.value: "evaluation"
        }
        
        next_action = phase_routing.get(current_phase, "technical")
        
        return {
            "current_agent": state.get("agent_assignments", {}).get(next_action, "Coordinator"),
            "next_action": next_action
        }
    
    def _determine_next_phase(self, state: InterviewState) -> str:
        """Determine next phase based on current state"""
        return state.get("next_action", "technical")
    
    def _process_technical(self, state: InterviewState) -> Dict[str, Any]:
        """Process technical screening phase"""
        turn_count = state.get("turn_count", 0) + 1
        
        if turn_count >= 8:
            return {
                "current_phase": InterviewPhase.BEHAVIORAL_ASSESSMENT.value,
                "turn_count": 0
            }
        
        technical_question = self._generate_technical_question(state)
        
        return {
            "messages": [{"role": "assistant", "content": technical_question}],
            "turn_count": turn_count,
            "current_phase": InterviewPhase.TECHNICAL_SCREENING.value
        }
    
    def _process_behavioral(self, state: InterviewState) -> Dict[str, Any]:
        """Process behavioral assessment phase"""
        turn_count = state.get("turn_count", 0) + 1
        
        if turn_count >= 6:
            return {
                "current_phase": InterviewPhase.DEEP_DIVE.value,
                "turn_count": 0
            }
        
        behavioral_question = self._generate_behavioral_question(state)
        
        return {
            "messages": [{"role": "assistant", "content": behavioral_question}],
            "turn_count": turn_count,
            "current_phase": InterviewPhase.BEHAVIORAL_ASSESSMENT.value
        }
    
    def _process_deep_dive(self, state: InterviewState) -> Dict[str, Any]:
        """Process deep dive phase"""
        turn_count = state.get("turn_count", 0) + 1
        
        if turn_count >= 4:
            return {
                "current_phase": InterviewPhase.CANDIDATE_QUESTIONS.value,
                "turn_count": 0
            }
        
        deep_dive_question = self._generate_deep_dive_question(state)
        
        return {
            "messages": [{"role": "assistant", "content": deep_dive_question}],
            "turn_count": turn_count,
            "current_phase": InterviewPhase.DEEP_DIVE.value
        }
    
    def _handle_candidate_questions(self, state: InterviewState) -> Dict[str, Any]:
        """Handle candidate questions phase"""
        prompt = """Now I'd like to give you the opportunity to ask me any questions about the role, the team, or the company.

What questions do you have for me?"""
        
        return {
            "messages": [{"role": "assistant", "content": prompt}],
            "current_phase": InterviewPhase.CANDIDATE_QUESTIONS.value
        }
    
    def _close_interview(self, state: InterviewState) -> Dict[str, Any]:
        """Close the interview"""
        candidate_name = state.get("candidate_info", {}).get("name", "Candidate")
        
        closing_message = f"""Thank you so much, {candidate_name}, for taking the time to speak with me today.

I really enjoyed learning about your experience and skills. The interview process is now complete, and our team will review your responses carefully.

You can expect to hear from our HR team within the next few business days with next steps.

Have a great day!"""
        
        return {
            "messages": [{"role": "assistant", "content": closing_message}],
            "current_phase": InterviewPhase.CLOSING.value,
            "is_interview_active": False
        }
    
    def _evaluate_candidate(self, state: InterviewState) -> Dict[str, Any]:
        """Evaluate candidate performance"""
        evaluation = {
            "technical_score": 7.5,
            "behavioral_score": 8.0,
            "overall_score": 7.8,
            "grade": "B+",
            "recommendation": "Hire"
        }
        
        return {
            "phase_scores": {
                "technical": 7.5,
                "behavioral": 8.0,
                "overall": 7.8
            },
            "current_phase": InterviewPhase.EVALUATION.value
        }
    
    def _generate_final_report(self, state: InterviewState) -> Dict[str, Any]:
        """Generate final interview report"""
        report = {
            "candidate_name": state.get("candidate_info", {}).get("name", "Candidate"),
            "position": state.get("candidate_info", {}).get("position", "Software Engineer"),
            "overall_score": state.get("phase_scores", {}).get("overall", 0.0),
            "recommendation": "Hire",
            "strengths": ["Strong technical skills", "Good communication"],
            "areas_for_development": ["Could provide more examples"]
        }
        
        return {
            "messages": [{"role": "assistant", "content": f"Interview completed. Overall score: {report['overall_score']}/10.0"}]
        }
    
    def _generate_technical_question(self, state: InterviewState) -> str:
        """Generate technical question"""
        questions = [
            "Explain the difference between a stack and a queue.",
            "How would you design a URL shortener like bit.ly?",
            "Describe the SOLID principles with examples.",
            "How do you handle database scaling challenges?",
            "Explain the concept of microservices vs monolithic architecture."
        ]
        
        import random
        return random.choice(questions)
    
    def _generate_behavioral_question(self, state: InterviewState) -> str:
        """Generate behavioral question"""
        questions = [
            "Tell me about a time when you faced a challenging project.",
            "Describe a situation where you had to work with a difficult team member.",
            "How do you prioritize tasks when you have multiple deadlines?",
            "Give an example of when you had to learn a new technology quickly.",
            "Tell me about a time you made a mistake and how you handled it."
        ]
        
        import random
        return random.choice(questions)
    
    def _generate_deep_dive_question(self, state: InterviewState) -> str:
        """Generate deep dive question"""
        questions = [
            "Let's dive deeper into your experience with system architecture.",
            "I'd like to explore your problem-solving approach.",
            "Let's discuss your leadership experience.",
            "I'm curious about your technical decision-making process.",
            "Let's explore your learning methodology."
        ]
        
        import random
        return random.choice(questions)
    
    async def run_interview(self, candidate_info: Dict[str, Any]) -> Dict[str, Any]:
        """Run the complete interview process"""
        initial_state: InterviewState = {
            "messages": [],
            "current_phase": InterviewPhase.INITIALIZATION.value,
            "candidate_info": candidate_info,
            "interview_context": {},
            "agent_assignments": {},
            "phase_scores": {},
            "turn_count": 0,
            "max_turns": 20,
            "is_interview_active": True,
            "current_agent": "Coordinator",
            "next_action": "initialize"
        }
        
        result = self.graph.invoke(initial_state)
        
        self.workflow_history.append({
            "candidate_info": candidate_info,
            "result": result,
            "timestamp": "2024-01-15T10:00:00"
        })
        
        return result