import wave
import tempfile
from faster_whisper import WhisperModel

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)


def save_temp_wav(audio_chunks):
    temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)

    wf = wave.open(temp_file.name, 'wb')
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(16000)
    wf.writeframes(b''.join(audio_chunks))
    wf.close()

    return temp_file.name


def transcribe_audio(audio_chunks):
    if not audio_chunks:
        return ""

    audio_path = save_temp_wav(audio_chunks)

    segments, _ = model.transcribe(audio_path)

    return " ".join([seg.text for seg in segments])