import pyaudio
import queue

CHUNK = 1024
RATE = 16000

audio_queue = queue.Queue()

def audio_callback(in_data, frame_count, time_info, status):
    audio_queue.put(in_data)
    return (in_data, pyaudio.paContinue)

def start_stream():
    p = pyaudio.PyAudio()

    stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK,
        stream_callback=audio_callback
    )

    stream.start_stream()
    return stream