from fastapi import APIRouter
from functools import lru_cache

router = APIRouter()


@lru_cache()
def get_graph():
    from backend.orchestration.interview import build_graph
    return build_graph()


@router.post("/start")
def start_interview():
    return {"session_id": "abc123"}


@router.post("/process")
def process_answer(query: str):
    graph = get_graph()

    result = graph.invoke({
        "query": query,
        "history": []
    })

    return {"response": result.get("answer")}