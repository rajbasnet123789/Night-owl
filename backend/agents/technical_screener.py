from typing import Any, Dict, List, Optional
from .base_agent import BaseAgent, AgentRole, AgentMessage, MessageType
from dataclasses import dataclass
import json


@dataclass
class TechnicalSkill:
    """Represents a technical skill assessment"""
    skill_name: str
    proficiency_level: float  # 0.0 to 1.0
    evidence: List[str] = None
    questions_asked: int = 0
    last_assessed: str = ""
    
    def __post_init__(self):
        if self.evidence is None:
            self.evidence = []


class TechnicalScreeningAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role=AgentRole.TECHNICAL_SCREENER,
            name="Technical Screener",
            description="Evaluates technical skills and domain knowledge"
        )
        self.technical_skills: Dict[str, TechnicalSkill] = {}
        self.question_bank = self._initialize_question_bank()
        
    def _initialize_question_bank(self) -> Dict[str, List[Dict[str, Any]]]:
        """Initialize comprehensive question bank"""
        return {
            "programming": [
                {
                    "question": "Explain the difference between a stack and a queue. When would you use each?",
                    "difficulty": "basic",
                    "key_concepts": ["LIFO", "FIFO", "use cases", "time complexity"]
                },
                {
                    "question": "Describe the SOLID principles and provide an example of each.",
                    "difficulty": "intermediate",
                    "key_concepts": ["Single Responsibility", "Open/Closed", "Liskov Substitution", "Interface Segregation", "Dependency Inversion"]
                },
                {
                    "question": "How would you optimize a recursive function that has overlapping subproblems?",
                    "difficulty": "advanced",
                    "key_concepts": ["memoization", "dynamic programming", "tabulation", "time complexity"]
                }
            ],
            "system_design": [
                {
                    "question": "Design a URL shortener like bit.ly. Walk me through your thought process.",
                    "difficulty": "intermediate",
                    "key_concepts": ["hashing", "database design", "caching", "load balancing", "scalability"]
                },
                {
                    "question": "How would you design a real-time chat application like WhatsApp?",
                    "difficulty": "advanced",
                    "key_concepts": ["WebSocket", "message queues", "database sharding", "presence system"]
                }
            ],
            "databases": [
                {
                    "question": "Explain the difference between SQL and NoSQL databases. When would you choose each?",
                    "difficulty": "basic",
                    "key_concepts": ["ACID", "schema", "scalability", "use cases"]
                },
                {
                    "question": "How would you optimize a slow database query that's affecting application performance?",
                    "difficulty": "intermediate",
                    "key_concepts": ["indexing", "query optimization", "execution plans", "caching"]
                }
            ],
            "algorithms": [
                {
                    "question": "Explain how a hash table works. What are collision resolution strategies?",
                    "difficulty": "intermediate",
                    "key_concepts": ["hashing", "collision resolution", "time complexity", "load factor"]
                },
                {
                    "question": "Describe the difference between BFS and DFS. When would you use each?",
                    "difficulty": "basic",
                    "key_concepts": ["traversal", "queue", "stack", "use cases", "time complexity"]
                }
            ],
            "software_engineering": [
                {
                    "question": "Explain the concept of microservices vs monolithic architecture.",
                    "difficulty": "intermediate",
                    "key_concepts": ["scalability", "deployment", "complexity", "communication"]
                },
                {
                    "question": "How do you ensure code quality in a team environment?",
                    "difficulty": "basic",
                    "key_concepts": ["code review", "testing", "CI/CD", "documentation"]
                }
            ]
        }
    
    def get_system_prompt(self) -> str:
        return """You are the Technical Screening Agent, responsible for evaluating candidates' technical skills and domain knowledge.

Your capabilities:
1. Assess programming knowledge and problem-solving skills
2. Evaluate system design and architecture understanding
3. Test database and algorithm knowledge
4. Verify technical claims from resume
5. Adapt question difficulty based on responses

Technical Domains:
- Programming: Language proficiency, OOP, design patterns
- System Design: Architecture, scalability, distributed systems
- Databases: SQL/NoSQL, optimization, data modeling
- Algorithms: Data structures, complexity analysis, problem-solving
- Software Engineering: Best practices, tools, methodologies

Assessment Approach:
- Start with foundational concepts
- Progressively increase difficulty
- Ask follow-up questions to probe deeper
- Look for practical application knowledge
- Verify claims against resume

Always provide specific, actionable technical feedback."""
    
    async def process_message(self, message: AgentMessage) -> AgentMessage:
        """Process incoming message for technical screening"""
        try:
            content = message.content
            task_type = content.get("task_type", "")
            
            if task_type == "start_technical_screening":
                return await self._start_technical_screening(content)
            elif task_type == "evaluate_technical_response":
                return await self._evaluate_technical_response(content)
            elif task_type == "generate_technical_question":
                return await self._generate_technical_question(content)
            elif task_type == "assess_skill":
                return await self._assess_skill(content)
            else:
                return await self._general_technical_assessment(content)
                
        except Exception as e:
            return await self.send_message(
                receiver=AgentRole.COORDINATOR,
                message_type=MessageType.ERROR,
                content={"error": str(e), "task_type": task_type}
            )
    
    async def _start_technical_screening(self, content: Dict[str, Any]) -> AgentMessage:
        """Start technical screening phase"""
        position = content.get("position", "Software Engineer")
        resume_text = content.get("resume_text", "")
        
        self._extract_skills_from_resume(resume_text)
        
        first_question = self._select_initial_question(position)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "technical_screening_start",
                "question": first_question["question"],
                "difficulty": first_question["difficulty"],
                "position": position,
                "skills_to_assess": list(self.technical_skills.keys())
            }
        )
    
    async def _evaluate_technical_response(self, content: Dict[str, Any]) -> AgentMessage:
        """Evaluate technical response"""
        candidate_input = content.get("candidate_input", "")
        current_skill = content.get("current_skill", "programming")
        difficulty = content.get("difficulty", "basic")
        
        evaluation = self._perform_technical_evaluation(candidate_input, current_skill, difficulty)
        
        if current_skill in self.technical_skills:
            skill = self.technical_skills[current_skill]
            skill.proficiency_level = evaluation["score"]
            skill.evidence.append(candidate_input[:200])
            skill.questions_asked += 1
        
        next_question = self._select_next_question(candidate_input, difficulty)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "technical_evaluation",
                "evaluation": evaluation,
                "next_question": next_question["question"] if next_question else None,
                "next_difficulty": next_question["difficulty"] if next_question else difficulty,
                "current_skill": current_skill,
                "skills_assessment": {k: v.proficiency_level for k, v in self.technical_skills.items()}
            }
        )
    
    async def _generate_technical_question(self, content: Dict[str, Any]) -> AgentMessage:
        """Generate technical question based on context"""
        skill_area = content.get("skill_area", "programming")
        difficulty = content.get("difficulty", "basic")
        context = content.get("context", {})
        
        question = self._select_question_by_skill(skill_area, difficulty)
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "technical_question",
                "question": question["question"],
                "difficulty": question["difficulty"],
                "skill_area": skill_area,
                "key_concepts": question.get("key_concepts", [])
            }
        )
    
    async def _assess_skill(self, content: Dict[str, Any]) -> AgentMessage:
        """Assess specific technical skill"""
        skill_name = content.get("skill_name", "")
        evidence = content.get("evidence", "")
        
        if skill_name not in self.technical_skills:
            self.technical_skills[skill_name] = TechnicalSkill(
                skill_name=skill_name,
                proficiency_level=0.0
            )
        
        skill = self.technical_skills[skill_name]
        
        proficiency = self._calculate_proficiency_from_evidence(evidence)
        skill.proficiency_level = max(skill.proficiency_level, proficiency)
        skill.evidence.append(evidence[:200])
        
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "skill_assessment",
                "skill": skill_name,
                "proficiency": skill.proficiency_level,
                "evidence_count": len(skill.evidence)
            }
        )
    
    async def _general_technical_assessment(self, content: Dict[str, Any]) -> AgentMessage:
        """General technical assessment"""
        return await self.send_message(
            receiver=AgentRole.COORDINATOR,
            message_type=MessageType.RESULT,
            content={
                "result_type": "general_technical_assessment",
                "skills_assessment": {k: v.proficiency_level for k, v in self.technical_skills.items()},
                "overall_technical_score": self._calculate_overall_technical_score()
            }
        )
    
    def _extract_skills_from_resume(self, resume_text: str):
        """Extract technical skills from resume"""
        skill_keywords = {
            "programming": ["python", "java", "javascript", "c++", "ruby", "go", "rust", "typescript"],
            "frameworks": ["react", "angular", "vue", "django", "flask", "spring", "node.js"],
            "databases": ["sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch"],
            "cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform"],
            "tools": ["git", "jenkins", "ci/cd", "agile", "scrum", "jira"]
        }
        
        resume_lower = resume_text.lower()
        
        for category, keywords in skill_keywords.items():
            found_keywords = [kw for kw in keywords if kw in resume_lower]
            if found_keywords:
                self.technical_skills[category] = TechnicalSkill(
                    skill_name=category,
                    proficiency_level=0.5,
                    evidence=[f"Found in resume: {', '.join(found_keywords)}"]
                )
    
    def _select_initial_question(self, position: str) -> Dict[str, Any]:
        """Select initial question based on position"""
        position_lower = position.lower()
        
        if "senior" in position_lower or "lead" in position_lower:
            return self.question_bank["system_design"][0]
        elif "data" in position_lower:
            return self.question_bank["databases"][0]
        else:
            return self.question_bank["programming"][0]
    
    def _select_question_by_skill(self, skill_area: str, difficulty: str) -> Dict[str, Any]:
        """Select question by skill area and difficulty"""
        skill_questions = self.question_bank.get(skill_area, self.question_bank["programming"])
        
        difficulty_match = [q for q in skill_questions if q["difficulty"] == difficulty]
        if difficulty_match:
            import random
            return random.choice(difficulty_match)
        
        import random
        return random.choice(skill_questions)
    
    def _select_next_question(self, candidate_input: str, current_difficulty: str) -> Optional[Dict[str, Any]]:
        """Select next question based on response"""
        if len(candidate_input) > 200 and current_difficulty == "basic":
            return self._select_question_by_skill("programming", "intermediate")
        elif len(candidate_input) > 300 and current_difficulty == "intermediate":
            return self._select_question_by_skill("programming", "advanced")
        
        return self._select_question_by_skill("programming", current_difficulty)
    
    def _perform_technical_evaluation(
        self, 
        candidate_input: str, 
        skill_area: str, 
        difficulty: str
    ) -> Dict[str, Any]:
        """Perform technical evaluation"""
        technical_keywords = self._get_technical_keywords(skill_area)
        
        keyword_count = sum(1 for keyword in technical_keywords if keyword in candidate_input.lower())
        keyword_score = min(1.0, keyword_count / 5)
        
        length_score = min(1.0, len(candidate_input) / 300)
        
        depth_indicators = ["because", "therefore", "however", "for example", "specifically"]
        depth_score = sum(1 for indicator in depth_indicators if indicator in candidate_input.lower())
        depth_score = min(1.0, depth_score / 3)
        
        overall_score = (keyword_score * 0.4 + length_score * 0.3 + depth_score * 0.3)
        
        return {
            "score": overall_score,
            "keyword_score": keyword_score,
            "length_score": length_score,
            "depth_score": depth_score,
            "feedback": self._generate_technical_feedback(overall_score, skill_area),
            "strengths": self._identify_technical_strengths(candidate_input),
            "areas_for_improvement": self._identify_technical_weaknesses(candidate_input)
        }
    
    def _get_technical_keywords(self, skill_area: str) -> List[str]:
        """Get technical keywords for skill area"""
        keywords = {
            "programming": ["algorithm", "function", "class", "object", "variable", "loop", "condition"],
            "system_design": ["scalability", "availability", "consistency", "load balancer", "cache"],
            "databases": ["query", "index", "schema", "normalization", "transaction"],
            "algorithms": ["complexity", "recursion", "iteration", "sorting", "searching"]
        }
        return keywords.get(skill_area, keywords["programming"])
    
    def _calculate_proficiency_from_evidence(self, evidence: str) -> float:
        """Calculate proficiency from evidence"""
        evidence_lower = evidence.lower()
        
        advanced_terms = ["architecture", "distributed", "scalability", "optimization"]
        intermediate_terms = ["implementation", "design", "integration", "testing"]
        basic_terms = ["basic", "fundamental", "simple", "introduction"]
        
        score = 0.3
        
        if any(term in evidence_lower for term in advanced_terms):
            score += 0.4
        elif any(term in evidence_lower for term in intermediate_terms):
            score += 0.3
        elif any(term in evidence_lower for term in basic_terms):
            score += 0.2
            
        return min(1.0, score)
    
    def _calculate_overall_technical_score(self) -> float:
        """Calculate overall technical score"""
        if not self.technical_skills:
            return 0.0
        
        total_score = sum(skill.proficiency_level for skill in self.technical_skills.values())
        return total_score / len(self.technical_skills)
    
    def _generate_technical_feedback(self, score: float, skill_area: str) -> str:
        """Generate technical feedback"""
        if score >= 0.8:
            return f"Excellent {skill_area} knowledge demonstrated. Strong technical foundation."
        elif score >= 0.6:
            return f"Good {skill_area} understanding. Consider deepening knowledge in advanced topics."
        elif score >= 0.4:
            return f"Basic {skill_area} knowledge shown. More practice with practical applications recommended."
        else:
            return f"Needs improvement in {skill_area}. Focus on fundamental concepts."
    
    def _identify_technical_strengths(self, candidate_input: str) -> List[str]:
        """Identify technical strengths"""
        strengths = []
        
        if "because" in candidate_input.lower():
            strengths.append("Explains reasoning well")
        if "for example" in candidate_input.lower():
            strengths.append("Provides concrete examples")
        if any(word in candidate_input.lower() for word in ["optimize", "improve", "efficient"]):
            strengths.append("Performance-conscious")
            
        return strengths if strengths else ["Clear communication"]
    
    def _identify_technical_weaknesses(self, candidate_input: str) -> List[str]:
        """Identify areas for improvement"""
        weaknesses = []
        
        if len(candidate_input) < 100:
            weaknesses.append("Could provide more detailed explanations")
        if "i think" in candidate_input.lower():
            weaknesses.append("Could be more confident in technical assertions")
        if not any(word in candidate_input.lower() for word in ["because", "therefore", "however"]):
            weaknesses.append("Could explain reasoning more clearly")
            
        return weaknesses if weaknesses else ["Continue building practical experience"]