from typing import Any, Dict, List, Optional
from .base_agent import BaseAgent, AgentRole, AgentMessage, MessageType
from enum import Enum
import json


class InterviewPhase(str, Enum):
    INITIALIZATION = "initialization"
    INTRODUCTION = "introduction"
    TECHNICAL_SCREENING = "technical_screening"
    BEHAVIORAL_ASSESSMENT = "behavioral_assessment"
    DEEP_DIVE = "deep_dive"
    CANDIDATE_QUESTIONS = "candidate_questions"
    CLOSING = "closing"
    EVALUATION = "evaluation"


class InterviewCoordinator(BaseAgent):
    def __init__(self):
        super().__init__(
            role=AgentRole.COORDINATOR,
            name="Interview Coordinator",
            description="Central orchestrator managing interview flow and agent communication"
        )
        self.current_phase = InterviewPhase.INITIALIZATION
        self.interview_state = {
            "candidate_name": "",
            "position": "",
            "resume_text": "",
            "job_description": "",
            "turn_count": 0,
            "max_turns": 20,
            "phase_scores": {},
            "agent_assignments": {}
        }
        self.agent_queue: List[AgentRole] = []
        
    def get_system_prompt(self) -> str:
        return """You are the Interview Coordinator, the central orchestrator of a multi-agent interview system.

Your responsibilities:
1. Manage interview phases and flow
2. Route tasks to appropriate specialized agents
3. Maintain interview state and context
4. Ensure smooth transitions between phases
5. Handle error recovery and fallbacks
6. Aggregate results from other agents

Interview Phases:
- INITIALIZATION: Set up interview context
- INTRODUCTION: Welcome candidate, explain process
- TECHNICAL_SCREENING: Assess technical skills
- BEHAVIORAL_ASSESSMENT: Evaluate soft skills and cultural fit
- DEEP_DIVE: Explore specific areas in depth
- CANDIDATE_QUESTIONS: Allow candidate to ask questions
- CLOSING: Wrap up interview
- EVALUATION: Compile final assessment

Decision Criteria:
- Route technical questions to TechnicalScreeningAgent
- Route behavioral questions to BehavioralAnalysisAgent
- Route scoring tasks to ScoringAgent
- Route report generation to ReportGenerationAgent

Always maintain professional, structured interview flow."""
    
    async def process_message(self, message: AgentMessage) -> AgentMessage:
        """Process incoming message and coordinate interview flow"""
        try:
            content = message.content
            
            if message.message_type == MessageType.TASK:
                return await self._handle_task(content)
            elif message.message_type == MessageType.RESULT:
                return await self._handle_result(content)
            elif message.message_type == MessageType.ERROR:
                return await self._handle_error(content)
            else:
                return await self._handle_query(content)
                
        except Exception as e:
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.ERROR,
                content={"error": str(e), "phase": self.current_phase.value}
            )
    
    async def _handle_task(self, content: Dict[str, Any]) -> AgentMessage:
        """Handle incoming task requests"""
        task_type = content.get("task_type", "")
        
        if task_type == "start_interview":
            return await self._start_interview(content)
        elif task_type == "process_candidate_input":
            return await self._process_candidate_input(content)
        elif task_type == "transition_phase":
            return await self._transition_phase(content)
        elif task_type == "get_next_agent":
            return await self._get_next_agent(content)
        else:
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.ERROR,
                content={"error": f"Unknown task type: {task_type}"}
            )
    
    async def _start_interview(self, content: Dict[str, Any]) -> AgentMessage:
        """Initialize interview session"""
        self.interview_state.update({
            "candidate_name": content.get("candidate_name", "Candidate"),
            "position": content.get("position", "Software Engineer"),
            "resume_text": content.get("resume_text", ""),
            "job_description": content.get("job_description", ""),
            "turn_count": 0
        })
        
        self.current_phase = InterviewPhase.INTRODUCTION
        
        welcome_message = self._generate_welcome_message()
        
        return await self.send_message(
            receiver=AgentRole.QUESTION_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "generate_welcome",
                "candidate_name": self.interview_state["candidate_name"],
                "position": self.interview_state["position"],
                "welcome_message": welcome_message
            },
            metadata={"phase": self.current_phase.value}
        )
    
    async def _process_candidate_input(self, content: Dict[str, Any]) -> AgentMessage:
        """Process candidate's response and determine next action"""
        candidate_input = content.get("candidate_input", "")
        self.interview_state["turn_count"] += 1
        
        evaluation_needed = self._should_evaluate_response()
        
        if evaluation_needed:
            next_agent = self._determine_next_agent(candidate_input)
            
            return await self.send_message(
                receiver=next_agent,
                message_type=MessageType.TASK,
                content={
                    "task_type": "evaluate_response",
                    "candidate_input": candidate_input,
                    "context": self.interview_state,
                    "phase": self.current_phase.value
                },
                metadata={"phase": self.current_phase.value}
            )
        else:
            return await self._generate_follow_up(candidate_input)
    
    async def _transition_phase(self, content: Dict[str, Any]) -> AgentMessage:
        """Transition to next interview phase"""
        new_phase = content.get("new_phase")
        
        if new_phase:
            self.current_phase = InterviewPhase(new_phase)
            
        phase_handlers = {
            InterviewPhase.TECHNICAL_SCREENING: self._setup_technical_screening,
            InterviewPhase.BEHAVIORAL_ASSESSMENT: self._setup_behavioral_assessment,
            InterviewPhase.DEEP_DIVE: self._setup_deep_dive,
            InterviewPhase.CANDIDATE_QUESTIONS: self._setup_candidate_questions,
            InterviewPhase.CLOSING: self._setup_closing,
            InterviewPhase.EVALUATION: self._setup_evaluation
        }
        
        handler = phase_handlers.get(self.current_phase)
        if handler:
            return await handler()
        
        return await self.send_message(
            receiver=AgentRole.QUESTION_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "generate_question",
                "phase": self.current_phase.value,
                "context": self.interview_state
            }
        )
    
    async def _handle_result(self, content: Dict[str, Any]) -> AgentMessage:
        """Handle results from other agents"""
        result_type = content.get("result_type", "")
        
        if result_type == "evaluation":
            self.interview_state["phase_scores"][self.current_phase.value] = content.get("score", 0)
            
        if self._should_transition_phase():
            return await self._transition_phase({})
        
        return await self.send_message(
            receiver=AgentRole.QUESTION_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "generate_question",
                "phase": self.current_phase.value,
                "context": self.interview_state,
                "previous_result": content
            }
        )
    
    async def _handle_error(self, content: Dict[str, Any]) -> AgentMessage:
        """Handle errors from other agents"""
        error = content.get("error", "Unknown error")
        
        return await self.send_message(
            receiver=AgentRole.QUESTION_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "generate_fallback_question",
                "error": error,
                "phase": self.current_phase.value
            }
        )
    
    async def _handle_query(self, content: Dict[str, Any]) -> AgentMessage:
        """Handle general queries"""
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESPONSE,
            content={
                "status": "ready",
                "current_phase": self.current_phase.value,
                "interview_state": self.interview_state
            }
        )
    
    def _generate_welcome_message(self) -> str:
        """Generate welcome message"""
        candidate_name = self.interview_state["candidate_name"]
        position = self.interview_state["position"]
        
        return f"""Hello {candidate_name}! Welcome to your interview for the {position} position.

I'm your AI interview coordinator, and I'll be guiding you through our structured interview process today. The interview will consist of several phases:

1. Technical Screening - Assessing your technical skills and knowledge
2. Behavioral Assessment - Understanding your soft skills and cultural fit
3. Deep Dive - Exploring specific areas of expertise

The entire interview should take approximately 45-60 minutes. Feel free to ask for clarification at any point.

Let's begin with some introductory questions to get to know you better."""
    
    def _should_evaluate_response(self) -> bool:
        """Determine if response needs evaluation"""
        return self.interview_state["turn_count"] % 3 == 0
    
    def _determine_next_agent(self, candidate_input: str) -> AgentRole:
        """Determine which agent should handle the response"""
        technical_keywords = ["code", "algorithm", "system", "architecture", "database", "api", "python", "java"]
        behavioral_keywords = ["team", "conflict", "challenge", "leadership", "communication", "problem"]
        
        input_lower = candidate_input.lower()
        
        if any(keyword in input_lower for keyword in technical_keywords):
            return AgentRole.TECHNICAL_SCREENER
        elif any(keyword in input_lower for keyword in behavioral_keywords):
            return AgentRole.BEHAVIORAL_ANALYST
        else:
            return AgentRole.RESPONSE_EVALUATOR
    
    def _should_transition_phase(self) -> bool:
        """Determine if we should transition to next phase"""
        phase_turn_limits = {
            InterviewPhase.INTRODUCTION: 3,
            InterviewPhase.TECHNICAL_SCREENING: 8,
            InterviewPhase.BEHAVIORAL_ASSESSMENT: 6,
            InterviewPhase.DEEP_DIVE: 4,
            InterviewPhase.CANDIDATE_QUESTIONS: 3,
            InterviewPhase.CLOSING: 2
        }
        
        max_turns = phase_turn_limits.get(self.current_phase, 5)
        return self.interview_state["turn_count"] >= max_turns
    
    async def _generate_follow_up(self, candidate_input: str) -> AgentMessage:
        """Generate follow-up question"""
        return await self.send_message(
            receiver=AgentRole.QUESTION_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "generate_follow_up",
                "candidate_input": candidate_input,
                "phase": self.current_phase.value,
                "context": self.interview_state
            }
        )
    
    async def _setup_technical_screening(self) -> AgentMessage:
        """Setup technical screening phase"""
        return await self.send_message(
            receiver=AgentRole.TECHNICAL_SCREENER,
            message_type=MessageType.TASK,
            content={
                "task_type": "start_technical_screening",
                "position": self.interview_state["position"],
                "resume_text": self.interview_state["resume_text"],
                "job_description": self.interview_state["job_description"]
            }
        )
    
    async def _setup_behavioral_assessment(self) -> AgentMessage:
        """Setup behavioral assessment phase"""
        return await self.send_message(
            receiver=AgentRole.BEHAVIORAL_ANALYST,
            message_type=MessageType.TASK,
            content={
                "task_type": "start_behavioral_assessment",
                "position": self.interview_state["position"],
                "context": self.interview_state
            }
        )
    
    async def _setup_deep_dive(self) -> AgentMessage:
        """Setup deep dive phase"""
        return await self.send_message(
            receiver=AgentRole.QUESTION_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "generate_deep_dive_question",
                "context": self.interview_state
            }
        )
    
    async def _setup_candidate_questions(self) -> AgentMessage:
        """Setup candidate questions phase"""
        return await self.send_message(
            receiver=AgentRole.QUESTION_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "generate_candidate_questions_prompt",
                "context": self.interview_state
            }
        )
    
    async def _setup_closing(self) -> AgentMessage:
        """Setup closing phase"""
        return await self.send_message(
            receiver=AgentRole.QUESTION_GENERATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "generate_closing",
                "candidate_name": self.interview_state["candidate_name"]
            }
        )
    
    async def _setup_evaluation(self) -> AgentMessage:
        """Setup evaluation phase"""
        return await self.send_message(
            receiver=AgentRole.SCORING_AGENT,
            message_type=MessageType.TASK,
            content={
                "task_type": "compile_evaluation",
                "interview_state": self.interview_state,
                "phase_scores": self.interview_state["phase_scores"]
            }
        )
    
    def get_interview_state(self) -> Dict[str, Any]:
        """Get current interview state"""
        return {
            "current_phase": self.current_phase.value,
            "interview_state": self.interview_state,
            "agent_status": self.get_status()
        }