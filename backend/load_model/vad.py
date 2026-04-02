# backend/load_model/vad.py
import numpy as np

def is_speech(frame, threshold=500):
    audio = np.frombuffer(frame, dtype=np.int16)
    return np.abs(audio).mean() > threshold