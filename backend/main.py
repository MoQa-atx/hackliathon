import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum
import uuid

from ai_engine import engine
from database import get_db, Complaint

app = FastAPI(
    title="Belediye Akıllı Triyaj API",
    description="Yapay Zeka Destekli Şikayet Analiz ve Yönlendirme Sistemi",
    version="1.0.0"
)

# Frontend'in API'ye erişebilmesi için CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads klasörünü dışa aç (Statik Dosya Sunumu)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# In-memory veritabanı simülasyonu (KALDIRILDI)
# db_complaints = []

class ComplaintStatus(str, Enum):
    BEKLIYOR = "Bekliyor"
    ISLEME_ALINDI = "İşleme Alındı"
    COZULDU = "Çözüldü"
    COZULEMEDI = "Çözülemedi"

class ComplaintResponse(BaseModel):
    id: str
    tracking_code: str
    description: str
    status: ComplaintStatus
    created_at: datetime
    resolved_at: Optional[datetime] = None
    ai_confidence: float
    detected_issue: str
    department: str
    urgency_code: str
    risk_score: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

@app.post("/api/complaints/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    description: str = Form(...),
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Vatandaşın gönderdiği şikayeti ve resmi alır. 
    Yapay zekaya (Mock) sokar.
    Spam değilse kaydeder, spam ise 400 döner.
    """
    
    # 1. Görüntüyü AI modeline gönder
    file_bytes = await image.read()
    ai_result = engine.analyze_image(file_bytes=file_bytes, file_name=image.filename, description=description)
    
    # 2. Spam / Güven Skoru Kontrolü
    if ai_result.is_spam:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Görüntü doğrulanamadı (Güven skoru: %{int(ai_result.confidence_score*100)}). Lütfen daha net bir fotoğraf çekin veya spam yapmaktan kaçının."
        )
        
    # Spam değilse dosyayı uploads klasörüne kaydet
    file_ext = os.path.splitext(image.filename)[1] or ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("uploads", unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    image_url = f"http://localhost:8000/uploads/{unique_filename}"
        
    # 3. Veritabanına kaydet
    complaint_record = Complaint(
        description=description,
        ai_confidence=ai_result.confidence_score,
        detected_issue=ai_result.detected_issue,
        department=ai_result.department,
        urgency_code=ai_result.urgency_code,
        risk_score=ai_result.risk_score,
        latitude=latitude,
        longitude=longitude,
        image_url=image_url
    )
    
    db.add(complaint_record)
    db.commit()
    db.refresh(complaint_record)
    
    return complaint_record

@app.get("/api/complaints/", response_model=List[ComplaintResponse])
async def get_complaints(db: Session = Depends(get_db)):
    """
    Tüm şikayetleri döner. Risk skoruna göre (en yüksekten düşüğe) sıralar.
    Belediye Dashboard'u burayı kullanacak.
    """
    complaints = db.query(Complaint).order_by(Complaint.risk_score.desc()).all()
    return complaints

@app.get("/api/complaints/track/{tracking_code}", response_model=ComplaintResponse)
async def track_complaint(tracking_code: str, db: Session = Depends(get_db)):
    """
    Vatandaşın takip numarasıyla şikayet durumunu sorgulamasını sağlar.
    """
    complaint = db.query(Complaint).filter(Complaint.tracking_code == tracking_code.upper()).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")
    return complaint

class StatusUpdate(BaseModel):
    status: ComplaintStatus

@app.patch("/api/complaints/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(complaint_id: str, status_update: StatusUpdate, db: Session = Depends(get_db)):
    """
    Belediye yetkilisinin şikayet durumunu (Çözüldü vb.) güncellemesini sağlar.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")
        
    complaint.status = status_update.status.value
    if status_update.status == ComplaintStatus.COZULDU:
        complaint.resolved_at = datetime.now()
        
    db.commit()
    db.refresh(complaint)
    return complaint

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
