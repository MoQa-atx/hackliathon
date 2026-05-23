import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status, Depends, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum
import uuid
import re

from ai_engine import engine
from database import get_db, Complaint, Note

app = FastAPI(
    title="Kent Göz API",
    description="Akıllı Şehir Şikayet Analiz ve Yönlendirme Sistemi",
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

# Uploads klasörünü oluştur ve dışa aç (Statik Dosya Sunumu)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# In-memory veritabanı simülasyonu (KALDIRILDI)
# db_complaints = []

class ComplaintStatus(str, Enum):
    BEKLIYOR = "Bekliyor"
    ISLEME_ALINDI = "İşleme Alındı"
    COZULDU = "Çözüldü"
    COZULEMEDI = "Çözülemedi"

class ComplaintUpdateAdmin(BaseModel):
    description: Optional[str] = None
    detected_issue: Optional[str] = None
    department: Optional[str] = None
    urgency_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    risk_score: Optional[int] = None
    ai_confidence: Optional[float] = None
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None

class NoteCreate(BaseModel):
    author: str
    text: str

class NoteResponse(BaseModel):
    id: str
    author: str
    text: str
    created_at: datetime
    
    class Config:
        from_attributes = True

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
    reporter_name: str
    reporter_phone: Optional[str] = None
    notes: List[NoteResponse] = []
    
    class Config:
        from_attributes = True

@app.post("/api/complaints/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    request: Request,
    description: str = Form(...),
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    reporter_name: str = Form("Anonim"),
    reporter_phone: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Vatandaşın gönderdiği şikayeti ve resmi alır. 
    Analiz motoruna sokar.
    Spam değilse kaydeder, spam ise 400 döner.
    """
    
    # 1. Güvenlik & Girdi Doğrulaması (Validation)
    if len(description) > 500:
        raise HTTPException(status_code=400, detail="Açıklama 500 karakterden uzun olamaz.")
        
    if reporter_phone:
        # Sadece rakam ve 10-11 hane kontrolü
        if not re.match(r"^\d{10,11}$", reporter_phone):
            raise HTTPException(status_code=400, detail="Telefon numarası 10 veya 11 haneli rakamlardan oluşmalıdır.")
            
    if reporter_name and len(reporter_name) > 50:
        raise HTTPException(status_code=400, detail="İsim 50 karakterden uzun olamaz.")
        
    # Dosya türü ve uzantısı kontrolü
    allowed_extensions = [".jpg", ".jpeg", ".png"]
    file_ext = os.path.splitext(image.filename)[1].lower() if image.filename else ".jpg"
    
    if not image.content_type.startswith("image/") or file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz dosya türü. Lütfen sadece JPG veya PNG formatında resim dosyası yükleyin."
        )

    # 2. Görüntüyü analiz motoruna gönder
    file_bytes = await image.read()
    
    # Dosya boyutu kontrolü (max 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Dosya boyutu 10MB'ı aşamaz.")
    
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
        
    image_url = f"{request.base_url}uploads/{unique_filename}"
        
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
        image_url=image_url,
        reporter_name=reporter_name,
        reporter_phone=reporter_phone
    )
    
    db.add(complaint_record)
    db.commit()
    db.refresh(complaint_record)
    
    return complaint_record

@app.get("/api/complaints/", response_model=List[ComplaintResponse])
async def get_complaints(db: Session = Depends(get_db)):
    """
    Tüm şikayetleri döner. Risk skoruna göre (en yüksekten düşüğe) sıralar.
    Yönetici paneli burayı kullanacak.
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
    Yetkilinin şikayet durumunu (Çözüldü vb.) güncellemesini sağlar.
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

@app.patch("/api/complaints/{complaint_id}/details", response_model=ComplaintResponse)
def update_complaint_details(complaint_id: str, update_data: ComplaintUpdateAdmin, db: Session = Depends(get_db)):
    """
    Yöneticinin şikayet detaylarını (açıklama, konum, vb.) güncellemesini sağlar.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")
        
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(complaint, key, value)
        
    db.commit()
    db.refresh(complaint)
    return complaint

@app.delete("/api/complaints/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_complaint(complaint_id: str, db: Session = Depends(get_db)):
    """
    Yöneticinin şikayeti tamamen sistemden silmesini sağlar.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")
    
    db.delete(complaint)
    db.commit()
    return None

@app.post("/api/complaints/{complaint_id}/notes", response_model=NoteResponse)
def add_note(complaint_id: str, note_in: NoteCreate, db: Session = Depends(get_db)):
    """
    Şikayete yeni bir not ekler (Görevliler/Çalışanlar için).
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")
    
    new_note = Note(
        complaint_id=complaint_id,
        author=note_in.author,
        text=note_in.text
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
