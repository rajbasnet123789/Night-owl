from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
def login():
    return {"token": "jwt-token"}


@router.post("/register")
def register():
    return {"status": "user created"}