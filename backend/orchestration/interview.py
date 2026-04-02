from langgraph.graph import StateGraph
from backend.orchestration.nodes import (
    stt_node,
    search_node,
    rag_node,
    llm_node,
    tts_node
)

def build_graph():
    g = StateGraph(dict)

    g.add_node("stt", stt_node)
    g.add_node("search", search_node)
    g.add_node("rag", rag_node)
    g.add_node("llm", llm_node)
    g.add_node("tts", tts_node)

    g.set_entry_point("stt")

    g.add_edge("stt", "search")
    g.add_edge("search", "rag")
    g.add_edge("rag", "llm")
    g.add_edge("llm", "tts")
    
    g.set_finish_point("tts")

    return g.compile()