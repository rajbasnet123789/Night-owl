from fastapi import FastAPI
import uvicorn

import backend.api.routes.auth as auth
import backend.api.routes.interview as interview
import backend.api.routes.audio as audio
import backend.api.routes.search as search
import backend.api.routes.health as health

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(audio.router, prefix="/audio", tags=["Audio"])
app.include_router(search.router, prefix="/search", tags=["Search"])
app.include_router(health.router, prefix="/health", tags=["Health"])


@app.get("/")
def root():
    return {"message": "API is running"}



if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",  
        host="127.0.0.1",
        port=8000,
        reload=True
    )