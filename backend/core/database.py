from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine("postgres://avnadmin:<redacted>@pg-e574508-nightowls.a.aivencloud.com:13222/defaultdb?sslmode=require")

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()