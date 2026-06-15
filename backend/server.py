import os
import sys
import uuid
import base64
import tempfile
import subprocess
import asyncio
from typing import Dict, Any, List
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add the directory containing server.py to the path so that imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from orchestration.interview import MultiAgentInterviewer

app = FastAPI(title="NightOwl AI Backend", version="0.1.0")

# Enable CORS for the local frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory session store
sessions: Dict[str, MultiAgentInterviewer] = {}

# In-memory Mock Data Databases
RESOURCES_DB = [
    {
        "id": "1",
        "title": "Macroeconomics_Th",
        "type": "Paper",
        "source": "Local Files (MCP)",
        "size": "2.4 MB",
        "tags": ["economics", "quant"],
        "similarity": 0.95,
        "status": "indexed",
        "description": "Comprehensive study on interest rate parity and macro policy models."
    },
    {
        "id": "2",
        "title": "Transformer...",
        "type": "Paper",
        "source": "Web Source (arxiv.org)",
        "size": "1.8 MB",
        "tags": ["machine-learning", "ai"],
        "similarity": 0.98,
        "status": "indexed",
        "description": "The evolution of attention mechanisms and linear-complexity sequence models."
    },
    {
        "id": "3",
        "title": "Full_Course_Repo_C",
        "type": "Repo",
        "source": "Local Files (MCP)",
        "size": "450 MB",
        "tags": ["cs101", "python"],
        "similarity": 0.82,
        "status": "indexing",
        "description": "Lecture notes, programming assignments, and test cases."
    },
    {
        "id": "4",
        "title": "Linear Algebra...",
        "type": "Video",
        "source": "Youtube (12:45)",
        "size": "25 MB",
        "tags": ["math", "visualization"],
        "similarity": 0.89,
        "status": "indexed",
        "description": "Visual intuition for eigenvectors, eigenvalues, and transformations."
    },
    {
        "id": "5",
        "title": "Geopolitics in 2024",
        "type": "Note",
        "source": "Web Resource (nytimes.com)",
        "size": "12 KB",
        "tags": ["geopolitics"],
        "similarity": 0.75,
        "status": "indexed",
        "description": "Analysis of shifting power dynamics in the modern digital age."
    },
    {
        "id": "6",
        "title": "Market_Dataset_Q3.",
        "type": "CSV",
        "source": "Local Files (MCP)",
        "size": "12.5 MB",
        "tags": ["finance", "data"],
        "similarity": 0.88,
        "status": "indexed",
        "description": "Raw market data for longitudinal study of high-frequency trades."
    },
    {
        "id": "7",
        "title": "RAG_Pipeline_V2",
        "type": "Repo",
        "source": "Github (main.py)",
        "size": "34 KB",
        "tags": ["python", "rag"],
        "similarity": 0.82,
        "status": "indexed",
        "description": "Implementation of the hybrid search and retrieval pipeline with caching."
    }
]

ROADMAP_DB = [
    {
        "id": "1",
        "title": "Foundations of Transformer Models",
        "description": "Mastered the core architecture including encoders, decoders, and linear transformations in GPT-2's initial layers.",
        "status": "completed",
        "time_spent": "2h 45m spent",
        "score": "Quiz Results: 94%",
        "badge": "COMPLETED"
    },
    {
        "id": "2",
        "title": "Deciphering Self-Attention",
        "description": "Deep dive into multi-head attention blocks and the mathematical representation of Q, K, and V vectors.",
        "status": "in_progress",
        "progress": 65,
        "badge": "IN PROGRESS"
    },
    {
        "id": "3",
        "title": "Causal Masking & Sequences",
        "description": "Understand how the model prevents 'cheating' by masking future tokens in the training sequence.",
        "status": "locked",
        "badge": "LOCKED"
    },
    {
        "id": "4",
        "title": "Multi-Head Attention Optimization",
        "description": "Examine flash attention and memory efficient algorithms to speed up inference.",
        "status": "locked",
        "badge": "LOCKED"
    }
]

def cleanup_file(file_path):
    """Remove temporary file if it exists."""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass

def generate_realtime_feedback(user_message: str, ai_response: str) -> str:
    """Helper to generate micro feedback tips based on response contents to simulate the REAL-TIME FEEDBACK element."""
    msg = user_message.lower()
    if "bfs" in msg:
        return "REAL-TIME FEEDBACK: You've correctly identified the BFS property. Notice your current implementation in solution.py — make sure to track visited nodes to avoid infinite cycles in cyclic graphs!"
    elif "list" in msg or "tuple" in msg:
        return "REAL-TIME FEEDBACK: Solid distinction. Lists are dynamic/mutable (great for sequence updates) while tuples are immutable (ideal for hashable dictionary keys or fixed records)."
    elif "garbage" in msg or "memory" in msg:
        return "REAL-TIME FEEDBACK: Accurate description of Python's GC. Keep in mind that reference counting handles 99% of cleanup, while the cyclic garbage collector runs periodically to catch container cycles."
    elif "rate limit" in msg or "redis" in msg:
        return "REAL-TIME FEEDBACK: Good design choice! A Sliding Window Log or Token Bucket via Redis sorted sets offers precise limit enforcement and low latency."
    else:
        return "REAL-TIME FEEDBACK: Excellent discussion. Keep explaining your thought processes clearly and structure your answers around runtime complexity and memory trade-offs."

@app.get("/")
def read_root():
    return {"status": "ok", "app": "NightOwl AI Backend"}

@app.post("/api/start")
async def start_interview(request: Request):
    try:
        data = await request.json()
    except:
        data = {}
    candidate_name = data.get("candidate_name", "Candidate")
    position = data.get("position", "Software Engineer")
    
    session_id = str(uuid.uuid4())
    interviewer_instance = MultiAgentInterviewer()
    sessions[session_id] = interviewer_instance
    
    welcome_msg = await interviewer_instance.start_interview(candidate_name, position)
    
    audio_base64 = None
    audio_file = await asyncio.to_thread(interviewer_instance.get_audio_response, welcome_msg)
    if audio_file and os.path.exists(audio_file):
        try:
            with open(audio_file, "rb") as f:
                audio_base64 = base64.b64encode(f.read()).decode("utf-8")
            cleanup_file(audio_file)
        except Exception as e:
            print(f"Error reading TTS file: {e}")
            
    return {
        "session_id": session_id,
        "message": welcome_msg,
        "audio": audio_base64,
        "interview_stage": "in_progress",
        "is_interview_active": True,
        "feedback": "Welcome to NightOwl. Let's begin the interview!"
    }

@app.post("/api/message")
async def send_message(request: Request):
    try:
        data = await request.json()
    except:
        return JSONResponse(status_code=400, content={"error": "Malformed JSON body"})
        
    session_id = data.get("session_id")
    transcription = data.get("transcription", "")
    
    if not session_id or session_id not in sessions:
        return JSONResponse(status_code=400, content={"error": "Invalid or expired session ID"})
        
    interviewer_instance = sessions[session_id]
    
    response = await interviewer_instance.process_user_input(transcription)
    
    audio_base64 = None
    audio_file = await asyncio.to_thread(interviewer_instance.get_audio_response, response)
    if audio_file and os.path.exists(audio_file):
        try:
            with open(audio_file, "rb") as f:
                audio_base64 = base64.b64encode(f.read()).decode("utf-8")
            cleanup_file(audio_file)
        except Exception as e:
            print(f"Error reading TTS file: {e}")
            
    # Check if we should auto-wrap after 5 turns
    user_turns = [m for m in interviewer_instance.conversation_history if m.get("role") == "user"]
    if len(user_turns) >= 5 and interviewer_instance.interview_active:
        # Auto trigger end
        interviewer_instance.interview_active = False
        
    feedback = generate_realtime_feedback(transcription, response)
    
    return {
        "message": response,
        "audio": audio_base64,
        "interview_stage": "in_progress" if interviewer_instance.interview_active else "completed",
        "is_interview_active": interviewer_instance.interview_active,
        "feedback": feedback
    }

@app.post("/api/end")
async def end_interview(request: Request):
    try:
        data = await request.json()
    except:
        return JSONResponse(status_code=400, content={"error": "Malformed JSON body"})
        
    session_id = data.get("session_id")
    if not session_id or session_id not in sessions:
        return JSONResponse(status_code=400, content={"error": "Invalid or expired session ID"})
        
    interviewer_instance = sessions[session_id]
    closing_msg = await interviewer_instance.end_interview()
    
    audio_base64 = None
    audio_file = await asyncio.to_thread(interviewer_instance.get_audio_response, closing_msg)
    if audio_file and os.path.exists(audio_file):
        try:
            with open(audio_file, "rb") as f:
                audio_base64 = base64.b64encode(f.read()).decode("utf-8")
            cleanup_file(audio_file)
        except Exception as e:
            print(f"Error reading TTS file: {e}")
            
    # Remove session from store
    del sessions[session_id]
    
    return {
        "message": closing_msg,
        "audio": audio_base64,
        "interview_stage": "completed",
        "is_interview_active": False,
        "feedback": "Interview completed successfully. Thank you!"
    }

@app.post("/api/run_code")
async def run_code(request: Request):
    try:
        data = await request.json()
    except:
        return JSONResponse(status_code=400, content={"error": "Malformed JSON body"})
        
    solution_code = data.get("solution_code", "")
    test_code = data.get("test_code", "")
    run_tests = data.get("run_tests", False)
    
    # Run code safely in a temporary folder so that solution.py can be imported by tests.py
    with tempfile.TemporaryDirectory() as temp_dir:
        sol_path = os.path.join(temp_dir, "solution.py")
        test_path = os.path.join(temp_dir, "tests.py")
        
        with open(sol_path, "w", encoding="utf-8") as f:
            f.write(solution_code)
            
        with open(test_path, "w", encoding="utf-8") as f:
            f.write(test_code)
            
        try:
            # Determine which script to run
            script_to_run = test_path if run_tests else sol_path
            
            # Run using the python executable of our virtual environment
            # sys.executable contains the python running this FastAPI app, which is the virtual environment python!
            result = subprocess.run(
                [sys.executable, script_to_run],
                cwd=temp_dir,
                capture_output=True,
                text=True,
                timeout=5
            )
            stdout = result.stdout
            stderr = result.stderr
            exit_code = result.returncode
        except subprocess.TimeoutExpired:
            stdout = ""
            stderr = "Error: Code execution timed out (limit: 5s)."
            exit_code = -1
        except Exception as e:
            stdout = ""
            stderr = f"Execution error: {str(e)}"
            exit_code = -1
            
    output_log = ""
    if run_tests:
        output_log += "$ python tests.py\n"
    else:
        output_log += "$ python solution.py\n"
        
    if stdout:
        output_log += stdout
    if stderr:
        output_log += stderr
        
    return {
        "output": output_log,
        "exit_code": exit_code,
        "success": exit_code == 0 and not stderr
    }

@app.get("/api/resources")
def get_resources():
    return RESOURCES_DB

@app.post("/api/resources")
async def add_resource(request: Request):
    try:
        data = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    title = data.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
        
    new_res = {
        "id": str(len(RESOURCES_DB) + 1),
        "title": title,
        "type": data.get("type", "Paper"),
        "source": data.get("source", "Web Resource"),
        "size": data.get("size", "0.5 MB"),
        "tags": data.get("tags", ["new"]),
        "similarity": round(data.get("similarity", 0.70), 2),
        "status": "indexed",
        "description": data.get("description", "Uploaded by user.")
    }
    
    RESOURCES_DB.append(new_res)
    return new_res

@app.get("/api/roadmap")
def get_roadmap():
    return ROADMAP_DB

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
