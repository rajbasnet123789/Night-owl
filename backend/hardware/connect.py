import asyncio
import websockets
import numpy as np
import wave
import io
from scipy.signal import butter, lfilter
import speech_recognition as sr

# ==============================
# CONFIG
# ==============================
RATE = 16000
NUM_SENSORS = 3

# Buffers for each sensor
sensor_buffers = [[] for _ in range(NUM_SENSORS)]


# ==============================
# BANDPASS FILTER
# ==============================

def butter_bandpass(lowcut, highcut, fs, order=5):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    return butter(order, [low, high], btype='band')


def apply_bandpass(data):
    b, a = butter_bandpass(300, 3400, RATE)
    return lfilter(b, a, data)



def fuse_audio(chunks):
    arrays = [np.frombuffer(c, dtype=np.int16) for c in chunks]

    # Align all arrays
    min_len = min(len(a) for a in arrays)
    arrays = [a[:min_len] for a in arrays]

    # Average fusion (noise reduction)
    stacked = np.stack(arrays)
    fused = np.mean(stacked, axis=0)

    return fused.astype(np.int16)


# ==============================
# SPEECH TO TEXT
# ==============================

def audio_to_text(audio_bytes):
    recognizer = sr.Recognizer()

    buffer = io.BytesIO()

    with wave.open(buffer, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(RATE)
        wf.writeframes(audio_bytes)

    buffer.seek(0)

    with sr.AudioFile(buffer) as source:
        audio = recognizer.record(source)

    try:
        return recognizer.recognize_google(audio)
    except:
        return ""




async def handler(websocket):
    print("ESP32 Connected!")

    try:
        async for message in websocket:
            # Expect binary message
            if not isinstance(message, (bytes, bytearray)):
                continue

            # First byte = sensor ID
            sensor_id = message[0]
            audio_chunk = message[1:]

            if sensor_id >= NUM_SENSORS:
                print("Invalid sensor ID:", sensor_id)
                continue

            # Store chunk
            sensor_buffers[sensor_id].append(audio_chunk)

            # Process when all sensors have data
            if all(len(buf) > 0 for buf in sensor_buffers):
                chunks = [buf.pop(0) for buf in sensor_buffers]

                print("Processing multi-sensor audio...")

                # Fuse audio
                fused = fuse_audio(chunks)

                # Apply bandpass
                filtered = apply_bandpass(fused)

                audio_bytes = filtered.astype(np.int16).tobytes()

                # STT
                text = audio_to_text(audio_bytes)

                if text:
                    print("Recognized:", text)
                    await websocket.send(text)

    except websockets.exceptions.ConnectionClosed:
        print("ESP32 Disconnected")


# ==============================
# SERVER
# ==============================

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765, max_size=None):
        print("Server running on ws://0.0.0.0:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())