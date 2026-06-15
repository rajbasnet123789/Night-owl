from deepgram import DeepgramClient
from deepgram.core.events import EventType
from dotenv import load_dotenv
import os
import threading
import queue

load_dotenv()
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

class SpeechToText:
    def __init__(self):
        self.client = DeepgramClient(api_key=DEEPGRAM_API_KEY)
        self.transcription_queue = queue.Queue()
        self.connection = None
        self.ready = threading.Event()
        
    def connect(self):
        self.connection = self.client.listen.v2.connect(
            model="flux-general-en",
            eot_threshold=0.7,
            eot_timeout_ms=10000,
            encoding="linear16",
            sample_rate=16000,
        )
        
        def on_message(result):
            event = getattr(result, "event", None)
            transcript = getattr(result, "transcript", None)
            if event == "EndOfTurn" and transcript:
                self.transcription_queue.put(transcript)
        
        self.connection.on(EventType.OPEN, lambda _: self.ready.set())
        self.connection.on(EventType.MESSAGE, on_message)
        
    def start_listening(self):
        if not self.connection:
            self.connect()
        self.ready.wait()
        
    def send_audio(self, audio_data):
        if self.connection:
            self.connection.send_media(audio_data)
            
    def get_transcription(self, timeout=5):
        try:
            return self.transcription_queue.get(timeout=timeout)
        except queue.Empty:
            return None
            
    def stop(self):
        if self.connection:
            self.connection.finish()

client_stt = SpeechToText()