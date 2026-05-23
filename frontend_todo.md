# Frontend Ekibi İçin TODO Listesi (Hackathon)

Merhaba Frontend Ekibi! Vaktimiz az, bu yüzden hızlıca odaklanmamız gereken kritik bileşenler şunlar:

## 1. Backend İletişimi (API Entegrasyonu)
Backend ayağa kalktığında `http://localhost:8000/docs` adresinde Swagger UI (Otomatik API Dokümantasyonu) sizi karşılayacak. Bütün endpointleri ve örnek JSON'ları oradan görebilirsiniz.

- [x] **Şikayet Gönderme (POST /api/complaints/):**
  - Vatandaşın resim, konum (opsiyonel) ve açıklama girebileceği bir form ekranı yapın.
  - **ÖNEMLİ (Konum):** Tarayıcının `navigator.geolocation.getCurrentPosition` API'sini kullanarak kullanıcının konumuna izin isteyin. Eğer izin verirse `latitude` ve `longitude` değerlerini de forma ekleyin.
  - Form verisini (Multipart form data olarak `description`, `image`, `latitude`, `longitude`) backend'e gönderin.
  - **Önemli:** Eğer backend `400 Bad Request` veya hata dönerse (Spam filtresine takılırsa), kullanıcıya güzel bir pop-up ile hata gösterin.
  - **Önemli (Takip Kodu):** Başarılı bir gönderim sonrası dönen JSON'da `tracking_code` (Örn: `BEYAZ-A7X9`) bulunacak. Bu kodu kullanıcıya ekranda büyük bir şekilde gösterin.

- [x] **Şikayet Sorgulama (GET /api/complaints/track/{tracking_code}):**
  - Vatandaşın anasayfada şikayet durumunu sorgulayabileceği bir arama kutusu tasarlayın.
  - Vatandaş kodunu girdiğinde bu endpoint'e istek atıp güncel durumu (`status`) gösterin.

- [x] **Yönetici Paneli (GET /api/complaints/):**
  - Yönetici ekranını tasarlayın. (Modern, temiz, soluk beyaz tonları - kurumsal görünüm)
  - Backend'den gelen şikayetleri listele.
  - Listede **Risk Skoru** ve **Aciliyet Durumu** (Kırmızı Kod, Sarı Kod, Yeşil Kod) bazlı renkli etiketler (Badge) gösterin.

- [x] **Yönetici Paneli - Durum Güncelleme (PATCH /api/complaints/{id}/status):**
  - Yetkililer şikayeti inceledikten sonra durumunu değiştirebilsin.
  - **DİKKAT:** API sadece şu 4 kelimeyi kabul eder:
    1. `"Bekliyor"`
    2. `"İşleme Alındı"`
    3. `"Çözüldü"`
    4. `"Çözülemedi"`

## 2. Kullanıcı Deneyimi (UX) Katmanı (Vatandaş Ekranı)
- [x] **Kamera Desteği:** Mobil cihazlarda doğrudan kamerayı açmaya yönlendiren buton.
- [x] **Oyunlaştırma:** Vatandaş şikayet gönderdiğinde "Çevre Bilinci Puanım" sistemi.

## 3. Yönetici Paneli UI
- [x] Şikayetlerin düştüğü ana ekran.
- [x] **Harita Görünümü:** Leaflet.js haritası ile şikayetlerin konum bazlı gösterimi.
- [x] Şikayetin detayına tıklandığında:
  - Tespit edilen konu (Örn: Su Patlağı)
  - Yönlendirilen Departman (Örn: Fen İşleri)
  - Risk Skoru (Örn: %92)
  - Not ekleme ve düzenleme
