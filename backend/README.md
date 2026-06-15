# Night Owl AI Interview System

A research-level multi-agent AI interview system with advanced orchestration, MCP server integration, and hierarchical agent architecture.

## Architecture Overview

This system implements a sophisticated multi-agent architecture for conducting AI-powered interviews with the following components:

### Multi-Agent System

1. **Interview Coordinator (Supervisor)**
   - Central orchestrator managing interview flow
   - Routes tasks to appropriate specialized agents
   - Maintains interview state and context
   - Handles error recovery and fallbacks

2. **Question Generation Agent**
   - Generates interview questions using RAG
   - Adapts question difficulty based on responses
   - Creates follow-up questions for deeper exploration
   - Maintains question diversity and flow

3. **Response Evaluation Agent**
   - Evaluates response completeness and accuracy
   - Assesses depth of knowledge demonstrated
   - Evaluates clarity of communication
   - Provides constructive feedback

4. **Technical Screening Agent**
   - Assesses programming knowledge
   - Evaluates system design understanding
   - Tests database and algorithm knowledge
   - Verifies technical claims from resume

5. **Behavioral Analysis Agent**
   - Evaluates leadership and teamwork abilities
   - Analyzes communication and interpersonal skills
   - Measures adaptability and learning agility
   - Uses STAR method for structured assessment

6. **Scoring Agent**
   - Calculates final scores using structured rubrics
   - Normalizes scores across dimensions
   - Calculates confidence intervals
   - Provides evidence-based scoring justification

7. **Report Generation Agent**
   - Generates comprehensive assessment reports
   - Creates executive summaries
   - Provides actionable feedback
   - Identifies strengths and development areas

### MCP Server Integration

The system includes a Model Context Protocol (MCP) server for tool orchestration:

- **Tools**: Generate questions, evaluate responses, calculate scores, parse resumes
- **Resources**: Technical knowledge base, behavioral knowledge, question templates
- **Prompts**: Technical screening, behavioral assessment, interview summaries

### Memory System

- **Conversation Memory**: Stores conversation history with importance weighting
- **Interview Memory**: Specialized memory for interview sessions
- **Agent Memory**: Individual memory systems for each agent
- **Shared Memory**: Cross-agent memory sharing

## Project Structure

```
backend/
├── agents/                    # Multi-agent system
│   ├── __init__.py
│   ├── base_agent.py         # Base agent classes and interfaces
│   ├── coordinator.py        # Interview Coordinator Agent
│   ├── question_generator.py # Question Generation Agent
│   ├── response_evaluator.py # Response Evaluation Agent
│   ├── technical_screener.py # Technical Screening Agent
│   ├── behavioral_analyst.py # Behavioral Analysis Agent
│   ├── scoring_agent.py      # Scoring Agent
│   └── report_generator.py   # Report Generation Agent
├── mcp_server/               # MCP Server for tool orchestration
│   ├── __init__.py
│   ├── server.py             # MCP Server implementation
│   └── tools.py              # Interview tools and resources
├── memory/                   # Memory systems
│   ├── __init__.py
│   └── agent_memory.py       # Memory management
├── orchestration/            # Orchestration graphs
│   ├── interview.py          # Main interview orchestration
│   └── hierarchical_graph.py # Hierarchical orchestration
├── load_model/               # Model loading and inference
│   ├── speech_to_text.py     # Speech-to-text integration
│   ├── text_to_speech.py     # Text-to-speech integration
│   ├── text_generation.py    # Text generation integration
│   └── google_search_api.py  # Web search integration
├── state_definition/         # State management
│   └── state.py              # Interview state definition
├── main.py                   # Main application entry
├── requirements.txt          # Python dependencies
└── pyproject.toml            # Project configuration
```

## Key Features

### 1. Hierarchical Agent Orchestration

The system uses a hierarchical orchestration pattern where the Coordinator Agent manages the flow between specialized agents:

```
Coordinator Agent
├── Question Generation Agent
├── Response Evaluation Agent
├── Technical Screening Agent
├── Behavioral Analysis Agent
├── Scoring Agent
└── Report Generation Agent
```

### 2. State Machine-Driven Interview Flow

The interview follows a deterministic state machine:

```
INITIALIZATION → INTRODUCTION → TECHNICAL_SCREENING → BEHAVIORAL_ASSESSMENT → DEEP_DIVE → CANDIDATE_QUESTIONS → CLOSING → EVALUATION
```

### 3. Adaptive Questioning

Questions adapt based on:
- Candidate responses
- Difficulty progression
- Skill area focus
- Interview phase

### 4. Evidence-Based Assessment

All evaluations are grounded in specific evidence from candidate responses using the STAR method for behavioral assessment.

### 5. Research-Level Patterns

- **Memory Systems**: Long-term and short-term memory with importance weighting
- **Reflection**: Agents can reflect on their performance
- **Tool Use**: MCP server for external tool integration
- **State Management**: Comprehensive state tracking across agents

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt
# or
uv sync

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

## Usage

### Running the System

```bash
python main.py
```

### Programmatic Usage

```python
from orchestration.interview import multi_agent_interviewer
import asyncio

async def run_interview():
    # Start interview
    welcome = await multi_agent_interviewer.start_interview(
        candidate_name="John Doe",
        position="Software Engineer"
    )
    
    # Process candidate input
    response = await multi_agent_interviewer.process_user_input(
        "I have 5 years of experience in Python development..."
    )
    
    # End interview
    closing = await multi_agent_interviewer.end_interview()

asyncio.run(run_interview())
```

### Using MCP Tools

```python
from mcp_server.tools import InterviewTools

tools = InterviewTools()

# Generate a question
result = await tools.registry.tools["generate_question"].handler({
    "skill_area": "programming",
    "difficulty": "intermediate"
})

# Evaluate a response
result = await tools.registry.tools["evaluate_response"].handler({
    "response": "I would use a hash table for O(1) lookup...",
    "criteria": "technical_depth"
})
```

## Configuration

### Environment Variables

```env
# Deepgram API Key
DEEPGRAM_API_KEY=your_deepgram_key

# Hugging Face API Key
HF_KEY=your_huggingface_key

# Tavily API Key (for web search)
TV_KEY=your_tavily_key
```

### Interview Configuration

The interview can be configured through the state definition:

```python
initial_state = {
    "candidate_name": "John Doe",
    "position": "Software Engineer",
    "max_turns": 20,
    "interview_phases": ["technical", "behavioral", "deep_dive"]
}
```

## Architecture Patterns

### 1. Hierarchical Orchestration

The system uses a supervisor pattern where the Coordinator Agent manages all other agents, routing tasks and maintaining context.

### 2. State Machine

Interview flow follows a deterministic state machine with clear transitions between phases.

### 3. Memory-Augmented Agents

Each agent maintains its own memory system with importance weighting and retrieval capabilities.

### 4. Tool-Use via MCP

External tools are integrated through the Model Context Protocol, providing standardized tool access.

### 5. Evidence-Based Assessment

All scoring and evaluation is grounded in specific evidence from candidate responses.

## Research-Level Features

### 1. Multi-Agent Communication

Agents communicate through structured messages with typed schemas.

### 2. Reflection and Self-Improvement

Agents can reflect on their performance and adjust strategies.

### 3. Adaptive Difficulty

Question difficulty adapts based on candidate performance.

### 4. Comprehensive Evaluation

Multiple dimensions are evaluated with weighted scoring rubrics.

### 5. Audit Trail

Complete conversation and decision history for compliance and review.

## Performance Metrics

The system tracks:
- Tasks completed per agent
- Success rate per agent
- Average response time
- Memory utilization
- Interview completion rate

## Future Enhancements

1. **RAG Integration**: Retrieval-Augmented Generation for knowledge-grounded questions
2. **Real-time Audio**: WebSocket-based real-time audio interviews
3. **Video Analysis**: Facial expression and emotion analysis
4. **Multi-language Support**: Support for multiple interview languages
5. **Advanced Analytics**: Detailed performance analytics and insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.