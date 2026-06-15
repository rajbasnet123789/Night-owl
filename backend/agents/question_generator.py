from typing import Any, Dict, List, Optional
from .base_agent import BaseAgent, AgentRole, AgentMessage, MessageType
import json


class QuestionStrategy:
    """Defines different questioning strategies"""
    
    @staticmethod
    def behavioral_questions() -> List[str]:
        return [
            "Tell me about a time when you faced a challenging project and how you handled it.",
            "Describe a situation where you had to work with a difficult team member.",
            "How do you prioritize tasks when you have multiple deadlines?",
            "Give an example of when you had to learn a new technology quickly.",
            "Tell me about a time you made a mistake and how you handled it."
        ]
    
    @staticmethod
    def technical_questions(position: str) -> Dict[str, List[str]]:
        questions = {
            "software_engineer": [
                "Explain the difference between a stack and a queue.",
                "How would you design a URL shortener like bit.ly?",
                "Describe the SOLID principles and give examples.",
                "How do you handle database scaling challenges?",
                "Explain the concept of microservices vs monolithic architecture."
            ],
            "data_scientist": [
                "Explain the bias-variance tradeoff.",
                "How would you handle missing data in a dataset?",
                "Describe the difference between supervised and unsupervised learning.",
                "How do you evaluate the performance of a classification model?",
                "Explain the concept of feature engineering."
            ],
            "product_manager": [
                "How do you prioritize features in a product roadmap?",
                "Describe your process for gathering user requirements.",
                "How do you handle conflicting stakeholder priorities?",
                "Explain how you would launch a new product feature.",
                "How do you measure product success?"
            ]
        }
        return questions.get(position.lower().replace(" ", "_"), questions["software_engineer"])


class QuestionGenerationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role=AgentRole.QUESTION_GENERATOR,
            name="Question Generator",
            description="Generates interview questions using RAG and adaptive strategies"
        )
        self.question_history: List[str] = []
        self.difficulty_levels = ["basic", "intermediate", "advanced"]
        self.current_difficulty = "basic"
        
    def get_system_prompt(self) -> str:
        return """You are the Question Generation Agent, responsible for creating engaging and relevant interview questions.

Your capabilities:
1. Generate questions based on job requirements and candidate background
2. Adapt question difficulty based on candidate responses
3. Use RAG to ground questions in technical knowledge
4. Create follow-up questions for deeper exploration
5. Maintain question diversity and flow

Question Types:
- Technical: Assess hard skills and domain knowledge
- Behavioral: Evaluate soft skills and cultural fit
- Situational: Present hypothetical scenarios
- Deep Dive: Explore specific experiences in detail
- Clarifying: Seek more details on previous answers

Strategies:
- Start with easier questions to build confidence
- Gradually increase difficulty based on performance
- Use follow-up questions to probe deeper
- Connect questions to candidate's resume and experience
- Maintain natural conversation flow

Always generate clear, concise, and relevant questions."""
    
    async def process_message(self, message: AgentMessage) -> AgentMessage:
        """Process incoming message and generate questions"""
        try:
            content = message.content
            task_type = content.get("task_type", "")
            
            if task_type == "generate_welcome":
                return await self._generate_welcome(content)
            elif task_type == "generate_question":
                return await self._generate_question(content)
            elif task_type == "generate_follow_up":
                return await self._generate_follow_up(content)
            elif task_type == "generate_deep_dive_question":
                return await self._generate_deep_dive(content)
            elif task_type == "generate_candidate_questions_prompt":
                return await self._generate_candidate_questions_prompt(content)
            elif task_type == "generate_closing":
                return await self._generate_closing(content)
            elif task_type == "generate_fallback_question":
                return await self._generate_fallback_question(content)
            else:
                return await self._generate_general_question(content)
                
        except Exception as e:
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.ERROR,
                content={"error": str(e), "task_type": task_type}
            )
    
    async def _generate_welcome(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate welcome message"""
        candidate_name = content.get("candidate_name", "Candidate")
        position = content.get("position", "Software Engineer")
        
        welcome_message = content.get("welcome_message", "")
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "welcome_message",
                "message": welcome_message,
                "next_action": "start_interview"
            }
        )
    
    async def _generate_question(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate interview question based on context"""
        phase = content.get("phase", "technical_screening")
        context = content.get("context", {})
        position = context.get("position", "Software Engineer")
        
        question = self._select_question(phase, position, context)
        self.question_history.append(question)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "question",
                "question": question,
                "phase": phase,
                "difficulty": self.current_difficulty,
                "context": context
            }
        )
    
    async def _generate_follow_up(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate follow-up question based on candidate's response"""
        candidate_input = content.get("candidate_input", "")
        phase = content.get("phase", "technical_screening")
        
        follow_up = self._create_follow_up_question(candidate_input, phase)
        self.question_history.append(follow_up)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "follow_up_question",
                "question": follow_up,
                "based_on": candidate_input,
                "phase": phase
            }
        )
    
    async def _generate_deep_dive(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate deep dive question for specific area"""
        context = content.get("context", {})
        
        deep_dive_question = self._create_deep_dive_question(context)
        self.question_history.append(deep_dive_question)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "deep_dive_question",
                "question": deep_dive_question,
                "phase": "deep_dive"
            }
        )
    
    async def _generate_candidate_questions_prompt(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate prompt for candidate questions"""
        prompt = """Now I'd like to give you the opportunity to ask me any questions about the role, the team, or the company. 

What questions do you have for me?"""
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "candidate_questions_prompt",
                "message": prompt,
                "phase": "candidate_questions"
            }
        )
    
    async def _generate_closing(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate closing message"""
        candidate_name = content.get("candidate_name", "Candidate")
        
        closing_message = f"""Thank you so much, {candidate_name}, for taking the time to speak with me today. 

I really enjoyed learning about your experience and skills. The interview process is now complete, and our team will review your responses carefully.

You can expect to hear from our HR team within the next few business days with next steps. 

Do you have any final questions before we wrap up?"""
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "closing_message",
                "message": closing_message,
                "phase": "closing"
            }
        )
    
    async def _generate_fallback_question(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate fallback question when error occurs"""
        fallback_questions = [
            "Can you tell me more about your experience with agile methodologies?",
            "How do you approach problem-solving in your work?",
            "Describe your ideal work environment.",
            "What motivates you in your professional life?",
            "How do you stay updated with industry trends?"
        ]
        
        import random
        question = random.choice(fallback_questions)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "fallback_question",
                "question": question,
                "phase": content.get("phase", "technical_screening")
            }
        )
    
    async def _generate_general_question(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate general question"""
        general_questions = [
            "Tell me about yourself and your background.",
            "What are your strengths and weaknesses?",
            "Where do you see yourself in five years?",
            "Why are you interested in this position?",
            "What questions do you have for me?"
        ]
        
        import random
        question = random.choice(general_questions)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "general_question",
                "question": question
            }
        )
    
    def _select_question(self, phase: str, position: str, context: Dict[str, Any]) -> str:
        """Select appropriate question based on phase and context"""
        if phase == "technical_screening":
            questions = QuestionStrategy.technical_questions(position)
            import random
            return random.choice(questions)
        elif phase == "behavioral_assessment":
            questions = QuestionStrategy.behavioral_questions()
            import random
            return random.choice(questions)
        else:
            return self._create_contextual_question(context)
    
    def _create_follow_up_question(self, candidate_input: str, phase: str) -> str:
        """Create follow-up question based on candidate's response"""
        follow_up_templates = {
            "technical_screening": [
                "Can you elaborate on the technical aspects of what you just described?",
                "How would you handle edge cases in that scenario?",
                "What alternatives did you consider before choosing that approach?",
                "Can you walk me through the implementation details?",
                "How did you test that solution?"
            ],
            "behavioral_assessment": [
                "What was the outcome of that situation?",
                "How did that experience change your approach to similar problems?",
                "What would you do differently if faced with the same situation again?",
                "How did your team members respond to your actions?",
                "What key lessons did you learn from that experience?"
            ]
        }
        
        templates = follow_up_templates.get(phase, follow_up_templates["technical_screening"])
        import random
        return random.choice(templates)
    
    def _create_deep_dive_question(self, context: Dict[str, Any]) -> str:
        """Create deep dive question for specific area"""
        deep_dive_questions = [
            "Let's dive deeper into your experience with system architecture. Can you describe a complex system you've designed?",
            "I'd like to explore your problem-solving approach. Tell me about the most challenging bug you've ever fixed.",
            "Let's discuss your leadership experience. How do you handle conflict within a team?",
            "I'm curious about your technical decision-making process. How do you choose between different technologies?",
            "Let's explore your learning methodology. How do you approach learning new technologies?"
        ]
        
        import random
        return random.choice(deep_dive_questions)
    
    def _create_contextual_question(self, context: Dict[str, Any]) -> str:
        """Create contextual question based on interview state"""
        return "Can you tell me more about your professional background and what brings you to this interview?"