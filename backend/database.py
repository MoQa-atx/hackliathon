from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import uuid
import random
import string

SQLALCHEMY_DATABASE_URL = "sqlite:///./complaints.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def generate_tracking_code():
    # E.g., BEYAZ-X8F2
    chars = string.ascii_uppercase + string.digits
    random_str = ''.join(random.choices(chars, k=4))
    return f"BEYAZ-{random_str}"

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    tracking_code = Column(String, unique=True, index=True, default=generate_tracking_code)
    description = Column(String)
    status = Column(String, default="Bekliyor") # Bekliyor, İşleme Alındı, Çözüldü
    created_at = Column(DateTime, default=datetime.now)
    resolved_at = Column(DateTime, nullable=True)
    ai_confidence = Column(Float)
    detected_issue = Column(String)
    department = Column(String)
    urgency_code = Column(String)
    risk_score = Column(Integer)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_url = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
