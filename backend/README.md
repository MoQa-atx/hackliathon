# Akıllı Şehir Şikayet Triyaj Sistemi - Backend Dokümantasyonu

Bu doküman, projeye sonradan dahil olan veya hackathon sırasında backend tarafında geliştirme yapacak ekip arkadaşları için hazırlanmıştır.

## 📁 Proje Yapısı

Projemizin backend kısmı **Python** ve **FastAPI** kullanılarak geliştirilmiştir. Hızlı çalışması ve otomatik API dokümantasyonu (Swagger) oluşturması hackathon için büyük avantajdır.

```text
backend/
├── main.py              # Uygulamanın giriş noktası. Tüm API uç noktaları (endpoints) buradadır.
├── ai_engine.py         # Yapay zeka ve kural bazlı triyaj (risk skoru/spam) motorumuz.
├── requirements.txt     # Proje bağımlılıkları (pip install -r requirements.txt)
└── README.md            # Bu dosya.
```

## 🧠 Nasıl Çalışıyor?

### 1. `main.py` (API Katmanı)
Burada iki adet temel Endpoint tanımladık:
- **`POST /api/complaints/`**: Frontend ekibinin vatandaş uygulamasından resim ve açıklama göndereceği uç noktadır. Gelen istek doğrudan `ai_engine`'e sokulur. Eğer resim spam ise (`is_spam=True`), HTTP 400 hatası dönülür ve veritabanına işlenmez. Spam değilse, atanan risk skoru ile kaydedilir.
- **`GET /api/complaints/`**: Belediye Dashboard'unda şikayetleri listelemek için kullanılır. Tüm şikayetleri **Risk Skoruna göre (en yüksekten en düşüğe)** sıralayarak döner. (Acil olanlar en üstte yer alır).
- Veritabanı olarak hız kazanmak için şimdilik bellekte (`db_complaints = []` listesi) tutuluyor. (İstenirse 5 dakikada SQLite'a çevrilebilir).

### 2. `ai_engine.py` (Gerçek Zamanlı AI Triyaj ve Filtre Katmanı)
Sisteme sahte veriler göndermek yerine, Google'ın **MediaPipe (EfficientDet)** nesne tanıma (Object Detection) yapay zeka modelini entegre ettik.
- Model sadece 4 MB boyutundadır (`efficientdet_lite0.tflite`) ve internet gerektirmeden yerel çalışır.
- Eğer birisi sisteme "Selfie", "Kedi", "Köpek", "Pizza" gibi gereksiz veya şikayetle alakası olmayan fotoğraflar yüklerse, MediaPipe bu nesneleri saniyeler içinde COCO etiketlerinden tespit eder ve anında **%100 SPAM** (Alakasız Nesne Tespit Edildi) olarak reddeder.
- Eğer spam bir nesne tespit edilmezse, fotoğrafın adı ve rastgele seçilen yüksek güven skorlarıyla beraber sisteme geçerli bir belediye şikayeti olarak işlenir. (Demo günü modelin çukurları tam tanıması için vakit kalırsa özel model eğitilebilir).

## 🚀 Geliştirici İçin Adımlar (Ne Ekleyebiliriz?)

Eğer backend ekibi olarak vaktiniz varsa şu görevleri üstlenebilirsiniz:
1. **SQLite Entegrasyonu**: Sunucu yeniden başlatıldığında veriler siliniyor. Bunu önlemek için basit bir `sqlite3` veya `SQLAlchemy` entegrasyonu yapılabilir.
2. **Durum Güncelleme API'si**: Şikayetin durumunu "Bekliyor" statüsünden "Çözüldü" statüsüne geçirecek bir `PATCH /api/complaints/{id}/status` endpointi eklenebilir (Belediye dashboard'u için).
3. **Konum Verisi (Lat/Lng)**: Post isteğinde Enlem ve Boylam parametreleri de alıp JSON'a kaydedebiliriz. Böylece frontend haritada pin gösterebilir.
