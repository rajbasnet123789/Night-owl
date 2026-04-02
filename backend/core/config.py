from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("postgres://avnadmin:<redacted>@pg-e574508-nightowls.a.aivencloud.com:13222/defaultdb?sslmode=require")

settings = Settings()