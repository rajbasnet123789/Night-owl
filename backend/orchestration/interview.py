from load_model.speech_to_text import client_stt
from load_model.text_to_speech import client_tts
from load_model.text_generation import client_tg
from langgraph.graph import StateGraph, MessagesState, START, END
from state_definition.state import State
from typing import Dict, Any
import json

from agents.coordinator import InterviewCoordinator
from agents.question_generator import QuestionGenerationAgent
from agents.response_evaluator import ResponseEvaluationAgent
from agents.technical_screener import TechnicalScreeningAgent
from agents.behavioral_analyst import BehavioralAnalysisAgent
from agents.scoring_agent import ScoringAgent
from agents.report_generator import ReportGenerationAgent
from memory.agent_memory import AgentMemoryManager
from mcp_server.tools import InterviewTools


class MultiAgentInterviewer:
    """Research-level multi-agent interview system"""
    
    def __init__(self):
        self.coordinator = InterviewCoordinator()
        self.question_generator = QuestionGenerationAgent()
        self.response_evaluator = ResponseEvaluationAgent()
        self.technical_screener = TechnicalScreeningAgent()
        self.behavioral_analyst = BehavioralAnalysisAgent()
        self.scoring_agent = ScoringAgent()
        self.report_generator = ReportGenerationAgent()
        
        self.memory_manager = AgentMemoryManager()
        self.tools = InterviewTools()
        
        self.agents = {
            "coordinator": self.coordinator,
            "question_generator": self.question_generator,
            "response_evaluator": self.response_evaluator,
            "technical_screener": self.technical_screener,
            "behavioral_analyst": self.behavioral_analyst,
            "scoring_agent": self.scoring_agent,
            "report_generator": self.report_generator
        }
        
        self.conversation_history = []
        self.interview_active = False
        self.current_phase = "initialization"
        
    async def start_interview(
        self, 
        candidate_name: str = "Candidate", 
        position: str = "Software Engineer",
        resume_text: str = "",
        job_description: str = ""
    ):
        """Start interview with multi-agent orchestration"""
        self.interview_active = True
        self.conversation_history = []
        
        from agents.base_agent import AgentMessage, MessageType, AgentRole
        
        start_message = AgentMessage(
            sender=AgentRole.COORDINATOR,
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "start_interview",
                "candidate_name": candidate_name,
                "position": position,
                "resume_text": resume_text,
                "job_description": job_description
            }
        )
        
        response = await self.coordinator.process_message(start_message)
        
        welcome_msg = response.content.get("welcome_message", "")
        
        self.memory_manager.interview_memory.set_candidate_info({
            "name": candidate_name,
            "position": position,
            "resume_text": resume_text,
            "job_description": job_description
        })
        
        return welcome_msg
    
    async def process_user_input(self, user_input: str) -> str:
        """Process user input through multi-agent system"""
        if not self.interview_active:
            return "Interview not started. Please start the interview first."
        
        self.conversation_history.append({
            "role": "user",
            "content": user_input
        })
        
        from agents.base_agent import AgentMessage, MessageType, AgentRole
        
        process_message = AgentMessage(
            sender=AgentRole.COORDINATOR,
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "process_candidate_input",
                "candidate_input": user_input,
                "phase": self.current_phase
            }
        )
        
        response = await self.coordinator.process_message(process_message)
        
        ai_response = response.content.get("message", "")
        
        if not ai_response:
            ai_response = await self._generate_response_with_agents(user_input)
        
        self.conversation_history.append({
            "role": "assistant",
            "content": ai_response
        })
        
        self.memory_manager.conversation_memory.add_memory({
            "user_input": user_input,
            "ai_response": ai_response,
            "phase": self.current_phase
        }, importance=0.7)
        
        return ai_response
    
    async def _generate_response_with_agents(self, user_input: str) -> str:
        """Generate response using specialized agents"""
        if self.current_phase == "technical_screening":
            from agents.base_agent import AgentMessage, MessageType, AgentRole
            
            tech_message = AgentMessage(
                sender=AgentRole.TECHNICAL_SCREENER,
                receiver=AgentRole.TECHNICAL_SCREENER,
                message_type=MessageType.TASK,
                content={
                    "task_type": "evaluate_technical_response",
                    "candidate_input": user_input,
                    "current_skill": "programming",
                    "difficulty": "intermediate"
                }
            )
            
            response = await self.technical_screener.process_message(tech_message)
            return response.content.get("next_question", "Can you tell me more about your technical experience?")
        
        elif self.current_phase == "behavioral_assessment":
            from agents.base_agent import AgentMessage, MessageType, AgentRole
            
            behavioral_message = AgentMessage(
                sender=AgentRole.BEHAVIORAL_ANALYST,
                receiver=AgentRole.BEHAVIORAL_ANALYST,
                message_type=MessageType.TASK,
                content={
                    "task_type": "evaluate_behavioral_response",
                    "candidate_input": user_input,
                    "current_trait": "teamwork"
                }
            )
            
            response = await self.behavioral_analyst.process_message(behavioral_message)
            return response.content.get("next_question", "Can you describe your ideal work environment?")
        
        else:
            try:
                ai_response = client_tg.generate_interview_response(
                    user_input, 
                    json.dumps(self.conversation_history[-3:])
                )
                return ai_response
            except Exception as e:
                print(f"Error generating response: {e}")
                return "Thank you for that response. Let me ask you about your technical skills."
    
    async def end_interview(self):
        """End interview and generate final report"""
        self.interview_active = False
        
        from agents.base_agent import AgentMessage, MessageType, AgentRole
        
        end_message = AgentMessage(
            sender=AgentRole.COORDINATOR,
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.TASK,
            content={
                "task_type": "transition_phase",
                "new_phase": "evaluation"
            }
        )
        
        response = await self.coordinator.process_message(end_message)
        
        closing_message = "Thank you for participating in this interview. We'll be in touch soon with next steps. Have a great day!"
        
        return closing_message
    
    def get_audio_response(self, text_response: str):
        """Convert text response to audio"""
        try:
            audio_file = client_tts.text_to_audio(text_response)
            return audio_file
        except Exception as e:
            print(f"TTS Error: {e}")
            return None
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all agents"""
        return {
            agent_name: agent.get_status() 
            for agent_name, agent in self.agents.items()
        }
    
    def get_interview_summary(self) -> Dict[str, Any]:
        """Get interview summary"""
        return {
            "conversation_history": self.conversation_history,
            "current_phase": self.current_phase,
            "agent_status": self.get_agent_status(),
            "memory_summary": self.memory_manager.conversation_memory.get_summary()
        }


multi_agent_interviewer = MultiAgentInterviewer()

async def interview_node(state: State) -> Dict[str, Any]:
    """Process interview input through multi-agent system"""
    messages = state.get("messages", [])
    transcription = state.get("transcription", "")
    
    if not transcription:
        return {"messages": [{"role": "assistant", "content": "I didn't catch that. Could you please repeat?"}]}
    
    response = await multi_agent_interviewer.process_user_input(transcription)
    
    audio_file = multi_agent_interviewer.get_audio_response(response)
    
    return {
        "messages": [{"role": "assistant", "content": response}],
        "tts_audio": audio_file
    }

async def start_interview_node(state: State) -> Dict[str, Any]:
    """Start interview with multi-agent system"""
    candidate_name = state.get("candidate_name", "Candidate")
    position = state.get("position", "Software Engineer")
    
    welcome_message = await multi_agent_interviewer.start_interview(candidate_name, position)
    audio_file = multi_agent_interviewer.get_audio_response(welcome_message)
    
    return {
        "messages": [{"role": "assistant", "content": welcome_message}],
        "interview_context": f"Interview for {position} position with {candidate_name}",
        "interview_stage": "in_progress",
        "is_interview_active": True,
        "tts_audio": audio_file
    }

async def end_interview_node(state: State) -> Dict[str, Any]:
    """End interview and generate report"""
    closing_message = await multi_agent_interviewer.end_interview()
    audio_file = multi_agent_interviewer.get_audio_response(closing_message)
    
    return {
        "messages": [{"role": "assistant", "content": closing_message}],
        "interview_stage": "completed",
        "is_interview_active": False,
        "tts_audio": audio_file
    }

def should_continue_interview(state: State) -> str:
    """Determine if interview should continue"""
    if state.get("interview_stage") == "completed":
        return "end"
    return "continue"

graph = StateGraph(State)
graph.add_node("start_interview", start_interview_node)
graph.add_node("process_input", interview_node)
graph.add_node("end_interview", end_interview_node)

graph.add_edge(START, "start_interview")
graph.add_conditional_edges(
    "start_interview",
    should_continue_interview,
    {
        "continue": "process_input",
        "end": "end_interview"
    }
)
graph.add_conditional_edges(
    "process_input",
    should_continue_interview,
    {
        "continue": "process_input",
        "end": "end_interview"
    }
)
graph.add_edge("end_interview", END)

compiled_graph = graph.compile()

async def run_interview():
    """Run complete multi-agent interview"""
    initial_state = {
        "messages": [],
        "candidate_name": "John Doe",
        "position": "Software Engineer",
        "interview_context": "",
        "interview_stage": "in_progress",
        "is_interview_active": True
    }
    
    print("Starting Multi-Agent AI Interview...")
    print("=" * 50)
    
    result = await compiled_graph.ainvoke(initial_state)
    
    print("\nInterview Summary:")
    print("=" * 50)
    for msg in result.get("messages", []):
        role = "AI" if msg.get("role") == "assistant" else "Candidate"
        print(f"{role}: {msg.get('content', '')}")
    
    print("\nAgent Status:")
    print("=" * 50)
    for agent_name, status in multi_agent_interviewer.get_agent_status().items():
        print(f"{agent_name}: {status['name']} - Active: {status['is_active']}")
    
    return result

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_interview())

