from orchestration.interview import run_interview, compiled_graph, multi_agent_interviewer
from orchestration.hierarchical_graph import HierarchicalOrchestrator
from state_definition.state import State
from agents.coordinator import InterviewCoordinator
from agents.question_generator import QuestionGenerationAgent
from agents.response_evaluator import ResponseEvaluationAgent
from agents.technical_screener import TechnicalScreeningAgent
from agents.behavioral_analyst import BehavioralAnalysisAgent
from agents.scoring_agent import ScoringAgent
from agents.report_generator import ReportGenerationAgent
from mcp_server.tools import InterviewTools
from memory.agent_memory import AgentMemoryManager
import json
import asyncio


async def main():
    print("Night Owl AI Interview System - Research-Level Multi-Agent Architecture")
    print("=" * 70)
    
    hierarchical_orchestrator = HierarchicalOrchestrator()
    interview_tools = InterviewTools()
    memory_manager = AgentMemoryManager()
    
    while True:
        print("\nOptions:")
        print("1. Start Multi-Agent AI Interview")
        print("2. Test Hierarchical Orchestration")
        print("3. Test MCP Tools")
        print("4. View Agent Status")
        print("5. Exit")
        
        choice = input("\nSelect an option (1-5): ").strip()
        
        if choice == "1":
            print("\nStarting Multi-Agent AI Interview...")
            print("=" * 50)
            
            candidate_name = input("Enter candidate name: ").strip() or "John Doe"
            position = input("Enter position: ").strip() or "Software Engineer"
            
            initial_state = {
                "messages": [],
                "candidate_name": candidate_name,
                "position": position,
                "interview_context": "",
                "interview_stage": "in_progress",
                "is_interview_active": True
            }
            
            result = await compiled_graph.ainvoke(initial_state)
            
            print("\nInterview Summary:")
            print("=" * 50)
            for msg in result.get("messages", []):
                role = "AI" if msg.get("role") == "assistant" else "Candidate"
                print(f"{role}: {msg.get('content', '')}")
            
            print("\nAgent Performance:")
            for agent_name, status in multi_agent_interviewer.get_agent_status().items():
                print(f"  {status['name']}: {status['performance']['tasks_completed']} tasks, "
                      f"{status['performance']['success_rate']:.1%} success rate")
            
        elif choice == "2":
            print("\nTesting Hierarchical Orchestration...")
            print("=" * 50)
            
            candidate_info = {
                "name": "Test Candidate",
                "position": "Software Engineer",
                "resume_text": "Experienced Python developer with 5 years of experience.",
                "job_description": "Looking for a senior software engineer."
            }
            
            result = await hierarchical_orchestrator.run_interview(candidate_info)
            
            print("\nOrchestration Result:")
            print(json.dumps(result, indent=2, default=str))
            
        elif choice == "3":
            print("\nTesting MCP Tools...")
            print("=" * 50)
            
            print("\nAvailable Tools:")
            for tool in interview_tools.registry.get_all_tools():
                print(f"  - {tool.name}: {tool.description}")
            
            print("\nAvailable Resources:")
            for resource in interview_tools.registry.get_all_resources():
                print(f"  - {resource.name}: {resource.description}")
            
            print("\nAvailable Prompts:")
            for prompt in interview_tools.registry.get_all_prompts():
                print(f"  - {prompt.name}: {prompt.description}")
            
            print("\nTesting generate_question tool...")
            result = await interview_tools.registry.tools["generate_question"].handler({
                "skill_area": "programming",
                "difficulty": "intermediate"
            })
            print(f"Generated question: {result['question']}")
            
        elif choice == "4":
            print("\nAgent Status:")
            print("=" * 50)
            
            for agent_name, status in multi_agent_interviewer.get_agent_status().items():
                print(f"\n{status['name']}:")
                print(f"  Role: {status['role']}")
                print(f"  Active: {status['is_active']}")
                print(f"  Tasks Completed: {status['performance']['tasks_completed']}")
                print(f"  Success Rate: {status['performance']['success_rate']:.1%}")
                print(f"  Avg Response Time: {status['performance']['avg_response_time']:.2f}s")
                print(f"  Memory Size: {status['memory_size']} messages")
            
        elif choice == "5":
            print("\nGoodbye!")
            break
            
        else:
            print("Invalid option. Please try again.")


def run_main():
    """Run the main function"""
    asyncio.run(main())


if __name__ == "__main__":
    run_main()
