
from backend.orchestration.interview import build_graph

graph = build_graph()

def process_query(query):
    return graph.invoke({
        "query": query,
        "history": []
    })