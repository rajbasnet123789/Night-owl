from fastapi import APIRouter
from functools import lru_cache

router = APIRouter()


@lru_cache()
def get_search_fn():
    from backend.load_model.google_search_api import search_and_store
    return search_and_store


@router.post("/")
def search(query: str):
    search_fn = get_search_fn()

    result = search_fn(query)

    return {"status": result}