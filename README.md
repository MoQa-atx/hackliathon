# 🏙️ Kent Göz — Akıllı Kent Hizmetleri Platformu

Kent Göz, vatandaşların çevre sorunlarını, altyapı hasarlarını ve kentsel aksaklıkları **fotoğraf çekerek** bildirmelerini sağlayan akıllı bir şikayet yönetim sistemidir. Gönderilen bildirimler otomatik olarak sınıflandırılır, önceliklendirilir ve ilgili birime yönlendirilir.

---

## ✨ Öne Çıkan Özellikler

| Özellik | Açıklama |
|---|---|
| 📸 Fotoğraflı Bildirim | Vatandaş doğrudan kamerasıyla çekip gönderir |
| 🔍 Otomatik Sınıflandırma | Görüntü analizi ile konu tespiti ve departman yönlendirmesi |
| 🚨 Aciliyet & Risk Skoru | Kırmızı / Sarı / Yeşil Kod sistemi + 0-100 risk puanı |
| 🗺️ Harita Görünümü | Tüm bildirimlerin konum bazlı Leaflet haritası üzerinde gösterimi |
| 🔎 Takip Kodu | Her bildirime özel takip numarası (Örn: `BEYAZ-A7X9`) |
| 🛡️ Spam Filtresi | İlgisiz/troll görsellerin otomatik engellenmesi |
| 📝 Not Sistemi | Görevlilerin vakaya not ekleyebilmesi |
| 🎮 Oyunlaştırma | Çevre Bilinci Puanı ile vatandaş motivasyonu |

---

## 🏗️ Mimari

```
hackliathon/
├── backend/              # Python FastAPI sunucusu
│   ├── main.py           # API endpoint'leri
│   ├── ai_engine.py      # Görüntü analiz motoru (Gemini API)
│   ├── database.py       # SQLAlchemy modelleri
│   └── requirements.txt
├── frontend/             # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx       # Ana uygulama bileşeni
│   │   ├── App.css       # Stiller
│   │   └── main.jsx      # Giriş noktası
│   └── index.html
├── .gitignore
├── CHANGELOG.md
└── README.md             # Bu dosya
```

---

## 🚀 Kurulum & Çalıştırma

### Ön Gereksinimler
- Python 3.10+
- Node.js 18+
- Google Gemini API Key

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

# .env dosyasına API key ekleyin
echo GEMINI_API_KEY=your_key_here > .env

python main.py
```

Backend `http://localhost:8000` adresinde başlar.  
Swagger API dokümantasyonu: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` adresinde başlar.

---

## 📡 API Endpoint'leri

| Metod | Yol | Açıklama |
|---|---|---|
| `POST` | `/api/complaints/` | Yeni şikayet oluştur (fotoğraf + açıklama) |
| `GET` | `/api/complaints/` | Tüm şikayetleri listele (risk skoruna göre) |
| `GET` | `/api/complaints/track/{code}` | Takip koduyla şikayet sorgula |
| `PATCH` | `/api/complaints/{id}/status` | Şikayet durumunu güncelle |
| `PATCH` | `/api/complaints/{id}/details` | Şikayet detaylarını düzenle |
| `POST` | `/api/complaints/{id}/notes` | Şikayete not ekle |
| `DELETE` | `/api/complaints/{id}` | Şikayeti sil |

---

## 🖥️ Ekranlar

### Vatandaş Portalı
- Fotoğraf çekme / yükleme
- Konum ekleme (GPS)
- Şikayet takip sorgulama
- Çevre Bilinci Puanı

### Yönetici Paneli
- Şikayet listesi (filtreleme: Aktif / Arşiv / Tümü)
- Harita görünümü (Leaflet)
- Detay paneli (düzenleme, not ekleme, durum değiştirme)
- Şikayet silme

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Frontend | React 19, Vite, Leaflet.js, Lucide Icons |
| Analiz | Google Gemini API |
| Harita | OpenStreetMap + Leaflet |

---

## 📄 Lisans

Bu proje hackathon kapsamında geliştirilmiştir.
