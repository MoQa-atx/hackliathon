# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-05-23
### Added
- **SQLite Veritabanı Entegrasyonu:** Şikayetlerin silinmemesi için `SQLAlchemy` ile kalıcı veritabanı eklendi.
- **Gerçek Zamanlı Görüntü Analizi:** Google Gemini API ile görüntü analizi ve sınıflandırma entegre edildi.
- **Fotoğraf Kayıt (Uploads):** Yüklenen dosyaların backend içinde tutulup `image_url` ile sunulması sağlandı.
- **Takip Numarası Sistemi:** Şikayet oluşturanlara kısa takip kodu (Örn: BEYAZ-X8F2) verilip durum sorgulama (`GET /api/complaints/track/{code}`) eklendi.
- **Enum Destekli Durum Güncellemesi:** Şikayet statüsünü değiştirmek için sadece belirli değerleri (Bekliyor, İşleme Alındı, Çözüldü, Çözülemedi) kabul eden katı uç nokta (`PATCH /api/complaints/{id}/status`) eklendi.
- **Not Sistemi:** Görevlilerin şikayetlere not ekleyebilmesi için endpoint eklendi.
- **Yönetici Paneli:** Şikayet detaylarını düzenleme, silme ve harita görünümü eklendi.
- **Frontend:** Vatandaş portalı ve yönetici paneli React + Vite ile geliştirildi.

## [1.0.0] - İlk Sürüm
### Added
- Proje başlangıcı.
- Backend FastAPI temel iskeleti (`main.py`).
- Görüntü analiz motoru (`ai_engine.py`) - Sınıflandırma ve spam filtresi.
- Frontend ekibi için `frontend_todo.md` oluşturuldu.
- `requirements.txt` eklendi.
