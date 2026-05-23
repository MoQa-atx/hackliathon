# Kent Göz - Backend Dokümantasyonu

Bu doküman, projeye sonradan dahil olan veya hackathon sırasında backend tarafında geliştirme yapacak ekip arkadaşları için hazırlanmıştır.

## 📁 Proje Yapısı

Projemizin backend kısmı **Python** ve **FastAPI** kullanılarak geliştirilmiştir. Hızlı çalışması ve otomatik API dokümantasyonu (Swagger) oluşturması hackathon için büyük avantajdır.

```text
backend/
├── main.py              # Uygulamanın giriş noktası. Tüm API uç noktaları (endpoints) buradadır.
├── ai_engine.py         # Görüntü analiz ve sınıflandırma motoru (risk skoru/spam).
├── database.py          # SQLAlchemy veritabanı modelleri ve oturum yönetimi.
├── requirements.txt     # Proje bağımlılıkları (pip install -r requirements.txt)
└── README.md            # Bu dosya.
```

## 🧠 Nasıl Çalışıyor?

### 1. `main.py` (API Katmanı)
Burada temel Endpoint'ler tanımlandı:
- **`POST /api/complaints/`**: Frontend'den resim ve açıklama gönderildiğinde analiz motoruna sokulur. Spam ise HTTP 400 dönülür. Spam değilse risk skoru ile kaydedilir.
- **`GET /api/complaints/`**: Yönetici panelinde şikayetleri listelemek için kullanılır. Tüm şikayetleri **Risk Skoruna göre (en yüksekten en düşüğe)** sıralayarak döner.
- **`GET /api/complaints/track/{tracking_code}`**: Vatandaşın takip numarası ile şikayet durumunu sorgulaması.
- **`PATCH /api/complaints/{id}/status`**: Şikayet durumunu güncelleyen endpoint.
- **`PATCH /api/complaints/{id}/details`**: Şikayet detaylarını düzenleyen endpoint.
- **`POST /api/complaints/{id}/notes`**: Şikayete not ekleme endpoint'i.
- **`DELETE /api/complaints/{id}`**: Şikayeti silme endpoint'i.

### 2. `ai_engine.py` (Görüntü Analiz ve Sınıflandırma Motoru)
Google Gemini API kullanılarak görüntü analizi yapılır:
- Gönderilen fotoğraf analiz edilerek ilgisiz/spam içerikler filtrelenir.
- Geçerli şikayetler için konu tespiti, departman yönlendirmesi, aciliyet kodu ve risk skoru belirlenir.
- API key yoksa mock veri ile çalışır.

### 3. `database.py` (Veritabanı Katmanı)
- SQLAlchemy ORM ile SQLite veritabanı kullanılır.
- Şikayet ve not modelleri tanımlanmıştır.
- Otomatik takip kodu üretimi yapılır.

## 🚀 Çalıştırma

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Sunucu `http://localhost:8000` adresinde başlar. API dokümantasyonu için `http://localhost:8000/docs` adresini ziyaret edin.
