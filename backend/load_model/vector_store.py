import os
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer

try:
    pc = Pinecone(api_key='pcsk_5Cuvsy_NfyiTCS75aqYuvYLg3pYh6Vvf5L2xyMA8QVJ1j6hcf9SeTFHxW5VLUd1oBqwpqM')
    index_name = "interview-ai"
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )

    index = pc.Index(index_name)
    model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    print(e)

def store_data(text, id):
    vector = model.encode(text).tolist()
    index.upsert([(id, vector, {"text": text})])


def retrieve(query):
    vector = model.encode(query).tolist()
    results = index.query(vector=vector, top_k=3, include_metadata=True)

    return " ".join([m["metadata"]["text"] for m in results["matches"]])