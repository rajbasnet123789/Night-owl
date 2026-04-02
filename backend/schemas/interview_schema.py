from pydantic import BaseModel

class InterviewCreate(BaseModel):
    user_id: int
    score: int
    feedback: str