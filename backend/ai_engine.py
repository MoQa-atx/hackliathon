import random
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
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
        # MediaPipe Nesne Tanıma Modelini Yükle (Sadece 4 MB)
        base_options = python.BaseOptions(model_asset_path='efficientdet_lite0.tflite')
        options = vision.ObjectDetectorOptions(base_options=base_options, score_threshold=0.35)
        self.detector = vision.ObjectDetector.create_from_options(options)

        self.scenarios = [
            {
                "issue": "Kopmuş Elektrik Teli / Açık Kablo",
                "department": "Elektrik-Elektronik / İtfaiye",
                "urgency": "Kırmızı Kod",
                "risk": 95,
            },
            {
                "issue": "Derin Yol Çukuru",
                "department": "Fen İşleri",
                "urgency": "Kırmızı Kod",
                "risk": 85,
            },
            {
                "issue": "Kırılmış Park Bankı",
                "department": "Park ve Bahçeler",
                "urgency": "Sarı Kod",
                "risk": 60,
            },
            {
                "issue": "Taşmış Çöp Kutusu / Evsel Atık",
                "department": "Temizlik İşleri",
                "urgency": "Sarı Kod",
                "risk": 45,
            },
            {
                "issue": "Uzamış Çimler",
                "department": "Park ve Bahçeler",
                "urgency": "Yeşil Kod",
                "risk": 20,
            }
        ]

    def analyze_image(self, file_bytes: bytes, file_name: str, description: str = "") -> AIResult:
        # Gelen byte verisini OpenCV formatına çevir
        nparr = np.frombuffer(file_bytes, np.uint8)
        img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        is_spam = False
        spam_confidence = 0.0

        if img_np is not None:
            # OpenCV (BGR) formatını RGB'ye çevirip MediaPipe Image'ına dönüştür
            rgb_img = cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)

            # Modeli çalıştır
            detection_result = self.detector.detect(mp_image)

            # Spam olarak kabul edilecek yasaklı nesneler (COCO Dataset etiketleri)
            spam_labels = ["person", "cat", "dog", "teddy bear", "pizza", "donut", "cake"]
            
            # Şikayet eşleştirme için aranacak nesneler
            bench_labels = ["bench", "chair"]
            trash_labels = ["bottle", "cup", "bowl", "wine glass", "fork", "knife", "spoon"]
            
            detected_bench = False
            detected_trash = False

            for detection in detection_result.detections:
                for category in detection.categories:
                    cat_name = category.category_name.lower()
                    if cat_name in spam_labels:
                        is_spam = True
                        spam_confidence = category.score
                        break
                    elif cat_name in bench_labels:
                        detected_bench = True
                    elif cat_name in trash_labels:
                        detected_trash = True
                if is_spam:
                    break

        # Eğer spam bir nesne bulunduysa (örn: Selfie veya Kedi) direkt reddet
        if is_spam:
            return AIResult(
                confidence_score=spam_confidence,
                detected_issue="Alakasız Nesne Tespit Edildi (Troll/Spam)",
                department="Yok",
                urgency_code="Bilinmiyor",
                risk_score=0,
                is_spam=True
            )

        confidence = random.uniform(0.75, 0.98)
        selected_scenario = None

        # TAMAMEN GÖRÜNTÜ İŞLEME (Text'e bakmak yok)
        if img_np is not None:
            # OpenCV ile Renk Analizi
            hsv_img = cv2.cvtColor(img_np, cv2.COLOR_BGR2HSV)
            
            # Yeşil renk (Çim tespiti için)
            lower_green = np.array([35, 40, 40])
            upper_green = np.array([85, 255, 255])
            green_mask = cv2.inRange(hsv_img, lower_green, upper_green)
            green_ratio = cv2.countNonZero(green_mask) / (img_np.shape[0] * img_np.shape[1])
            
            # Gri/Koyu renk (Asfalt ve Çukur tespiti için)
            lower_gray = np.array([0, 0, 0])
            upper_gray = np.array([180, 50, 80])
            gray_mask = cv2.inRange(hsv_img, lower_gray, upper_gray)
            gray_ratio = cv2.countNonZero(gray_mask) / (img_np.shape[0] * img_np.shape[1])

            # Öncelikli tespitler
            if detected_bench:
                selected_scenario = self.scenarios[2] # Bank
            elif detected_trash:
                selected_scenario = self.scenarios[3] # Çöp
            elif green_ratio > 0.15: # Eğer resmin %15'inden fazlası yeşilse
                selected_scenario = self.scenarios[4] # Çimler
            elif gray_ratio > 0.35: # Eğer resmin %35'inden fazlası asfalt/koyu ise
                selected_scenario = self.scenarios[1] # Çukur
            else:
                # Geriye kalan senaryoyu "Kablo" veya "Genel" atayabiliriz
                selected_scenario = self.scenarios[0] # Kopmuş Kablo
                
        if not selected_scenario:
            selected_scenario = {
                "issue": "Genel Şikayet / Sınıflandırılamadı",
                "department": "Beyaz Masa / Destek Hizmetleri",
                "urgency": "Yeşil Kod",
                "risk": 10,
            }

        return AIResult(
            confidence_score=confidence,
            detected_issue=selected_scenario["issue"],
            department=selected_scenario["department"],
            urgency_code=selected_scenario["urgency"],
            risk_score=selected_scenario["risk"],
            is_spam=False
        )

engine = AIEngine()
