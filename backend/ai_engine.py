import os
import json
import base64
import requests
from pydantic import BaseModel

class AIResult(BaseModel):
    confidence_score: float
    detected_issue: str
    department: str
    urgency_code: str
    risk_score: int
    is_spam: bool

class AIEngine:
    def __init__(self):
        # Gemini REST API'yi dogrudan kullaniyoruz (Bagimliliklari hafifletmek icin)
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.model_name = "gemini-2.5-flash"
        
        if self.api_key:
            self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        else:
            print("WARNING: GEMINI_API_KEY bulunamadi. Sistem demo/mock modunda calisacak.")

    def analyze_image(self, file_bytes: bytes, file_name: str, description: str = "") -> AIResult:
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            # API anahtari yoksa hata dondurmek yerine eski mock sistemin basit halini verelim
            return AIResult(
                confidence_score=0.9,
                detected_issue="API Key Eksik (Mock Veri)",
                department="Sistem Yonetimi",
                urgency_code="Sari Kod",
                risk_score=50,
                is_spam=False
            )

        # Goruntuyu base64'e cevir
        image_b64 = base64.b64encode(file_bytes).decode('utf-8')
        
        # Mime Type belirle
        mime_type = "image/jpeg"
        if file_name.lower().endswith(".png"):
            mime_type = "image/png"
        elif file_name.lower().endswith(".webp"):
            mime_type = "image/webp"

        prompt = f"""
        Analyze this citizen complaint image and description submitted to local city services in Turkey.

        Citizen's Description: "{description}"

        CRITICAL RULE: ALL text output values (detected_issue, department) MUST be written in TURKISH language. Never use English for these fields.

        TASKS:
        1. Check if the image relates to a VALID MUNICIPAL COMPLAINT (e.g. garbage, road damage, broken power line, broken bench, stray animal injury, water leak, etc.).
        2. If the image is IRRELEVANT (selfie, food, indoor furniture, internet meme, ordinary pet photos without any problem, random doodles, etc.), mark it as SPAM (is_spam: true).
        3. If the complaint is valid, determine:
           - detected_issue: The problem in Turkish (e.g. "Yol Çökmesi", "Kırık Bank", "Su Borusu Patlaması", "Çöp Birikintisi")
           - department: The responsible department in Turkish (e.g. "Fen İşleri", "Temizlik İşleri", "Park ve Bahçeler")
           - urgency_code: One of "Kırmızı Kod", "Sarı Kod", "Yeşil Kod"
           - risk_score: 0-100, increasing with severity (exposed electrical wiring > 90, overgrown grass < 30)

        Department examples: Fen İşleri, Temizlik İşleri, Park ve Bahçeler, Zabıta, Çevre Koruma, Ulaşım, Veteriner İşleri, Su ve Kanalizasyon.

        Return ONLY the JSON matching the schema below.
        """

        # Gemini REST Payload for Structured Output
        payload = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": image_b64
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "confidence_score": {"type": "NUMBER", "description": "Confidence score of the analysis (0.0 to 1.0)"},
                        "detected_issue": {"type": "STRING", "description": "The main issue detected, MUST be in Turkish (e.g. Yol Çökmesi, Kırık Bank, Çöp Birikintisi)"},
                        "department": {"type": "STRING", "description": "The city department to route to, MUST be in Turkish (e.g. Fen İşleri, Temizlik İşleri, Park ve Bahçeler)"},
                        "urgency_code": {"type": "STRING", "description": "Urgency code: must be one of 'Kırmızı Kod', 'Sarı Kod', or 'Yeşil Kod'"},
                        "risk_score": {"type": "INTEGER", "description": "Risk score between 0 and 100"},
                        "is_spam": {"type": "BOOLEAN", "description": "Set true if the image is not a real complaint (troll, irrelevant, spam)"}
                    },
                    "required": ["confidence_score", "detected_issue", "department", "urgency_code", "risk_score", "is_spam"]
                }
            }
        }

        try:
            headers = {'Content-Type': 'application/json'}
            response = requests.post(self.url, json=payload, headers=headers)
            
            if response.status_code != 200:
                print(f"Gemini API Hata Kodu: {response.status_code}")
                print(f"Gemini API Hata Detayı: {response.text}")
                # Hata durumunda spam döndürerek sistemin çökmesini engelle
                return AIResult(
                    confidence_score=0.0,
                    detected_issue="API Bağlantı Hatası",
                    department="Yok",
                    urgency_code="Bilinmiyor",
                    risk_score=0,
                    is_spam=True
                )
                
            data = response.json()
            # JSON çıktısını al
            result_text = data['candidates'][0]['content']['parts'][0]['text']
            
            # Text olarak gelen JSON'ı Parse et
            result_json = json.loads(result_text)
            
            return AIResult(**result_json)
            
        except Exception as e:
            print(f"Beklenmeyen Hata: {e}")
            return AIResult(
                confidence_score=0.0,
                detected_issue="Sunucu Taraflı Hata",
                department="Destek",
                urgency_code="Bilinmiyor",
                risk_score=0,
                is_spam=True
            )

engine = AIEngine()
