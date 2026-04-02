from backend.load_model.speech_to_text import transcribe_audio
from backend.load_model.text_generation import generate_text
from backend.load_model.text_to_speech import speak
from backend.load_model.vector_store import retrieve
from backend.load_model.google_search_api import search_and_store
from backend.orchestration.memory import memory


def stt_node(state):
    audio = state.get("audio", [])

    if not audio:
        return {"query": ""}

    text = transcribe_audio(audio)

    print("User:", text)

    return {"query": text}


def search_node(state):
    query = state.get("query", "")

    if not query:
        return {}

    search_and_store(query)
    return {}


def rag_node(state):
    query = state.get("query", "")

    if not query:
        return {"context": ""}

    context = retrieve(query)
    return {"context": context}


def llm_node(state):
    query = state.get("query", "")
    context = state.get("context", "")

    history = memory.get()

    if not query:
        return {"answer": "Please speak."}

    prompt = f"""
    You are an AI interviewer.

    Conversation:
    {history}

    Context:
    {context}

    Candidate:
    {query}

    Evaluate answer and ask next question.
    """

    response = generate_text(prompt)

    print("AI:", response)

    memory.add(query, response)

    return {"answer": response}


def tts_node(state):
    answer = state.get("answer", "")

    if answer:
        speak(answer)

    return {}