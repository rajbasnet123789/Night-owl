from typing import Any, Dict, List, Optional, Callable
from .server import ToolDefinition, ResourceDefinition, PromptDefinition
import json


class ToolRegistry:
    """Registry for MCP tools"""
    
    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self.resources: Dict[str, ResourceDefinition] = {}
        self.prompts: Dict[str, PromptDefinition] = {}
        
    def register_tool(self, tool: ToolDefinition):
        """Register a tool"""
        self.tools[tool.name] = tool
        
    def register_resource(self, resource: ResourceDefinition):
        """Register a resource"""
        self.resources[resource.uri] = resource
        
    def register_prompt(self, prompt: PromptDefinition):
        """Register a prompt"""
        self.prompts[prompt.name] = prompt
    
    def get_all_tools(self) -> List[ToolDefinition]:
        """Get all registered tools"""
        return list(self.tools.values())
    
    def get_all_resources(self) -> List[ResourceDefinition]:
        """Get all registered resources"""
        return list(self.resources.values())
    
    def get_all_prompts(self) -> List[PromptDefinition]:
        """Get all registered prompts"""
        return list(self.prompts.values())


class InterviewTools:
    """Interview-specific tools for MCP server"""
    
    def __init__(self):
        self.registry = ToolRegistry()
        self._register_interview_tools()
        self._register_interview_resources()
        self._register_interview_prompts()
        
    def _register_interview_tools(self):
        """Register interview tools"""
        tools = [
            ToolDefinition(
                name="generate_question",
                description="Generate interview question based on context and requirements",
                input_schema={
                    "type": "object",
                    "properties": {
                        "skill_area": {"type": "string", "description": "Technical skill area to assess"},
                        "difficulty": {"type": "string", "enum": ["basic", "intermediate", "advanced"]},
                        "context": {"type": "object", "description": "Interview context"}
                    },
                    "required": ["skill_area"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "difficulty": {"type": "string"},
                        "key_concepts": {"type": "array", "items": {"type": "string"}}
                    }
                },
                handler=self._handle_generate_question
            ),
            ToolDefinition(
                name="evaluate_response",
                description="Evaluate candidate response using structured criteria",
                input_schema={
                    "type": "object",
                    "properties": {
                        "response": {"type": "string", "description": "Candidate response"},
                        "criteria": {"type": "string", "description": "Evaluation criteria"},
                        "context": {"type": "object", "description": "Interview context"}
                    },
                    "required": ["response"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "score": {"type": "number"},
                        "feedback": {"type": "string"},
                        "strengths": {"type": "array", "items": {"type": "string"}},
                        "improvements": {"type": "array", "items": {"type": "string"}}
                    }
                },
                handler=self._handle_evaluate_response
            ),
            ToolDefinition(
                name="calculate_score",
                description="Calculate final candidate score using rubrics",
                input_schema={
                    "type": "object",
                    "properties": {
                        "dimension_scores": {"type": "object", "description": "Scores by dimension"},
                        "weights": {"type": "object", "description": "Dimension weights"}
                    },
                    "required": ["dimension_scores"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "final_score": {"type": "number"},
                        "grade": {"type": "string"},
                        "breakdown": {"type": "object"}
                    }
                },
                handler=self._handle_calculate_score
            ),
            ToolDefinition(
                name="generate_report",
                description="Generate comprehensive interview assessment report",
                input_schema={
                    "type": "object",
                    "properties": {
                        "interview_data": {"type": "object", "description": "Complete interview data"},
                        "format": {"type": "string", "enum": ["json", "markdown", "pdf"]}
                    },
                    "required": ["interview_data"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "report": {"type": "object"},
                        "report_id": {"type": "string"}
                    }
                },
                handler=self._handle_generate_report
            ),
            ToolDefinition(
                name="search_knowledge_base",
                description="Search technical knowledge base for relevant information",
                input_schema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                        "category": {"type": "string", "description": "Knowledge category"},
                        "limit": {"type": "integer", "description": "Maximum results"}
                    },
                    "required": ["query"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "results": {"type": "array", "items": {"type": "object"}},
                        "total_count": {"type": "integer"}
                    }
                },
                handler=self._handle_search_knowledge_base
            ),
            ToolDefinition(
                name="parse_resume",
                description="Parse and extract information from candidate resume",
                input_schema={
                    "type": "object",
                    "properties": {
                        "resume_text": {"type": "string", "description": "Resume text content"},
                        "extract_skills": {"type": "boolean", "description": "Extract technical skills"}
                    },
                    "required": ["resume_text"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "skills": {"type": "array", "items": {"type": "string"}},
                        "experience": {"type": "array", "items": {"type": "object"}},
                        "education": {"type": "array", "items": {"type": "object"}},
                        "summary": {"type": "string"}
                    }
                },
                handler=self._handle_parse_resume
            )
        ]
        
        for tool in tools:
            self.registry.register_tool(tool)
    
    def _register_interview_resources(self):
        """Register interview resources"""
        resources = [
            ResourceDefinition(
                uri="interview://knowledge/technical",
                name="Technical Knowledge Base",
                description="Technical knowledge base with programming concepts and best practices",
                handler=self._handle_get_technical_knowledge
            ),
            ResourceDefinition(
                uri="interview://knowledge/behavioral",
                name="Behavioral Knowledge Base",
                description="Behavioral interview questions and assessment criteria",
                handler=self._handle_get_behavioral_knowledge
            ),
            ResourceDefinition(
                uri="interview://templates/questions",
                name="Question Templates",
                description="Templates for generating interview questions",
                handler=self._handle_get_question_templates
            ),
            ResourceDefinition(
                uri="interview://rubrics/scoring",
                name="Scoring Rubrics",
                description="Scoring rubrics for candidate evaluation",
                handler=self._handle_get_scoring_rubrics
            )
        ]
        
        for resource in resources:
            self.registry.register_resource(resource)
    
    def _register_interview_prompts(self):
        """Register interview prompts"""
        prompts = [
            PromptDefinition(
                name="technical_screening",
                description="Generate technical screening questions for a specific role",
                arguments=[
                    {"name": "role", "description": "Job role", "required": True},
                    {"name": "experience_level", "description": "Experience level", "required": False}
                ],
                handler=self._handle_technical_screening_prompt
            ),
            PromptDefinition(
                name="behavioral_assessment",
                description="Generate behavioral assessment questions",
                arguments=[
                    {"name": "competency", "description": "Competency to assess", "required": True},
                    {"name": "scenario", "description": "Specific scenario", "required": False}
                ],
                handler=self._handle_behavioral_assessment_prompt
            ),
            PromptDefinition(
                name="interview_summary",
                description="Generate interview summary prompt",
                arguments=[
                    {"name": "candidate_name", "description": "Candidate name", "required": True},
                    {"name": "interview_data", "description": "Interview data", "required": True}
                ],
                handler=self._handle_interview_summary_prompt
            )
        ]
        
        for prompt in prompts:
            self.registry.register_prompt(prompt)
    
    async def _handle_generate_question(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Handle generate_question tool"""
        skill_area = args.get("skill_area", "programming")
        difficulty = args.get("difficulty", "basic")
        
        questions = {
            "programming": {
                "basic": "Explain the difference between a stack and a queue.",
                "intermediate": "Describe the SOLID principles with examples.",
                "advanced": "How would you optimize a recursive function with overlapping subproblems?"
            },
            "system_design": {
                "basic": "Explain the client-server architecture.",
                "intermediate": "Design a URL shortener like bit.ly.",
                "advanced": "Design a real-time chat application like WhatsApp."
            }
        }
        
        question = questions.get(skill_area, questions["programming"]).get(
            difficulty, "Tell me about your programming experience."
        )
        
        return {
            "question": question,
            "difficulty": difficulty,
            "key_concepts": ["concept1", "concept2", "concept3"]
        }
    
    async def _handle_evaluate_response(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Handle evaluate_response tool"""
        response = args.get("response", "")
        
        word_count = len(response.split())
        score = min(1.0, word_count / 100)
        
        return {
            "score": score,
            "feedback": "Response evaluated based on completeness and clarity.",
            "strengths": ["Clear communication", "Relevant response"],
            "improvements": ["Could provide more specific examples"]
        }
    
    async def _handle_calculate_score(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Handle calculate_score tool"""
        dimension_scores = args.get("dimension_scores", {})
        
        if not dimension_scores:
            return {"final_score": 0.0, "grade": "F", "breakdown": {}}
        
        weights = {
            "technical_skills": 0.4,
            "behavioral_competencies": 0.3,
            "experience_fit": 0.2,
            "cultural_fit": 0.1
        }
        
        weighted_sum = 0.0
        total_weight = 0.0
        
        for dimension, score in dimension_scores.items():
            weight = weights.get(dimension, 0.1)
            weighted_sum += score * weight
            total_weight += weight
        
        final_score = weighted_sum / total_weight if total_weight > 0 else 0.0
        
        if final_score >= 9.0:
            grade = "A+"
        elif final_score >= 8.0:
            grade = "A"
        elif final_score >= 7.0:
            grade = "B+"
        elif final_score >= 6.0:
            grade = "B"
        elif final_score >= 5.0:
            grade = "C"
        else:
            grade = "F"
        
        return {
            "final_score": final_score,
            "grade": grade,
            "breakdown": dimension_scores
        }
    
    async def _handle_generate_report(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Handle generate_report tool"""
        interview_data = args.get("interview_data", {})
        
        return {
            "report": {
                "candidate_name": interview_data.get("candidate_name", "Candidate"),
                "position": interview_data.get("position", "Software Engineer"),
                "overall_score": interview_data.get("overall_score", 0.0),
                "recommendation": interview_data.get("recommendation", "Neutral"),
                "technical_score": interview_data.get("technical_score", 0.0),
                "behavioral_score": interview_data.get("behavioral_score", 0.0)
            },
            "report_id": f"RPT-{interview_data.get('candidate_name', 'unknown').replace(' ', '-')}"
        }
    
    async def _handle_search_knowledge_base(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Handle search_knowledge_base tool"""
        query = args.get("query", "")
        
        return {
            "results": [
                {
                    "title": f"Knowledge article for: {query}",
                    "content": f"Comprehensive information about {query}...",
                    "relevance_score": 0.85
                }
            ],
            "total_count": 1
        }
    
    async def _handle_parse_resume(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Handle parse_resume tool"""
        resume_text = args.get("resume_text", "")
        
        return {
            "skills": ["Python", "JavaScript", "SQL", "React"],
            "experience": [
                {
                    "company": "Example Corp",
                    "role": "Software Engineer",
                    "duration": "2 years",
                    "description": "Developed web applications"
                }
            ],
            "education": [
                {
                    "institution": "Example University",
                    "degree": "Bachelor of Science in Computer Science",
                    "year": "2020"
                }
            ],
            "summary": "Experienced software engineer with 2+ years of experience."
        }
    
    async def _handle_get_technical_knowledge(self) -> Dict[str, Any]:
        """Handle get_technical_knowledge resource"""
        return {
            "categories": ["programming", "system_design", "databases", "algorithms"],
            "total_articles": 150,
            "last_updated": "2024-01-15"
        }
    
    async def _handle_get_behavioral_knowledge(self) -> Dict[str, Any]:
        """Handle get_behavioral_knowledge resource"""
        return {
            "competencies": ["leadership", "teamwork", "communication", "problem_solving"],
            "question_count": 50,
            "assessment_methods": ["STAR", "situational", "behavioral"]
        }
    
    async def _handle_get_question_templates(self) -> Dict[str, Any]:
        """Handle get_question_templates resource"""
        return {
            "templates": {
                "technical": [
                    "Explain {concept} and provide an example.",
                    "How would you implement {feature}?",
                    "What are the trade-offs of {approach}?"
                ],
                "behavioral": [
                    "Tell me about a time when you {situation}.",
                    "Describe a situation where you had to {challenge}.",
                    "How do you handle {scenario}?"
                ]
            }
        }
    
    async def _handle_get_scoring_rubrics(self) -> Dict[str, Any]:
        """Handle get_scoring_rubrics resource"""
        return {
            "dimensions": {
                "technical_skills": {"weight": 0.4, "max_score": 10},
                "behavioral_competencies": {"weight": 0.3, "max_score": 10},
                "experience_fit": {"weight": 0.2, "max_score": 10},
                "cultural_fit": {"weight": 0.1, "max_score": 10}
            },
            "grading_scale": {
                "A+": "9.0-10.0",
                "A": "8.0-8.9",
                "B+": "7.0-7.9",
                "B": "6.0-6.9",
                "C": "5.0-5.9",
                "F": "0.0-4.9"
            }
        }
    
    async def _handle_technical_screening_prompt(self, args: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Handle technical_screening prompt"""
        role = args.get("role", "Software Engineer")
        experience_level = args.get("experience_level", "mid")
        
        return [
            {
                "role": "user",
                "content": f"Generate technical screening questions for a {experience_level}-level {role} position."
            }
        ]
    
    async def _handle_behavioral_assessment_prompt(self, args: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Handle behavioral_assessment prompt"""
        competency = args.get("competency", "leadership")
        
        return [
            {
                "role": "user",
                "content": f"Generate behavioral assessment questions for {competency} competency."
            }
        ]
    
    async def _handle_interview_summary_prompt(self, args: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Handle interview_summary prompt"""
        candidate_name = args.get("candidate_name", "Candidate")
        interview_data = args.get("interview_data", {})
        
        return [
            {
                "role": "user",
                "content": f"Generate a comprehensive summary for {candidate_name}'s interview."
            }
        ]