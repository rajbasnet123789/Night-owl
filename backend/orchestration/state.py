from typing import TypedDict, List

class GraphState(TypedDict):
    query: str
    context: str
    answer: str
    history: List[str]