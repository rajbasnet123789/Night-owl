import os
from tavily import TavilyClient
from backend.load_model.vector_store import store_data

client = TavilyClient(api_key='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')

def search_and_store(query):
    results = client.search(query=query)

    for i, r in enumerate(results["results"]):
        store_data(r["content"], f"{query}-{i}")

    return "stored"

