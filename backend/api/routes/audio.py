from fastapi import APIRouter, UploadFile
from functools import lru_cache

router = APIRouter()


@lru_cache()
def get_transcriber():
    from backend.load_model.speech_to_text import transcribe_audio
    return transcribe_audio


@router.post("/stt")
async def speech_to_text(file: UploadFile):
    path = f"temp_{file.filename}"

    with open(path, "wb") as f:
        f.write(await file.read())

    transcribe_audio = get_transcriber()

    text = transcribe_audio(path)

    return {"text": text}