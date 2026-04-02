
from fastapi import APIRouter, WebSocket
import numpy as np
from backend.load_model.vector_store import retrieve
from backend.load_model.text_generation import generate_text

router = APIRouter()

sensor_buffers = [[], [], []]

@router.websocket("/ws/audio")
async def audio_ws(websocket: WebSocket):
    await websocket.accept()
    print("ESP32 Connected")

    while True:
        message = await websocket.receive_bytes()

        sensor_id = message[0]
        chunk = message[1:]

        sensor_buffers[sensor_id].append(chunk)

        if all(len(buf) > 0 for buf in sensor_buffers):
            chunks = [buf.pop(0) for buf in sensor_buffers]

            arrays = [np.frombuffer(c, dtype=np.int16) for c in chunks]
            min_len = min(len(a) for a in arrays)
            arrays = [a[:min_len] for a in arrays]

            fused = np.mean(arrays, axis=0).astype(np.int16)
            text = "user speech"

            context = retrieve(text)

            response = generate_text(f"{context}\n{text}")

            await websocket.send_text(response)