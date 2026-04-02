from pydantic import BaseModel

class PlagiarismRequest(BaseModel):
    user_id: int
    text: str

class PlagiarismResponse(BaseModel):
    similarity: float