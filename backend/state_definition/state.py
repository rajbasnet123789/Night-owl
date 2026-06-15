from typing_extensions import TypedDict
from langgraph.graph.message import add_messages
from typing_extensions import Annotated
from typing import Optional

class State(TypedDict):
    messages: Annotated[list, add_messages]
    audio_input: Optional[bytes]
    transcription: Optional[str]
    tts_audio: Optional[bytes]
    interview_context: Optional[str]
    candidate_name: Optional[str]
    position: Optional[str]
    interview_stage: Optional[str]
    is_interview_active: bool