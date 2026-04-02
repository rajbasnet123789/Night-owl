from backend.load_model.realtime_audio import start_stream, audio_queue
from backend.load_model.vad import is_speech
from backend.orchestration.interview import build_graph

graph = build_graph()
stream = start_stream()

buffer = []

print(" Real-time Interview Started...")

while True:
    if not audio_queue.empty():
        chunk = audio_queue.get()

        if is_speech(chunk):
            buffer.append(chunk)
        else:
            if buffer:
                graph.invoke({"audio": buffer})
                buffer = []