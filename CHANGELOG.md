# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-05-23
### Added
- **SQLite Veritabanı Entegrasyonu:** Şikayetlerin silinmemesi için `SQLAlchemy` ile kalıcı veritabanı eklendi.
- **Gerçek Zamanlı Görüntü İşleme:** Yapay Zeka motoru metinden bağımsız hale getirilip, saf piksel/renk analizine (OpenCV) ve nesne tanımaya (MediaPipe) geçirildi.
- **Fotoğraf Kayıt (Uploads):** Yüklenen dosyaların backend içinde tutulup `image_url` ile sunulması sağlandı.
- **Takip Numarası Sistemi:** Şikayet oluşturanlara kısa takip kodu (Örn: BEYAZ-X8F2) verilip durum sorgulama (`GET /api/complaints/track/{code}`) eklendi.
- **Enum Destekli Durum Güncellemesi:** Şikayet statüsünü değiştirmek için sadece belirli değerleri (Bekliyor, İşleme Alındı, Çözüldü, Çözülemedi) kabul eden katı uç nokta (`PATCH /api/complaints/{id}/status`) eklendi.
- **Ortam Düzeltmeleri:** VS Code ortamının yanlış Python interpreter'ı (MSYS2) kullanması düzeltilip AppData Python ortamına geçildi.

## [1.0.0] - İlk Sürüm
### Added
- Proje başlangıcı.
- Backend FastAPI temel iskeleti (`main.py`).
- Yapay zeka Mock Motoru (`ai_engine.py`) - Triyaj ve spam filtresi simülasyonu.
- Frontend ekibi için `frontend_todo.md` oluşturuldu.
- `requirements.txt` eklendi.
